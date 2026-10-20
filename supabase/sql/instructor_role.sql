-- INSTRUCTOR ROLE (phase 1+2)
-- Run once in the Supabase SQL editor. Additive: one new nullable column, one helper function, new policies.
-- Existing data and existing policies are untouched. Run protect_profile_type.sql first.

-- 1) Link a course to its instructor account (nullable; old courses keep the text name only)
alter table public.courses
  add column if not exists instructor_id uuid references auth.users(id) on delete set null;
create index if not exists idx_courses_instructor_id on public.courses (instructor_id);

-- 2) Helper: is the current user an instructor?
create or replace function public.is_instructor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where (id = auth.uid() or user_id = auth.uid()) and type = 'instructor'
  );
$$;

-- 3) Helper: does the current user teach this course?
create or replace function public.teaches_course(p_course_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.courses c
    where c.id = p_course_id and c.instructor_id = auth.uid()
  ) and public.is_instructor();
$$;

-- 4) profiles: a user can read their own row by id (accounts created by the admin function have a different user_id);
--    admins can change roles; instructors can read the names of students enrolled in their courses.
drop policy if exists "Users can read own profile by id" on public.profiles;
create policy "Users can read own profile by id"
  on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
  on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- NOTE: the student policy must go through a SECURITY DEFINER function. A direct subquery on
-- enrollments here causes "infinite recursion detected in policy for relation profiles".
create or replace function public.is_my_student(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_instructor() and exists (
    select 1 from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.user_id = p_user_id and c.instructor_id = auth.uid()
  );
$$;

drop policy if exists "Instructors can read their students" on public.profiles;
create policy "Instructors can read their students"
  on public.profiles for select to authenticated
  using (public.is_my_student(id));

-- 5) courses: instructors manage only their own courses (admins keep full control via existing policies)
drop policy if exists "Instructors can insert own courses" on public.courses;
create policy "Instructors can insert own courses"
  on public.courses for insert to authenticated
  with check (public.is_instructor() and instructor_id = auth.uid());

drop policy if exists "Instructors can update own courses" on public.courses;
create policy "Instructors can update own courses"
  on public.courses for update to authenticated
  using (public.is_instructor() and instructor_id = auth.uid())
  with check (public.is_instructor() and instructor_id = auth.uid());

-- 6) lessons: instructors manage lessons of their own courses
drop policy if exists "Instructors can insert lessons" on public.lessons;
create policy "Instructors can insert lessons"
  on public.lessons for insert to authenticated
  with check (public.teaches_course(course_id));

drop policy if exists "Instructors can update lessons" on public.lessons;
create policy "Instructors can update lessons"
  on public.lessons for update to authenticated
  using (public.teaches_course(course_id)) with check (public.teaches_course(course_id));

drop policy if exists "Instructors can delete lessons" on public.lessons;
create policy "Instructors can delete lessons"
  on public.lessons for delete to authenticated
  using (public.teaches_course(course_id));

-- 7) enrollments / lesson_progress: instructors can READ rows of their own courses (for statistics)
drop policy if exists "Instructors can view enrollments of own courses" on public.enrollments;
create policy "Instructors can view enrollments of own courses"
  on public.enrollments for select to authenticated using (public.teaches_course(course_id));

drop policy if exists "Instructors can view progress of own courses" on public.lesson_progress;
create policy "Instructors can view progress of own courses"
  on public.lesson_progress for select to authenticated using (public.teaches_course(course_id));

-- 8) storage 'lesson-files': files are stored under "<course_id>/<file>"; instructors only touch their own course folder
drop policy if exists "Instructors can upload lesson files" on storage.objects;
create policy "Instructors can upload lesson files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'lesson-files'
    and public.teaches_course(nullif((storage.foldername(name))[1], '')::bigint)
  );

drop policy if exists "Instructors can delete lesson files" on storage.objects;
create policy "Instructors can delete lesson files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'lesson-files'
    and public.teaches_course(nullif((storage.foldername(name))[1], '')::bigint)
  );

-- 9) Accounts created by the admin function have profiles.user_id != id (random default).
--    Let users update their own row by id too, so the Profile page works for them.
drop policy if exists "Users can update own profile by id" on public.profiles;
create policy "Users can update own profile by id"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
