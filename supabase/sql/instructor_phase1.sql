-- INSTRUCTOR PHASE 1: lesson chapters + public instructor profile card
-- Run once in the Supabase SQL editor. Additive: one nullable column + one new table. Nothing existing is changed.

-- 1) Chapter (group) of a lesson, e.g. "Chapter 1: Basics". Lessons with the same text are shown together.
alter table public.lessons add column if not exists chapter text;

-- 2) Public instructor card shown to students on the course page.
--    contact_email is public by design: the instructor chooses to fill it (empty = not shown).
create table if not exists public.instructor_public (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  headline      text,
  bio           text,
  avatar_url    text,
  contact_email text,
  updated_at    timestamptz not null default now()
);

alter table public.instructor_public enable row level security;

drop policy if exists "Anyone can read instructor cards" on public.instructor_public;
create policy "Anyone can read instructor cards"
  on public.instructor_public for select to anon, authenticated using (true);

drop policy if exists "Instructors manage own card insert" on public.instructor_public;
create policy "Instructors manage own card insert"
  on public.instructor_public for insert to authenticated
  with check (user_id = auth.uid() and public.is_instructor());

drop policy if exists "Instructors manage own card update" on public.instructor_public;
create policy "Instructors manage own card update"
  on public.instructor_public for update to authenticated
  using (user_id = auth.uid() and public.is_instructor())
  with check (user_id = auth.uid() and public.is_instructor());

drop policy if exists "Admins manage instructor cards" on public.instructor_public;
create policy "Admins manage instructor cards"
  on public.instructor_public for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
