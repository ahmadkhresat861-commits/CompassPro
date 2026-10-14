-- Notifications had no default for created_at (existing rows are NULL).
-- Needed for correct ordering, "unread" badge, and the automatic notifications.
alter table public.notifications
  alter column created_at set default now();

update public.notifications
   set created_at = now() - (interval '1 minute' * (100 - id))
 where created_at is null;
