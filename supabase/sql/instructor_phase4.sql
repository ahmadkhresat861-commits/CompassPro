-- INSTRUCTOR PHASE 4: live sessions tied to a course (+ notify students)
-- Run once in the Supabase SQL editor. Additive: new nullable columns on public.sessions, 1 helper, 1 RPC, policies.
-- Old sessions (created by the admin, no course) stay public exactly as before.
-- A session that belongs to a course (course_id set) is visible ONLY to the students enrolled in it,
-- the course's instructor and admins — so the meeting link is no longer public for course sessions.

alter table public.sessions
  add column if not exists course_id     bigint references public.courses(id) on delete cascade,
  add column if not exists starts_at     timestamptz,
  add column if not exists duration_min  int check (duration_min is null or duration_min > 0),
  add column if not exists description   text,
  add column if not exists recording_url text,
  add column if not exists created_by    uuid default auth.uid();

create index if not exists sessions_course_idx on public.sessions(course_id);

create or replace function public.is_enrolled_in_course(cid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.enrollments e where e.course_id = cid and e.user_id = auth.uid())
$$;

-- Read: legacy sessions (no course) stay public; course sessions only for members
drop policy if exists "Enable read access for all users" on public.sessions;
drop policy if exists "Sessions readable by members" on public.sessions;
create policy "Sessions readable by members" on public.sessions
  for select to anon, authenticated
  using (
    course_id is null
    or (auth.uid() is not null
        and (public.is_enrolled_in_course(course_id) or public.teaches_course(course_id) or public.is_admin()))
  );

-- Instructors manage the sessions of THEIR courses (admins keep their existing policies)
drop policy if exists "Instructors insert sessions" on public.sessions;
create policy "Instructors insert sessions" on public.sessions
  for insert to authenticated
  with check (course_id is not null and public.teaches_course(course_id));

drop policy if exists "Instructors update sessions" on public.sessions;
create policy "Instructors update sessions" on public.sessions
  for update to authenticated
  using (course_id is not null and public.teaches_course(course_id))
  with check (course_id is not null and public.teaches_course(course_id));

drop policy if exists "Instructors delete sessions" on public.sessions;
create policy "Instructors delete sessions" on public.sessions
  for delete to authenticated
  using (course_id is not null and public.teaches_course(course_id));

-- Notify every student enrolled in the course (teacher/admin only). Returns how many were notified.
create or replace function public.notify_course_students(cid bigint, ttl text, msg text)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null or not (public.teaches_course(cid) or public.is_admin()) then
    raise exception 'Not allowed';
  end if;
  insert into public.notifications(user_id, title, message)
  select e.user_id, left(ttl, 200), left(msg, 1000) from public.enrollments e where e.course_id = cid;
  get diagnostics n = row_count;
  return n;
end $$;

revoke execute on function public.notify_course_students(bigint, text, text) from public, anon;
grant execute on function public.notify_course_students(bigint, text, text) to authenticated;
revoke execute on function public.is_enrolled_in_course(bigint) from public, anon;
grant execute on function public.is_enrolled_in_course(bigint) to authenticated, anon;
