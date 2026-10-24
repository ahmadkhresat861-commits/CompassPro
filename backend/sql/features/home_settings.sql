-- HOME PAGE SETTINGS (editable from Admin > Home)
-- Run once in Supabase SQL editor. Safe: creates one new table, touches nothing else.
-- Public can READ (the Home page needs it); only admins can WRITE.

create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "Anyone can read site settings" on public.site_settings;
drop policy if exists "Admins can insert site settings" on public.site_settings;
drop policy if exists "Admins can update site settings" on public.site_settings;
drop policy if exists "Admins can delete site settings" on public.site_settings;

create policy "Anyone can read site settings"
  on public.site_settings for select to anon, authenticated using (true);
create policy "Admins can insert site settings"
  on public.site_settings for insert to authenticated with check (public.is_admin());
create policy "Admins can update site settings"
  on public.site_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete site settings"
  on public.site_settings for delete to authenticated using (public.is_admin());
