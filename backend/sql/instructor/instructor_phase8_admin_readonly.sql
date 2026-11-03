-- INSTRUCTOR PHASE 8: the admin is a read-only observer of instructor work.
-- Run once in the Supabase SQL editor (idempotent). Removes the admin from:
--   * assignments and quizzes: create / edit / delete (the admin can still read them)
--   * quiz questions + answer keys, student submissions and quiz attempts: read / grade / reset
--     (these all go through teaches_assignment() / teaches_quiz(), which no longer accept the admin)
--   * certificate approval: only the course instructor decides (decide_certificate / set_course_cert_approval)
--   * notify_course_students: only the course instructor
-- Unchanged: the admin still creates / deletes courses and assigns the instructor, manages users, roles,
-- site settings, messages, general notifications and general sessions. Deleting a course still cascades.

create or replace function public.teaches_assignment(aid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.teaches_course(a.course_id), false)
  from public.assignments a where a.id = aid
$$;

create or replace function public.teaches_quiz(qid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.teaches_course(q.course_id), false)
  from public.quizzes q where q.id = qid
$$;

-- assignments (admin keeps the read policy "Assignments readable by course members")
drop policy if exists "Instructors insert assignments" on public.assignments;
create policy "Instructors insert assignments" on public.assignments
  for insert to authenticated with check (public.teaches_course(course_id));
drop policy if exists "Instructors update assignments" on public.assignments;
create policy "Instructors update assignments" on public.assignments
  for update to authenticated using (public.teaches_course(course_id)) with check (public.teaches_course(course_id));
drop policy if exists "Instructors delete assignments" on public.assignments;
create policy "Instructors delete assignments" on public.assignments
  for delete to authenticated using (public.teaches_course(course_id));

-- quizzes (admin keeps the read policy "Quizzes readable by course members")
drop policy if exists "Instructors insert quizzes" on public.quizzes;
create policy "Instructors insert quizzes" on public.quizzes
  for insert to authenticated with check (public.teaches_course(course_id));
drop policy if exists "Instructors update quizzes" on public.quizzes;
create policy "Instructors update quizzes" on public.quizzes
  for update to authenticated using (public.teaches_course(course_id)) with check (public.teaches_course(course_id));
drop policy if exists "Instructors delete quizzes" on public.quizzes;
create policy "Instructors delete quizzes" on public.quizzes
  for delete to authenticated using (public.teaches_course(course_id));

create or replace function public.decide_certificate(p_enrollment_id bigint, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare e record; ctitle text;
begin
  select en.id, en.user_id, en.course_id, en.completed into e from enrollments en where en.id = p_enrollment_id;
  if not found then raise exception 'Enrollment not found'; end if;
  if auth.uid() is null or not public.teaches_course(e.course_id) then
    raise exception 'Not allowed';
  end if;
  if not coalesce(e.completed, false) then raise exception 'The student has not completed the course yet'; end if;
  insert into certificate_approvals(enrollment_id, approved, note, decided_by, decided_at)
  values (e.id, p_approve, nullif(left(trim(coalesce(p_note, '')), 500), ''), auth.uid(), now())
  on conflict (enrollment_id) do update
    set approved = excluded.approved, note = excluded.note, decided_by = excluded.decided_by, decided_at = excluded.decided_at;
  select title into ctitle from courses where id = e.course_id;
  insert into notifications(user_id, title, message)
  values (e.user_id,
          case when p_approve then 'Certificate approved 🎓' else 'Certificate not approved yet' end,
          case when p_approve then 'Your instructor approved your certificate for "' || ctitle || '". It is ready in your dashboard.'
               else 'Your instructor reviewed "' || ctitle || '".' || coalesce(' Note: ' || nullif(left(trim(coalesce(p_note, '')), 300), ''), '') end);
end $$;

create or replace function public.set_course_cert_approval(p_course_id bigint, p_required boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.teaches_course(p_course_id) then
    raise exception 'Not allowed';
  end if;
  update courses set requires_cert_approval = p_required where id = p_course_id;
end $$;

create or replace function public.notify_course_students(cid bigint, ttl text, msg text)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null or not public.teaches_course(cid) then
    raise exception 'Not allowed';
  end if;
  insert into public.notifications(user_id, title, message)
  select e.user_id, left(ttl, 200), left(msg, 1000) from public.enrollments e where e.course_id = cid;
  get diagnostics n = row_count;
  return n;
end $$;
