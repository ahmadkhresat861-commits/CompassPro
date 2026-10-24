-- 1) Recommended: one-time resync of courses.students with real enrollments.
-- (The counter drifted: course 9 shows 3 but has 1 enrollment, left over from the
--  old client-side increments. The trigger trg_sync_course_students keeps it right from now on.)
update public.courses c
set students = (select count(*) from public.enrollments e where e.course_id = c.id)
where c.students is distinct from (select count(*) from public.enrollments e where e.course_id = c.id);

-- 2) Optional hygiene (uncomment to run): trigger functions don't need to be callable via /rest/v1/rpc.
-- Triggers keep working; do NOT touch is_admin(), verify_certificate() or get_my_certificate().
-- revoke execute on function public.notify_completion()  from public, anon, authenticated;
-- revoke execute on function public.notify_enrollment()  from public, anon, authenticated;
-- revoke execute on function public.notify_new_session() from public, anon, authenticated;
-- revoke execute on function public.rls_auto_enable()    from public, anon, authenticated;
-- alter function public._cert_code(bigint) set search_path = public;
