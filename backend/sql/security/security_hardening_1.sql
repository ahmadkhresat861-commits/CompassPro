-- =====================================================================
-- Security hardening #1
-- 1) AI rate limit table + function (used by the zephyr-ai Edge Function)
-- 2) Lock trigger functions so they cannot be called via RPC
-- 3) Fix mutable search_path on _cert_code
-- Safe to run more than once.
-- =====================================================================

-- 1) AI usage counter (one row per user per hour) --------------------
create table if not exists public.ai_usage (
  user_id      uuid        not null,
  window_start timestamptz not null,
  calls        integer     not null default 0,
  primary key (user_id, window_start)
);
alter table public.ai_usage enable row level security;   -- no policies = no client access
revoke all on public.ai_usage from anon, authenticated;

create or replace function public.ai_rate_limit(p_user uuid, p_max integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_calls integer;
begin
  insert into public.ai_usage as u (user_id, window_start, calls)
  values (p_user, date_trunc('hour', now()), 1)
  on conflict (user_id, window_start)
  do update set calls = u.calls + 1
  returning u.calls into v_calls;

  -- housekeeping: drop rows older than 2 days
  delete from public.ai_usage where window_start < now() - interval '2 days';

  return v_calls <= p_max;
end;
$$;
revoke all on function public.ai_rate_limit(uuid, integer) from public, anon, authenticated;
grant execute on function public.ai_rate_limit(uuid, integer) to service_role;

-- 2) Trigger functions: not meant to be called directly ---------------
-- (triggers keep working; they do not need EXECUTE for the caller)
revoke execute on function public.enforce_enrollment_progress() from public, anon, authenticated;
revoke execute on function public.free_session_on_reset()       from public, anon, authenticated;
revoke execute on function public.guard_instructor_approved()   from public, anon, authenticated;
revoke execute on function public.guard_submission()            from public, anon, authenticated;
revoke execute on function public.notify_completion()           from public, anon, authenticated;
revoke execute on function public.notify_enrollment()           from public, anon, authenticated;
revoke execute on function public.notify_new_session()          from public, anon, authenticated;
revoke execute on function public.sync_course_students()        from public, anon, authenticated;
revoke execute on function public.rls_auto_enable()             from public, anon, authenticated;

-- 3) Fixed search_path ------------------------------------------------
alter function public._cert_code(bigint) set search_path = public;
