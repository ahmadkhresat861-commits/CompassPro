-- INSTRUCTOR PHASE 5: instructor approval before a certificate is issued (per course, optional)
-- Run once in the Supabase SQL editor. Additive. Courses stay exactly as today (certificate right
-- after completion) until their instructor switches "Require my approval" on.

alter table public.courses add column if not exists requires_cert_approval boolean not null default false;

-- One row per decided enrollment. Nobody writes here directly: only decide_certificate() does.
create table if not exists public.certificate_approvals (
  enrollment_id bigint primary key references public.enrollments(id) on delete cascade,
  approved      boolean not null,
  note          text,
  decided_by    uuid,
  decided_at    timestamptz not null default now()
);
alter table public.certificate_approvals enable row level security;

create or replace function public.can_see_cert_approval(eid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments e
    where e.id = eid
      and (e.user_id = auth.uid() or public.teaches_course(e.course_id) or public.is_admin())
  )
$$;

drop policy if exists "Cert approvals readable by owner/instructor/admin" on public.certificate_approvals;
create policy "Cert approvals readable by owner/instructor/admin"
  on public.certificate_approvals for select to authenticated
  using (public.can_see_cert_approval(enrollment_id));

revoke insert, update, delete on public.certificate_approvals from anon, authenticated;
grant select on public.certificate_approvals to authenticated;

-- Internal rule: completed AND (course does not need approval OR approved)
create or replace function public._cert_ok(eid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.id = eid and e.completed = true
      and (not coalesce(c.requires_cert_approval, false)
           or exists (select 1 from public.certificate_approvals a where a.enrollment_id = e.id and a.approved))
  )
$$;
revoke execute on function public._cert_ok(bigint) from public, anon, authenticated;

-- Same signature as before, now also gated by approval
create or replace function public.get_my_certificate(p_enrollment_id bigint)
returns table(code text, issued_on date)
language sql stable security definer set search_path = public as $$
  select public._cert_code(e.id),
         coalesce(
           (select max(lp.completed_at)::date from lesson_progress lp
             where lp.user_id = e.user_id and lp.course_id = e.course_id and lp.completed),
           e.enrolled_at::date)
  from enrollments e
  where e.id = p_enrollment_id and e.user_id = auth.uid() and public._cert_ok(e.id);
$$;

-- Public verification: only certificates that are really issued
create or replace function public.verify_certificate(p_code text)
returns table(holder text, course_title text, issued_on date)
language plpgsql stable security definer set search_path = public as $$
declare v_id bigint;
begin
  p_code := upper(trim(p_code));
  if p_code !~ '^CP-[0-9]{5,}-[0-9A-F]{4}$' then return; end if;
  v_id := split_part(p_code, '-', 2)::bigint;
  if public._cert_code(v_id) <> p_code then return; end if;
  if not public._cert_ok(v_id) then return; end if;
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
    where e.id = v_id
    limit 1;
end $$;

-- Everything the student's certificate screen needs, in one call.
-- status: not_completed | pending | rejected | approved
create or replace function public.my_certificate_info(p_enrollment_id bigint)
returns table(status text, note text, code text, issued_on date, instructor text)
language plpgsql stable security definer set search_path = public as $$
declare e record; a record; st text; ins text;
begin
  select en.*, c.requires_cert_approval as req, c.instructor_id as iid
    into e from enrollments en join courses c on c.id = en.course_id
   where en.id = p_enrollment_id and en.user_id = auth.uid();
  if not found then return; end if;
  select * into a from certificate_approvals where enrollment_id = e.id;
  if not coalesce(e.completed, false) then st := 'not_completed';
  elsif not coalesce(e.req, false) or coalesce(a.approved, false) then st := 'approved';
  elsif a.approved is false then st := 'rejected';
  else st := 'pending'; end if;
  if e.iid is not null then
    select coalesce(nullif(ip.display_name,''), nullif(p.full_name,''), p.username) into ins
      from (select 1) x
      left join instructor_public ip on ip.user_id = e.iid
      left join profiles p on p.id = e.iid;
  end if;
  return query select st, a.note,
    case when st = 'approved' then public._cert_code(e.id) end,
    case when st = 'approved' then coalesce(
      (select max(lp.completed_at)::date from lesson_progress lp
        where lp.user_id = e.user_id and lp.course_id = e.course_id and lp.completed),
      e.enrolled_at::date) end,
    ins;
end $$;

-- Instructor (of that course) or admin approves / rejects a completed enrollment; the student is notified.
create or replace function public.decide_certificate(p_enrollment_id bigint, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare e record; ctitle text;
begin
  select en.id, en.user_id, en.course_id, en.completed into e from enrollments en where en.id = p_enrollment_id;
  if not found then raise exception 'Enrollment not found'; end if;
  if auth.uid() is null or not (public.teaches_course(e.course_id) or public.is_admin()) then
    raise exception 'Not allowed';
  end if;
  if not coalesce(e.completed, false) then raise exception 'The student has not completed the course yet'; end if;
  insert into certificate_approvals(enrollment_id, approved, note, decided_by, decided_at)
  values (e.id, p_approve, nullif(left(trim(coalesce(p_note, '')), 500), ''), auth.uid(), now())
  on conflict (enrollment_id) do update
    set approved = excluded.approved, note = excluded.note, decided_by = excluded.decided_by, decided_at = excluded.decided_at;
  select title into ctitle from courses where id = e.course_id;
  insert into notifications(user_id, title, message)
  values (e.user_id,
          case when p_approve then 'Certificate approved 🎓' else 'Certificate not approved yet' end,
          case when p_approve then 'Your instructor approved your certificate for "' || ctitle || '". It is ready in your dashboard.'
               else 'Your instructor reviewed "' || ctitle || '".' || coalesce(' Note: ' || nullif(left(trim(coalesce(p_note, '')), 300), ''), '') end);
end $$;

-- Instructor (of that course) or admin switches the approval requirement on/off.
create or replace function public.set_course_cert_approval(p_course_id bigint, p_required boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not (public.teaches_course(p_course_id) or public.is_admin()) then
    raise exception 'Not allowed';
  end if;
  update courses set requires_cert_approval = p_required where id = p_course_id;
end $$;

revoke execute on function public.my_certificate_info(bigint), public.decide_certificate(bigint, boolean, text),
  public.set_course_cert_approval(bigint, boolean), public.can_see_cert_approval(bigint) from public, anon;
grant execute on function public.my_certificate_info(bigint), public.decide_certificate(bigint, boolean, text),
  public.set_course_cert_approval(bigint, boolean), public.can_see_cert_approval(bigint) to authenticated;
grant execute on function public.get_my_certificate(bigint) to authenticated;
grant execute on function public.verify_certificate(text) to anon, authenticated;
