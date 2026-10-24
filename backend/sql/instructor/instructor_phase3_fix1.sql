-- FIX 1 for instructor_phase3.sql: an admin/instructor who is ENROLLED in the course and takes the quiz as a student
-- now gets a real session (timer + attempt), so submitting works. Safe to run on top of the current phase 3.

-- Start (or resume) the quiz: returns the questions WITHOUT answers plus the server-side timer
create or replace function public.get_quiz_questions(qid bigint, pwd text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  q record; sess record; used int; lim interval; grace interval := interval '30 seconds';
  started timestamptz; ends timestamptz; qs jsonb;
begin
  if auth.uid() is null then raise exception 'Not allowed'; end if;
  select * into q from public.quizzes where id = qid;
  if not found then raise exception 'Not allowed'; end if;

  if public.teaches_quiz(qid) and not public.is_enrolled_in_quiz(qid) then
    null; -- a teacher who is NOT enrolled can preview: no password, no timer, no attempt used
  else   -- students, and teachers/admins who are enrolled (testing as a student), follow the real flow
    if not public.is_enrolled_in_quiz(qid) or not q.published then raise exception 'Not allowed'; end if;
    if not public.quiz_password_ok(qid, pwd) then raise exception 'Wrong quiz password'; end if;
    if q.time_limit_min is not null then lim := make_interval(mins => q.time_limit_min); end if;

    select * into sess from public.quiz_sessions
     where quiz_id = qid and student_id = auth.uid() and not closed
     order by started_at desc limit 1;

    if found and (lim is null or now() <= sess.started_at + lim + grace) then
      started := sess.started_at;                       -- resume the open session
    else
      if found then update public.quiz_sessions set closed = true where id = sess.id; end if;  -- expired: it stays counted
      select count(*) into used from public.quiz_sessions where quiz_id = qid and student_id = auth.uid();
      if q.max_attempts is not null and used >= q.max_attempts then raise exception 'No attempts left'; end if;
      insert into public.quiz_sessions(quiz_id, student_id) values (qid, auth.uid()) returning started_at into started;
    end if;
    if lim is not null then ends := started + lim; end if;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'kind', kind, 'prompt', prompt, 'options', options, 'points', points)
                            order by position, id), '[]'::jsonb)
    into qs from public.quiz_questions where quiz_id = qid;

  return jsonb_build_object('questions', qs, 'time_limit_min', q.time_limit_min,
                            'started_at', started, 'ends_at', ends, 'server_now', now());
end $$;

grant execute on function public.get_quiz_questions(bigint, text) to authenticated;
