-- ADVANCED NOTIFICATIONS
-- 1) personal notifications (user_id) + broadcast (user_id is null)
-- 2) automatic notifications: enrolled, course completed, new live session
-- 3) only admins can insert notifications from the client (triggers bypass this)

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where (id = auth.uid() or user_id = auth.uid()) and type = 'admin'
  );
$$;

alter table public.notifications
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Read: broadcasts for everyone, personal ones only for their owner
drop policy if exists "Enable read access for all users" on public.notifications;
drop policy if exists "Read broadcast and own notifications" on public.notifications;
create policy "Read broadcast and own notifications"
  on public.notifications for select
  using (user_id is null or user_id = auth.uid());

-- Insert: admins only (was: any authenticated user)
drop policy if exists "Allow authenticated users to insert notifications" on public.notifications;
drop policy if exists "Admins can insert notifications" on public.notifications;
create policy "Admins can insert notifications"
  on public.notifications for insert
  to authenticated
  with check (public.is_admin());

-- Trigger: user enrolls in a course
create or replace function public.notify_enrollment()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_title text;
begin
  select title into v_title from public.courses where id = new.course_id;
  insert into public.notifications (title, message, user_id)
  values ('Enrollment confirmed 🎉',
          'You are now enrolled in "' || coalesce(v_title, 'a course') || '". Happy learning!',
          new.user_id);
  return new;
end $$;

drop trigger if exists trg_notify_enrollment on public.enrollments;
create trigger trg_notify_enrollment
  after insert on public.enrollments
  for each row execute function public.notify_enrollment();

-- Trigger: course completed
create or replace function public.notify_completion()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_title text;
begin
  select title into v_title from public.courses where id = new.course_id;
  insert into public.notifications (title, message, user_id)
  values ('Course completed 🎓',
          'Congratulations! You completed "' || coalesce(v_title, 'the course') || '". Your certificate is ready in your dashboard.',
          new.user_id);
  return new;
end $$;

drop trigger if exists trg_notify_completion on public.enrollments;
create trigger trg_notify_completion
  after update of completed on public.enrollments
  for each row
  when (new.completed is true and old.completed is distinct from true)
  execute function public.notify_completion();

-- Trigger: new live session (broadcast)
create or replace function public.notify_new_session()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (title, message)
  values ('New live session 📅',
          coalesce(new.title, 'Live session') || ' — ' || coalesce(new.data, '') || ' ' || coalesce(new.time, ''));
  return new;
end $$;

drop trigger if exists trg_notify_new_session on public.sessions;
create trigger trg_notify_new_session
  after insert on public.sessions
  for each row execute function public.notify_new_session();
