-- INSTRUCTOR PHASE 7: lessons and course live sessions belong to the course instructor only.
-- Run once in the Supabase SQL editor. Removes the admin WRITE policies (insert / update / delete)
-- on lessons and the lesson-files bucket, and limits the admin's write access on sessions to
-- GENERAL sessions (course_id is null, the old site-wide ones). Admins can still READ everything.
--
-- Not affected:
--   * instructors keep full control of their own courses' lessons / sessions / files
--   * deleting a course (admin) still removes its lessons and sessions (ON DELETE CASCADE)

drop policy if exists "Admins can insert lessons" on public.lessons;
drop policy if exists "Admins can update lessons" on public.lessons;
drop policy if exists "Admins can delete lessons" on public.lessons;

-- sessions: the admin keeps ONLY general sessions (no course). A course session can never be
-- created, edited, deleted or re-assigned to a course by the admin.
drop policy if exists "Admins can insert sessions" on public.sessions;
drop policy if exists "Admins can update sessions" on public.sessions;
drop policy if exists "Admins can delete sessions" on public.sessions;
drop policy if exists "Admins insert general sessions" on public.sessions;
drop policy if exists "Admins update general sessions" on public.sessions;
drop policy if exists "Admins delete general sessions" on public.sessions;

create policy "Admins insert general sessions" on public.sessions
  for insert to authenticated with check (course_id is null and public.is_admin());
create policy "Admins update general sessions" on public.sessions
  for update to authenticated using (course_id is null and public.is_admin())
  with check (course_id is null and public.is_admin());
create policy "Admins delete general sessions" on public.sessions
  for delete to authenticated using (course_id is null and public.is_admin());

drop policy if exists "Admins can upload lesson files" on storage.objects;
drop policy if exists "Admins can delete lesson files" on storage.objects;
