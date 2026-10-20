-- Optional office hours on the instructor card
alter table public.instructor_public add column if not exists office_hours text;
