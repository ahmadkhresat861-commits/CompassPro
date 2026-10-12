-- Certificate number + public verification (no new tables).
-- Code format: CP-00009-A1B2  (enrollment id + 4-char checksum)

create or replace function public._cert_code(p_id bigint)
returns text language sql immutable as $$
  select 'CP-' || lpad(p_id::text, 5, '0') || '-' ||
         upper(substr(md5(p_id::text || ':compasspro-cert'), 1, 4));
$$;

-- Only the owner of a COMPLETED enrollment gets a code (+ issue date).
create or replace function public.get_my_certificate(p_enrollment_id bigint)
returns table(code text, issued_on date)
language sql stable security definer set search_path = public as $$
  select public._cert_code(e.id),
         coalesce(
           (select max(lp.completed_at)::date from lesson_progress lp
             where lp.user_id = e.user_id and lp.course_id = e.course_id and lp.completed),
           e.enrolled_at::date)
  from enrollments e
  where e.id = p_enrollment_id and e.user_id = auth.uid() and e.completed = true;
$$;

-- Public: verify a code, returns only name + course + date.
create or replace function public.verify_certificate(p_code text)
returns table(holder text, course_title text, issued_on date)
language plpgsql stable security definer set search_path = public as $$
declare v_id bigint;
begin
  p_code := upper(trim(p_code));
  if p_code !~ '^CP-[0-9]{5,}-[0-9A-F]{4}$' then return; end if;
  v_id := split_part(p_code, '-', 2)::bigint;
  if public._cert_code(v_id) <> p_code then return; end if;
  return query
    select coalesce(nullif(p.full_name,''), p.username, 'Student'),
           c.title,
           coalesce(
             (select max(lp.completed_at)::date from lesson_progress lp
               where lp.user_id = e.user_id and lp.course_id = e.course_id and lp.completed),
             e.enrolled_at::date)
    from enrollments e
    join courses c on c.id = e.course_id
    left join profiles p on (p.id = e.user_id or p.user_id = e.user_id)
    where e.id = v_id and e.completed = true
    limit 1;
end $$;

grant execute on function public.get_my_certificate(bigint) to authenticated;
grant execute on function public.verify_certificate(text) to anon, authenticated;
revoke execute on function public._cert_code(bigint) from public, anon, authenticated;
