-- ============================================================================
-- 0021: drop the daily cap column. The per-hostess daily cap was removed from the rules.
--
-- Three things still referenced the column and are changed first:
--   1. schedule_hosts() returned it. The viewer schedule only uses id, full_name and tier.
--   2. guard_profile_update() compared it. The guard keeps every other admin-only field.
--   3. The column's own check constraint is dropped with the column.
--
-- Rollback: re-add the column with
--   alter table public.profiles add column daily_cap smallint not null default 3
--     check (daily_cap between 0 and 3);
-- and restore the earlier versions of the two functions from 0005 and 0020.
-- ============================================================================

-- 1. Host list for viewers, managers and admins: the three columns the screen uses.
drop function if exists public.schedule_hosts();

create function public.schedule_hosts()
returns table (id uuid, full_name text, tier smallint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.full_name, p.tier
  from public.profiles p
  where p.status = 'active'
    and p.tier is not null
    and public.has_role(array['viewer', 'manager', 'admin']::public.app_role[])
  order by p.full_name
$$;

revoke all on function public.schedule_hosts() from public, anon;
grant execute on function public.schedule_hosts() to authenticated;

-- 2. Profile guard: role, tier, status, approval and the availability override flag stay admin-only.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if (new.id, new.role, new.tier, new.status, new.approved_at, new.approved_by, new.can_enter_availability)
       is distinct from
       (old.id, old.role, old.tier, old.status, old.approved_at, old.approved_by, old.can_enter_availability) then
      raise exception 'Only an admin can change role, tier, status, approval or availability override fields'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

-- 3. The column. Its check constraint is removed with it.
alter table public.profiles drop column daily_cap;
