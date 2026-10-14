-- Covering indexes for the 6 foreign keys flagged by the Supabase performance advisor.
-- Purely additive and safe to re-run (IF NOT EXISTS). No data or policy changes.
create index if not exists idx_enrollments_course_id      on public.enrollments (course_id);
create index if not exists idx_lesson_progress_course_id  on public.lesson_progress (course_id);
create index if not exists idx_lesson_progress_lesson_id  on public.lesson_progress (lesson_id);
create index if not exists idx_lessons_course_id          on public.lessons (course_id);
create index if not exists idx_messages_user_id           on public.messages (user_id);
create index if not exists idx_notifications_user_id      on public.notifications (user_id);
