-- INSTRUCTOR PHASE 2: assignments + student submissions (files only; video only if the assignment allows it)
-- Run once in the Supabase SQL editor. Additive: new tables, helper functions, trigger, private storage bucket.

-- 1) Tables -------------------------------------------------------------
create table if not exists public.assignments (
  id           bigint generated always as identity primary key,
  course_id    bigint not null references public.courses(id) on delete cascade,
  title        text not null,
  description  text,
  due_at       timestamptz,
  max_score    numeric not null default 100 check (max_score > 0),
  allow_video  boolean not null default false,
  created_by   uuid default auth.uid(),
  created_at   timestamptz not null default now()
);

create table if not exists public.submissions (
  id            bigint generated always as identity primary key,
  assignment_id bigint not null references public.assignments(id) on delete cascade,
  student_id    uuid not null default auth.uid(),
  file_path     text not null,
  file_name     text,
  file_type     text,
  file_size     bigint,
  comment       text,
  submitted_at  timestamptz not null default now(),
  score         numeric,
  feedback      text,
  graded_at     timestamptz,
  graded_by     uuid,
  unique (assignment_id, student_id)
);

create index if not exists assignments_course_idx on public.assignments(course_id);
create index if not exists submissions_assignment_idx on public.submissions(assignment_id);

-- 2) Helper functions (SECURITY DEFINER avoids RLS recursion) -------------
create or replace function public.assignment_course(aid bigint)
returns bigint language sql stable security definer set search_path = public as $$
  select course_id from public.assignments where id = aid
$$;

create or replace function public.teaches_assignment(aid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.teaches_course(a.course_id), false) or coalesce(public.is_admin(), false)
  from public.assignments a where a.id = aid
$$;

create or replace function public.is_enrolled_in_assignment(aid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.assignments a
    join public.enrollments e on e.course_id = a.course_id
    where a.id = aid and e.user_id = auth.uid()
  )
$$;

-- 3) RLS ------------------------------------------------------------------
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "Assignments readable by course members" on public.assignments;
create policy "Assignments readable by course members" on public.assignments
  for select to authenticated
  using (public.is_enrolled_in_assignment(id) or public.teaches_course(course_id) or public.is_admin());

drop policy if exists "Instructors insert assignments" on public.assignments;
create policy "Instructors insert assignments" on public.assignments
  for insert to authenticated
  with check (public.teaches_course(course_id) or public.is_admin());

drop policy if exists "Instructors update assignments" on public.assignments;
create policy "Instructors update assignments" on public.assignments
  for update to authenticated
  using (public.teaches_course(course_id) or public.is_admin())
  with check (public.teaches_course(course_id) or public.is_admin());

drop policy if exists "Instructors delete assignments" on public.assignments;
create policy "Instructors delete assignments" on public.assignments
  for delete to authenticated
  using (public.teaches_course(course_id) or public.is_admin());

drop policy if exists "Submissions readable by owner and teacher" on public.submissions;
create policy "Submissions readable by owner and teacher" on public.submissions
  for select to authenticated
  using (student_id = auth.uid() or public.teaches_assignment(assignment_id));

drop policy if exists "Students submit to enrolled courses" on public.submissions;
create policy "Students submit to enrolled courses" on public.submissions
  for insert to authenticated
  with check (student_id = auth.uid() and public.is_enrolled_in_assignment(assignment_id));

drop policy if exists "Students resubmit or teachers grade" on public.submissions;
create policy "Students resubmit or teachers grade" on public.submissions
  for update to authenticated
  using (student_id = auth.uid() or public.teaches_assignment(assignment_id))
  with check (student_id = auth.uid() or public.teaches_assignment(assignment_id));

drop policy if exists "Students delete own ungraded submission" on public.submissions;
create policy "Students delete own ungraded submission" on public.submissions
  for delete to authenticated
  using ((student_id = auth.uid() and graded_at is null) or public.teaches_assignment(assignment_id));

-- 4) Guard trigger: students cannot grade, change owner, or edit after grading; size/type limits ----
create or replace function public.guard_submission()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  teacher boolean := coalesce(public.teaches_assignment(new.assignment_id), false);
  vid boolean;
  is_video boolean := coalesce(new.file_type, '') like 'video/%';
  max_bytes bigint;
begin
  if not teacher then
    if tg_op = 'INSERT' then
      new.student_id := auth.uid();
      new.score := null; new.feedback := null; new.graded_at := null; new.graded_by := null;
    else
      if old.graded_at is not null then
        raise exception 'This submission is already graded and can no longer be changed';
      end if;
      new.student_id := old.student_id;
      new.assignment_id := old.assignment_id;
      new.score := old.score; new.feedback := old.feedback;
      new.graded_at := old.graded_at; new.graded_by := old.graded_by;
    end if;
    new.submitted_at := now();

    select allow_video into vid from public.assignments where id = new.assignment_id;
    if is_video and not coalesce(vid, false) then
      raise exception 'Video uploads are not allowed for this assignment';
    end if;
    max_bytes := case when is_video then 52428800 else 10485760 end;
    if coalesce(new.file_size, 0) > max_bytes then
      raise exception 'File is too large (max 10MB, or 50MB for video)';
    end if;
  else
    if tg_op = 'UPDATE' and (new.score is distinct from old.score or new.feedback is distinct from old.feedback) then
      new.graded_at := now();
      new.graded_by := auth.uid();
    end if;
    if new.score is not null and new.score > (select max_score from public.assignments where id = new.assignment_id) then
      raise exception 'Score cannot exceed the assignment maximum';
    end if;
    if tg_op = 'UPDATE' then
      new.student_id := old.student_id;
      new.assignment_id := old.assignment_id;
      new.file_path := old.file_path; new.file_name := old.file_name;
      new.file_type := old.file_type; new.file_size := old.file_size;
      new.comment := old.comment; new.submitted_at := old.submitted_at;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists guard_submission_trg on public.submissions;
create trigger guard_submission_trg before insert or update on public.submissions
  for each row execute function public.guard_submission();

-- 5) Private storage bucket: <assignment_id>/<student_id>/<file> --------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('submissions', 'submissions', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

drop policy if exists "Students upload own submission files" on storage.objects;
create policy "Students upload own submission files" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[2] = auth.uid()::text
    and public.is_enrolled_in_assignment(((storage.foldername(name))[1])::bigint)
  );

drop policy if exists "Read own or taught submission files" on storage.objects;
create policy "Read own or taught submission files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'submissions'
    and ((storage.foldername(name))[2] = auth.uid()::text
         or public.teaches_assignment(((storage.foldername(name))[1])::bigint))
  );

drop policy if exists "Students delete own submission files" on storage.objects;
create policy "Students delete own submission files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'submissions' and (storage.foldername(name))[2] = auth.uid()::text);
