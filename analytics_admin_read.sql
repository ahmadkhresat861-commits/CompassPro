-- Lets admins read all profiles and lesson_progress (for the Analytics tab).
-- Uses a SECURITY DEFINER function to avoid RLS recursion on profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where (id = auth.uid() or user_id = auth.uid()) and type = 'admin'
  );
$$;

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "Admins can read all lesson progress" on public.lesson_progress;
create policy "Admins can read all lesson progress"
  on public.lesson_progress for select
  using (public.is_admin());
