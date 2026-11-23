-- ============================================================================
-- 0002: tighten two write rules found in the security review (22 Nov 2026).
-- Run after 0001_init.sql. Safe to re-run: every change is create or replace.
-- The service role (auth.uid() is null) is not affected by either change.
-- ============================================================================

-- A user can no longer change their own email or created date. Before, an
-- active user could edit the email admins see in the approval and user lists.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if (new.id, new.role, new.tier, new.status, new.daily_cap, new.approved_at, new.approved_by,
        new.email, new.created_at)
       is distinct from
       (old.id, old.role, old.tier, old.status, old.daily_cap, old.approved_at, old.approved_by,
        old.email, old.created_at) then
      raise exception 'Only an admin can change role, tier, status, cap, approval, email or created date'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

-- Sales and managers can no longer rewrite who created a party or when. The
-- service role is still allowed (the assignment engine runs as service role).
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
