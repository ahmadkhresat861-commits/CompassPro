-- Optional hardening (safe): trigger functions should not be callable from the API.
revoke execute on function public.notify_enrollment()  from public, anon, authenticated;
revoke execute on function public.notify_completion()  from public, anon, authenticated;
revoke execute on function public.notify_new_session() from public, anon, authenticated;

-- Certificate lookup for a logged-in owner only (anon can't use it anyway)
revoke execute on function public.get_my_certificate(bigint) from public, anon;
grant  execute on function public.get_my_certificate(bigint) to authenticated;

-- Pin search_path on the helper
alter function public._cert_code(bigint) set search_path = public;

-- NOTE: do NOT revoke public.is_admin() from anon/authenticated:
-- RLS policies call it as the querying role.
