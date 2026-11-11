-- =====================================================================
-- Security hardening #2: protect ALL course content
--   * lessons: only enrolled students, the course instructor, or admin can read
--   * storage bucket lesson-files: private, same rule, files opened through
--     short-lived signed URLs
--   * existing lessons.pdf_url public URLs are converted to storage paths
-- Run AFTER the frontend that opens files with signed URLs is deployed.
-- Safe to run more than once.
-- =====================================================================

-- 1) lessons: no more public read ------------------------------------
drop policy if exists "Anyone can view lessons" on public.lessons;
drop policy if exists "Enrolled, teacher or admin can view lessons" on public.lessons;

create policy "Enrolled, teacher or admin can view lessons"
  on public.lessons for select
  to authenticated
  using (
    public.is_enrolled_in_course(course_id)
    or public.teaches_course(course_id)
    or public.is_admin()
  );

-- 2) storage: lesson-files private ----------------------------------
update storage.buckets set public = false where id = 'lesson-files';

drop policy if exists "Anyone can view lesson files" on storage.objects;
drop policy if exists "Enrolled, teacher or admin read lesson files" on storage.objects;

create policy "Enrolled, teacher or admin read lesson files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'lesson-files'
    and (
      public.teaches_course((nullif((storage.foldername(name))[1], ''))::bigint)
      or public.is_enrolled_in_course((nullif((storage.foldername(name))[1], ''))::bigint)
      or public.is_admin()
    )
  );

-- 3) store only the path (the app signs it on demand) ----------------
update public.lessons
set pdf_url = substring(pdf_url from '/lesson-files/(.*)$')
where pdf_url like '%/storage/v1/object/public/lesson-files/%';
