-- SECURITY FIX (critical): stop users from changing their own profiles.type (e.g. to 'admin').
-- Cause: policy "update_own_profile" has no column restriction and `authenticated` has UPDATE on profiles.type.
-- This trigger silently keeps `type` unchanged for normal users. Admins and the service role
-- (the 'quick-action' edge function, auth triggers) are unaffected. Profile.jsx keeps working as-is.

create or replace function public.protect_profile_type()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.type := 'user';
  else
    new.type := old.type;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_type_ins on public.profiles;
drop trigger if exists trg_protect_profile_type_upd on public.profiles;
create trigger trg_protect_profile_type_ins before insert on public.profiles
  for each row execute function public.protect_profile_type();
create trigger trg_protect_profile_type_upd before update on public.profiles
  for each row execute function public.protect_profile_type();
