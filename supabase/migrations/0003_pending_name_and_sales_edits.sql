-- ============================================================================
-- 0003: two decisions from the security review (22 Nov 2026).
-- Run after 0002_security_fixes.sql. Safe to re-run.
-- 1. A pending user can save their own name, so admins can recognise the request.
--    The profile guard still stops changes to role, tier, status, cap, email and created date.
-- 2. Sales and other non-managers cannot move the date or time of a party that already
--    has a host, or that a manager has locked. Only a manager can change that slot.
-- ============================================================================

create policy profiles_update_pending_name on public.profiles
  for update to authenticated
  using (id = auth.uid() and status = 'pending')
  with check (id = auth.uid() and status = 'pending');

create or replace function public.guard_party_write()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();

  if tg_op = 'UPDATE' and auth.uid() is not null
     and (new.created_by is distinct from old.created_by
          or new.created_at is distinct from old.created_at) then
    raise exception 'The creator and creation time of a party cannot be changed' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and auth.uid() is not null and not public.is_manager_or_admin()
     and (old.assigned_host is not null or old.assignment_locked)
     and (new.party_date is distinct from old.party_date
          or new.start_time is distinct from old.start_time
          or new.end_time is distinct from old.end_time) then
    raise exception 'Only a manager can change the date or time of an assigned party' using errcode = '42501';
  end if;

  if auth.uid() is not null and not public.is_manager_or_admin() then
    if tg_op = 'INSERT' then
      if new.assigned_host is not null or new.assignment_locked then
        raise exception 'Only a manager can assign hosts or lock assignments' using errcode = '42501';
      end if;
    elsif new.assigned_host is distinct from old.assigned_host
       or new.assignment_locked is distinct from old.assignment_locked then
      raise exception 'Only a manager can assign hosts or lock assignments' using errcode = '42501';
    end if;
  end if;

  if new.assigned_host is not null and not exists (
    select 1 from public.profiles p
    where p.id = new.assigned_host and p.status = 'active' and p.tier is not null
  ) then
    raise exception 'Assigned host must be an active, host-eligible user';
  end if;

  return new;
end;
$$;
