-- Visitors (not logged in) can READ the course catalog so the public Home / Courses pages show courses.
-- Read-only: anon cannot insert / update / delete.
drop policy if exists "Visitors can view courses" on public.courses;
create policy "Visitors can view courses"
  on public.courses for select to anon using (true);
