-- Adds a "replied" flag to contact messages + lets admins update it.
alter table public.messages
  add column if not exists replied boolean not null default false;

drop policy if exists "Admins can update messages" on public.messages;
create policy "Admins can update messages"
  on public.messages for update
  using (exists (
    select 1 from public.profiles
    where (profiles.id = auth.uid() or profiles.user_id = auth.uid())
      and profiles.type = 'admin'))
  with check (exists (
    select 1 from public.profiles
    where (profiles.id = auth.uid() or profiles.user_id = auth.uid())
      and profiles.type = 'admin'));
