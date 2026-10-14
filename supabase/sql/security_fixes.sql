-- SECURITY FIXES (safe: the app only inserts/deletes courses from the Admin panel)

-- 1) Courses: only admins can insert / delete (was: any logged-in user!)
drop policy if exists "Authenticated users can insert courses" on public.courses;
drop policy if exists "Authenticated users can delete courses" on public.courses;
drop policy if exists "Admins can insert courses" on public.courses;
drop policy if exists "Admins can delete courses" on public.courses;
create policy "Admins can insert courses" on public.courses
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can delete courses" on public.courses
  for delete to authenticated using ((select public.is_admin()));
-- NOTE: UPDATE stays open for now because enrolling increments courses.students
-- from the browser. Stage 2 (trigger + admin-only update) is a separate change.

-- 2) Reviews: remove the policy that lets anyone insert a review as another user
drop policy if exists "Enable insert for authenticated users only" on public.reviews;

-- 3) Remove duplicate (identical) policies -> faster queries
drop policy if exists "Users can enroll themselves" on public.enrollments;
drop policy if exists "Users can view their own enrollments" on public.enrollments;
drop policy if exists "Users can update their own enrollment" on public.enrollments;
drop policy if exists "Users can view reviews" on public.reviews;
drop policy if exists "Enable read access for all users" on public.reviews;
