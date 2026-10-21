-- INSTRUCTOR PHASE 3: quizzes (multiple choice, auto-graded on the server)
-- Run after instructor_phase2.sql. Additive.
-- Students never read quiz_questions directly (it holds the right answers): they use
-- get_quiz_questions() (no answers) and submit_quiz() (grades on the server).

create table if not exists public.quizzes (
  id           bigint generated always as identity primary key,
  course_id    bigint not null references public.courses(id) on delete cascade,
  title        text not null,
  description  text,
  pass_score   int not null default 60 check (pass_score between 0 and 100),
  max_attempts int check (max_attempts is null or max_attempts > 0),
  show_answers boolean not null default true,
  published    boolean not null default true,
  created_by   uuid default auth.uid(),
  created_at   timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id            bigint generated always as identity primary key,
  quiz_id       bigint not null references public.quizzes(id) on delete cascade,
  position      int not null default 1,
  prompt        text not null,
  options       jsonb not null,
  correct_index int not null,
  check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6
         and correct_index >= 0 and correct_index < jsonb_array_length(options))
);

create table if not exists public.quiz_attempts (
  id           bigint generated always as identity primary key,
  quiz_id      bigint not null references public.quizzes(id) on delete cascade,
  student_id   uuid not null,
  answers      jsonb,
  correct      int not null,
  total        int not null,
  score        numeric not null,
  passed       boolean not null,
  submitted_at timestamptz not null default now()
);

create index if not exists quizzes_course_idx on public.quizzes(course_id);
create index if not exists quiz_questions_quiz_idx on public.quiz_questions(quiz_id);
create index if not exists quiz_attempts_quiz_student_idx on public.quiz_attempts(quiz_id, student_id);

-- Helpers (SECURITY DEFINER avoids RLS recursion)
create or replace function public.teaches_quiz(qid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.teaches_course(q.course_id), false) or coalesce(public.is_admin(), false)
  from public.quizzes q where q.id = qid
$$;

create or replace function public.is_enrolled_in_quiz(qid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.quizzes q
    join public.enrollments e on e.course_id = q.course_id
    where q.id = qid and e.user_id = auth.uid()
  )
$$;

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;

drop policy if exists "Quizzes readable by course members" on public.quizzes;
create policy "Quizzes readable by course members" on public.quizzes
  for select to authenticated
  using (public.is_enrolled_in_quiz(id) or public.teaches_course(course_id) or public.is_admin());

drop policy if exists "Instructors insert quizzes" on public.quizzes;
create policy "Instructors insert quizzes" on public.quizzes
  for insert to authenticated with check (public.teaches_course(course_id) or public.is_admin());

drop policy if exists "Instructors update quizzes" on public.quizzes;
create policy "Instructors update quizzes" on public.quizzes
  for update to authenticated
  using (public.teaches_course(course_id) or public.is_admin())
  with check (public.teaches_course(course_id) or public.is_admin());

drop policy if exists "Instructors delete quizzes" on public.quizzes;
create policy "Instructors delete quizzes" on public.quizzes
  for delete to authenticated using (public.teaches_course(course_id) or public.is_admin());

-- Questions (with the right answers): teachers only
drop policy if exists "Teachers manage quiz questions" on public.quiz_questions;
create policy "Teachers manage quiz questions" on public.quiz_questions
  for all to authenticated
  using (public.teaches_quiz(quiz_id)) with check (public.teaches_quiz(quiz_id));

-- Attempts: read own (or taught); written only by submit_quiz(); teachers may reset
drop policy if exists "Attempts readable by owner and teacher" on public.quiz_attempts;
create policy "Attempts readable by owner and teacher" on public.quiz_attempts
  for select to authenticated
  using (student_id = auth.uid() or public.teaches_quiz(quiz_id));

drop policy if exists "Teachers reset attempts" on public.quiz_attempts;
create policy "Teachers reset attempts" on public.quiz_attempts
  for delete to authenticated using (public.teaches_quiz(quiz_id));

-- Questions without answers
create or replace function public.get_quiz_questions(qid bigint)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null or not (public.is_enrolled_in_quiz(qid) or public.teaches_quiz(qid)) then
    raise exception 'Not allowed';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'prompt', prompt, 'options', options) order by position, id)
    from public.quiz_questions where quiz_id = qid
  ), '[]'::jsonb);
end $$;

-- Grade on the server and store the attempt
create or replace function public.submit_quiz(qid bigint, answers jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  q record; r record; total int; good int := 0; used int; chosen int; pct numeric;
  did_pass boolean; review jsonb := '[]'::jsonb; aid bigint;
begin
  if auth.uid() is null or not public.is_enrolled_in_quiz(qid) then
    raise exception 'You must be enrolled in this course to take the quiz';
  end if;
  select * into q from public.quizzes where id = qid;
  if not found or not q.published then raise exception 'Quiz not available'; end if;

  select count(*) into used from public.quiz_attempts where quiz_id = qid and student_id = auth.uid();
  if q.max_attempts is not null and used >= q.max_attempts then raise exception 'No attempts left'; end if;

  select count(*) into total from public.quiz_questions where quiz_id = qid;
  if total = 0 then raise exception 'This quiz has no questions yet'; end if;

  for r in select id, correct_index from public.quiz_questions where quiz_id = qid order by position, id loop
    chosen := null;
    if answers is not null and jsonb_typeof(answers) = 'object'
       and jsonb_typeof(answers -> (r.id::text)) = 'number' then
      chosen := (answers ->> (r.id::text))::int;
    end if;
    if chosen is not null and chosen = r.correct_index then good := good + 1; end if;
    review := review || jsonb_build_object(
      'question_id', r.id, 'chosen', chosen,
      'is_correct', (chosen is not null and chosen = r.correct_index),
      'correct_index', case when q.show_answers then r.correct_index else null end);
  end loop;

  pct := round(good::numeric / total * 100, 1);
  did_pass := pct >= q.pass_score;
  insert into public.quiz_attempts(quiz_id, student_id, answers, correct, total, score, passed)
  values (qid, auth.uid(), answers, good, total, pct, did_pass) returning id into aid;

  return jsonb_build_object('attempt_id', aid, 'score', pct, 'correct', good, 'total', total,
                            'passed', did_pass, 'pass_score', q.pass_score, 'review', review);
end $$;

revoke execute on function public.get_quiz_questions(bigint) from public, anon;
revoke execute on function public.submit_quiz(bigint, jsonb) from public, anon;
grant execute on function public.get_quiz_questions(bigint) to authenticated;
grant execute on function public.submit_quiz(bigint, jsonb) to authenticated;
