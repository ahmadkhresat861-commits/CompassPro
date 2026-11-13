-- Security hardening 3 (from the pre-launch review)
-- 1) admins: the table was readable by everyone (admin emails exposed). The app never reads it.
drop policy if exists "Enable read access for all users" on public.admins;
create policy "Admins can read admins" on public.admins for select to authenticated using (public.is_admin());

-- 2) instructor_public: unapproved cards were readable through the API. Show approved ones to everyone,
--    and unapproved ones only to their owner and to admins.
drop policy if exists "Anyone can read instructor cards" on public.instructor_public;
create policy "Anyone can read approved instructor cards" on public.instructor_public
  for select to anon, authenticated
  using (approved is true or user_id = auth.uid() or public.is_admin());

-- 3) Visitors (not signed in) have no reason to call these functions.
--    (Helper functions used inside RLS policies are left alone on purpose.)
revoke execute on function public.decide_certificate(bigint, boolean, text) from anon;
revoke execute on function public.notify_course_students(bigint, text, text) from anon;
revoke execute on function public.set_quiz_password(bigint, text) from anon;
revoke execute on function public.set_course_cert_approval(bigint, boolean) from anon;
revoke execute on function public.submit_quiz(bigint, jsonb, text, integer) from anon;
revoke execute on function public.get_quiz_questions(bigint, text) from anon;
revoke execute on function public.grade_quiz_attempt(bigint, jsonb, text) from anon;
revoke execute on function public.get_my_certificate(bigint) from anon;
revoke execute on function public.my_certificate_info(bigint) from anon;
