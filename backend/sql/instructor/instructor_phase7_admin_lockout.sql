-- INSTRUCTOR PHASE 7: lessons and live sessions belong to the course instructor only.
-- Run once in the Supabase SQL editor. Removes the admin WRITE policies (insert / update / delete)
-- on lessons, sessions and the lesson-files bucket. Admins can still READ everything.
--
-- Not affected:
--   * instructors keep full control of their own courses' lessons / sessions / files
--   * deleting a course (admin) still removes its lessons and sessions (ON DELETE CASCADE)
-- Note: old "general" sessions (no course) can no longer be edited from the app; use the SQL editor.

drop policy if exists "Admins can insert lessons" on public.lessons;
drop policy if exists "Admins can update lessons" on public.lessons;
drop policy if exists "Admins can delete lessons" on public.lessons;

drop policy if exists "Admins can insert sessions" on public.sessions;
drop policy if exists "Admins can update sessions" on public.sessions;
drop policy if exists "Admins can delete sessions" on public.sessions;

drop policy if exists "Admins can upload lesson files" on storage.objects;
drop policy if exists "Admins can delete lesson files" on storage.objects;
