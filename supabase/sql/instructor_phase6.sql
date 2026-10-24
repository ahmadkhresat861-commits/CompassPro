-- INSTRUCTOR PHASE 6: public instructors (Home section + public profile page), admin approval required.
-- Run once in the Supabase SQL editor. Additive. Nobody is shown publicly until an admin approves them.

alter table public.instructor_public add column if not exists approved boolean not null default false;

-- Only an admin can change "approved". An instructor saving their own card can neither approve
-- themselves on insert nor flip the flag on update. (SQL editor / service role, where there is
-- no end-user, is left alone.)
create or replace function public.guard_instructor_approved()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.approved := false;
    else
      new.approved := old.approved;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_instructor_approved on public.instructor_public;
create trigger trg_guard_instructor_approved
  before insert or update on public.instructor_public
  for each row execute function public.guard_instructor_approved();

revoke execute on function public.guard_instructor_approved() from public, anon, authenticated;
