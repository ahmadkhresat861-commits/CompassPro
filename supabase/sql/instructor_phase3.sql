-- INSTRUCTOR PHASE 3: quizzes — multiple choice (auto-graded) + written questions (graded by the instructor),
-- optional quiz password (stored hashed, checked on the server) and an anti-cheat mode flag.
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
  anti_cheat   boolean not null default true,   -- block copy/paste, record leaving the page
  has_password boolean not null default false,  -- the password itself lives (hashed) in quiz_secrets
  created_by   uuid default auth.uid(),
  created_at   timestamptz not null default now()
);

-- Hashed quiz passwords. RLS on with NO policy: nobody reads it directly, only the functions below.
create table if not exists public.quiz_secrets (
  quiz_id bigint primary key references public.quizzes(id) on delete cascade,
  salt    text not null,
  pw_hash text not null
);
alter table public.quiz_secrets enable row level security;

create table if not exists public.quiz_questions (
  id            bigint generated always as identity primary key,
  quiz_id       bigint not null references public.quizzes(id) on delete cascade,
  position      int not null default 1,
  kind          text not null default 'mcq' check (kind in ('mcq', 'written')),
  prompt        text not null,
  options       jsonb,
  correct_index int,
  points        numeric not null default 1 check (points > 0),
  check (
    (kind = 'mcq'
      and options is not null and correct_index is not null
      and case when jsonb_typeof(options) = 'array'
               then jsonb_array_length(options) between 2 and 6
                    and correct_index >= 0 and correct_index < jsonb_array_length(options)
               else false end)
    or (kind = 'written' and options is null and correct_index is null)
  )
);

create table if not exists public.quiz_attempts (
  id            bigint generated always as identity primary key,
  quiz_id       bigint not null references public.quizzes(id) on delete cascade,
  student_id    uuid not null,
  answers       jsonb,
  auto_points   numeric not null default 0,
  manual_points numeric not null default 0,
  max_points    numeric not null,
  score         numeric,            -- percent; null while written answers are waiting for the instructor
  passed        boolean,            -- null while waiting
  needs_grading boolean not null default false,
  grades        jsonb not null default '{}'::jsonb,   -- { "<written question id>": points }
  feedback      text,
  graded_at     timestamptz,
  graded_by     uuid,
  focus_lost    int not null default 0,
  submitted_at  timestamptz not null default now()
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

-- Attempts: read own (or taught); written only by submit_quiz()/grade_quiz_attempt(); teachers may reset
drop policy if exists "Attempts readable by owner and teacher" on public.quiz_attempts;
create policy "Attempts readable by owner and teacher" on public.quiz_attempts
  for select to authenticated
  using (student_id = auth.uid() or public.teaches_quiz(quiz_id));

drop policy if exists "Teachers reset attempts" on public.quiz_attempts;
create policy "Teachers reset attempts" on public.quiz_attempts
  for delete to authenticated using (public.teaches_quiz(quiz_id));

-- Password: set / clear (teacher only). The password is salted + hashed, never readable.
create or replace function public.set_quiz_password(qid bigint, pwd text)
returns void language plpgsql security definer set search_path = public as $$
declare s text;
begin
  if auth.uid() is null or not public.teaches_quiz(qid) then raise exception 'Not allowed'; end if;
  if pwd is null or btrim(pwd) = '' then
    delete from public.quiz_secrets where quiz_id = qid;
    update public.quizzes set has_password = false where id = qid;
  else
    s := gen_random_uuid()::text;
    insert into public.quiz_secrets(quiz_id, salt, pw_hash)
    values (qid, s, encode(sha256(convert_to(s || btrim(pwd), 'UTF8')), 'hex'))
    on conflict (quiz_id) do update set salt = excluded.salt, pw_hash = excluded.pw_hash;
    update public.quizzes set has_password = true where id = qid;
  end if;
end $$;

-- Internal check used by the functions below (not callable by clients)
create or replace function public.quiz_password_ok(qid bigint, pwd text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare hp boolean; s record;
begin
  select has_password into hp from public.quizzes where id = qid;
  if not found then return false; end if;
  if not hp then return true; end if;
  select salt, pw_hash into s from public.quiz_secrets where quiz_id = qid;
  if not found then return false; end if;
  return encode(sha256(convert_to(s.salt || btrim(coalesce(pwd, '')), 'UTF8')), 'hex') = s.pw_hash;
end $$;

-- Questions without answers (students need the password if the quiz has one)
create or replace function public.get_quiz_questions(qid bigint, pwd text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not allowed'; end if;
  if not public.teaches_quiz(qid) then
    if not public.is_enrolled_in_quiz(qid) then raise exception 'Not allowed'; end if;
    if not public.quiz_password_ok(qid, pwd) then raise exception 'Wrong quiz password'; end if;
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'kind', kind, 'prompt', prompt, 'options', options, 'points', points)
                     order by position, id)
    from public.quiz_questions where quiz_id = qid
  ), '[]'::jsonb);
end $$;

-- Grade the multiple-choice part on the server, store written answers for the instructor
create or replace function public.submit_quiz(qid bigint, answers jsonb, pwd text default null, left_page int default 0)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  q record; r record; used int; chosen int; txt text; ok boolean;
  auto numeric := 0; maxp numeric := 0; need boolean := false;
  pct numeric; did_pass boolean; review jsonb := '[]'::jsonb; clean jsonb := '{}'::jsonb; aid bigint;
begin
  if auth.uid() is null or not public.is_enrolled_in_quiz(qid) then
    raise exception 'You must be enrolled in this course to take the quiz';
  end if;
  select * into q from public.quizzes where id = qid;
  if not found or not q.published then raise exception 'Quiz not available'; end if;
  if not public.quiz_password_ok(qid, pwd) then raise exception 'Wrong quiz password'; end if;

  select count(*) into used from public.quiz_attempts where quiz_id = qid and student_id = auth.uid();
  if q.max_attempts is not null and used >= q.max_attempts then raise exception 'No attempts left'; end if;
  if not exists (select 1 from public.quiz_questions where quiz_id = qid) then
    raise exception 'This quiz has no questions yet';
  end if;

  for r in select id, kind, correct_index, points from public.quiz_questions where quiz_id = qid order by position, id loop
    maxp := maxp + r.points;
    if r.kind = 'mcq' then
      chosen := null;
      if answers is not null and jsonb_typeof(answers) = 'object'
         and jsonb_typeof(answers -> (r.id::text)) = 'number' then
        chosen := (answers ->> (r.id::text))::int;
        clean := clean || jsonb_build_object(r.id::text, chosen);
      end if;
      ok := (chosen is not null and chosen = r.correct_index);
      if ok then auto := auto + r.points; end if;
      review := review || jsonb_build_object('question_id', r.id, 'kind', 'mcq', 'chosen', chosen, 'is_correct', ok,
        'correct_index', case when q.show_answers then r.correct_index else null end);
    else
      need := true;
      txt := null;
      if answers is not null and jsonb_typeof(answers) = 'object'
         and jsonb_typeof(answers -> (r.id::text)) = 'string' then
        txt := left(answers ->> (r.id::text), 10000);
        clean := clean || jsonb_build_object(r.id::text, txt);
      end if;
      review := review || jsonb_build_object('question_id', r.id, 'kind', 'written', 'text', txt);
    end if;
  end loop;

  if not need then
    pct := round(auto / maxp * 100, 1);
    did_pass := pct >= q.pass_score;
  end if;

  insert into public.quiz_attempts(quiz_id, student_id, answers, auto_points, max_points, score, passed, needs_grading, focus_lost)
  values (qid, auth.uid(), clean, auto, maxp, pct, did_pass, need, least(greatest(coalesce(left_page, 0), 0), 1000))
  returning id into aid;

  return jsonb_build_object('attempt_id', aid, 'needs_grading', need, 'score', pct, 'passed', did_pass,
                            'auto_points', auto, 'max_points', maxp, 'pass_score', q.pass_score, 'review', review);
end $$;

-- Instructor grades the written answers (marks per question) and leaves feedback
create or replace function public.grade_quiz_attempt(aid bigint, grades jsonb, fb text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  a record; qz record; r record; merged jsonb; man numeric := 0; pending boolean := false;
  g numeric; pct numeric; did_pass boolean;
begin
  select * into a from public.quiz_attempts where id = aid;
  if not found then raise exception 'Attempt not found'; end if;
  if auth.uid() is null or not public.teaches_quiz(a.quiz_id) then raise exception 'Not allowed'; end if;
  select * into qz from public.quizzes where id = a.quiz_id;

  merged := coalesce(a.grades, '{}'::jsonb);
  for r in select id, points from public.quiz_questions where quiz_id = a.quiz_id and kind = 'written' loop
    if grades is not null and jsonb_typeof(grades) = 'object' and jsonb_typeof(grades -> (r.id::text)) = 'number' then
      g := (grades ->> (r.id::text))::numeric;
      if g < 0 or g > r.points then raise exception 'A mark must be between 0 and the question points'; end if;
      merged := merged || jsonb_build_object(r.id::text, g);
    end if;
    if merged ? (r.id::text) then
      man := man + (merged ->> (r.id::text))::numeric;
    else
      pending := true;
    end if;
  end loop;

  if not pending then
    pct := round((a.auto_points + man) / a.max_points * 100, 1);
    did_pass := pct >= qz.pass_score;
  end if;

  update public.quiz_attempts
     set grades = merged, manual_points = man, needs_grading = pending, score = pct, passed = did_pass,
         feedback = nullif(btrim(coalesce(fb, '')), ''), graded_at = now(), graded_by = auth.uid()
   where id = aid;

  return jsonb_build_object('needs_grading', pending, 'score', pct, 'passed', did_pass);
end $$;

revoke execute on function public.set_quiz_password(bigint, text) from public, anon;
revoke execute on function public.quiz_password_ok(bigint, text) from public, anon, authenticated;
revoke execute on function public.get_quiz_questions(bigint, text) from public, anon;
revoke execute on function public.submit_quiz(bigint, jsonb, text, int) from public, anon;
revoke execute on function public.grade_quiz_attempt(bigint, jsonb, text) from public, anon;
grant execute on function public.set_quiz_password(bigint, text) to authenticated;
grant execute on function public.get_quiz_questions(bigint, text) to authenticated;
grant execute on function public.submit_quiz(bigint, jsonb, text, int) to authenticated;
grant execute on function public.grade_quiz_attempt(bigint, jsonb, text) to authenticated;
