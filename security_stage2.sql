-- STAGE 2 SECURITY: no more forged certificates / no more open course editing.
-- Safe order: run this SQL, then deploy the code (old code keeps working).

-- 1) Enrollment progress & completion are computed on the server for non-admins
create or replace function public.enforce_enrollment_progress()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_total int; v_done int;
begin
  if auth.uid() is null or (select public.is_admin()) then
    return new;                         -- admins / SQL editor / service role
  end if;

  if tg_op = 'INSERT' then
    new.progress := 0;
    new.completed := false;
    return new;
  end if;

  new.user_id := old.user_id;           -- can't re-assign an enrollment
  new.course_id := old.course_id;

  select count(*) into v_total from public.lessons where course_id = new.course_id;
  select count(distinct lesson_id) into v_done from public.lesson_progress
   where user_id = new.user_id and course_id = new.course_id and completed;

  if v_total = 0 then
    new.progress := 100;                -- same rule the app already used
  else
    new.progress := least(100, round(v_done * 100.0 / v_total))::int;
  end if;
  new.completed := new.progress >= 100;
  return new;
end $$;

drop trigger if exists trg_enforce_enrollment_progress on public.enrollments;
create trigger trg_enforce_enrollment_progress
  before insert or update on public.enrollments
  for each row execute function public.enforce_enrollment_progress();

-- 2) Students counter maintained by the database (not by the browser)
create or replace function public.sync_course_students()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.courses set students = coalesce(students, 0) + 1 where id = new.course_id;
  elsif tg_op = 'DELETE' then
    update public.courses set students = greatest(coalesce(students, 0) - 1, 0) where id = old.course_id;
  end if;
  return null;
end $$;

drop trigger if exists trg_sync_course_students on public.enrollments;
create trigger trg_sync_course_students
  after insert or delete on public.enrollments
  for each row execute function public.sync_course_students();

-- 3) Course editing: admins only
drop policy if exists "Authenticated users can update courses" on public.courses;
drop policy if exists "Admins can update courses" on public.courses;
create policy "Admins can update courses" on public.courses
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- 4) Trigger functions must not be callable from the API
revoke execute on function public.enforce_enrollment_progress() from public, anon, authenticated;
revoke execute on function public.sync_course_students() from public, anon, authenticated;
