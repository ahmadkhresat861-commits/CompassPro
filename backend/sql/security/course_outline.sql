-- Public course outline: lesson titles/chapters only (no content, video or files),
-- so visitors can see what a course covers before enrolling.
-- The lessons table itself stays private (see security_hardening_2_content.sql).
create or replace function public.get_course_outline(p_course_id bigint)
returns table(id bigint, title text, chapter text, lesson_order integer)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, l.title, l.chapter, l.lesson_order
  from public.lessons l
  where l.course_id = p_course_id
  order by l.lesson_order, l.id;
$$;

revoke all on function public.get_course_outline(bigint) from public;
grant execute on function public.get_course_outline(bigint) to anon, authenticated;
