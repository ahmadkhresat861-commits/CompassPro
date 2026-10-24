-- INSTRUCTOR PHASE 2b: files attached to an assignment by the instructor (instructions, templates, datasets...)
-- Run after instructor_phase2.sql. Additive.

create table if not exists public.assignment_files (
  id            bigint generated always as identity primary key,
  assignment_id bigint not null references public.assignments(id) on delete cascade,
  file_path     text not null,
  file_name     text,
  file_type     text,
  file_size     bigint,
  created_at    timestamptz not null default now()
);
create index if not exists assignment_files_assignment_idx on public.assignment_files(assignment_id);

alter table public.assignment_files enable row level security;

drop policy if exists "Assignment files readable by course members" on public.assignment_files;
create policy "Assignment files readable by course members" on public.assignment_files
  for select to authenticated
  using (public.is_enrolled_in_assignment(assignment_id) or public.teaches_assignment(assignment_id));

drop policy if exists "Teachers add assignment files" on public.assignment_files;
create policy "Teachers add assignment files" on public.assignment_files
  for insert to authenticated with check (public.teaches_assignment(assignment_id));

drop policy if exists "Teachers delete assignment files" on public.assignment_files;
create policy "Teachers delete assignment files" on public.assignment_files
  for delete to authenticated using (public.teaches_assignment(assignment_id));

-- Private bucket: <assignment_id>/<file>
insert into storage.buckets (id, name, public, file_size_limit)
values ('assignment-files', 'assignment-files', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

drop policy if exists "Teachers upload assignment files" on storage.objects;
create policy "Teachers upload assignment files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'assignment-files'
              and public.teaches_assignment(((storage.foldername(name))[1])::bigint));

drop policy if exists "Course members read assignment files" on storage.objects;
create policy "Course members read assignment files" on storage.objects
  for select to authenticated
  using (bucket_id = 'assignment-files'
         and (public.teaches_assignment(((storage.foldername(name))[1])::bigint)
              or public.is_enrolled_in_assignment(((storage.foldername(name))[1])::bigint)));

drop policy if exists "Teachers delete assignment files storage" on storage.objects;
create policy "Teachers delete assignment files storage" on storage.objects
  for delete to authenticated
  using (bucket_id = 'assignment-files'
         and public.teaches_assignment(((storage.foldername(name))[1])::bigint));
