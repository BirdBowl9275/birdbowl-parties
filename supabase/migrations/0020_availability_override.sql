-- ============================================================================
-- 0020: manager availability override.
--
-- A small group of managers and admins can enter availability for an active
-- hostess (tier 1) who did not submit it. Only people with the flag can do this,
-- and the database enforces it. Every change made by someone other than the
-- hostess is written to an audit log by a trigger, so it cannot be skipped.
--
-- Rollback: drop policy availability_override_* on public.availability;
--   create policy availability_manager_write on public.availability for all to
--   authenticated using (public.is_manager_or_admin()) with check (public.is_manager_or_admin());
--   drop trigger availability_audit on public.availability;
--   drop table public.availability_overrides;
--   alter table public.profiles drop column can_enter_availability;
-- ============================================================================

-- 1. The flag. Off for everyone until an admin turns it on.
alter table public.profiles
  add column if not exists can_enter_availability boolean not null default false;

-- 2. Only an admin can change the flag. Extends the existing guard.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if (new.id, new.role, new.tier, new.status, new.daily_cap, new.approved_at, new.approved_by, new.can_enter_availability)
       is distinct from
       (old.id, old.role, old.tier, old.status, old.daily_cap, old.approved_at, old.approved_by, old.can_enter_availability) then
      raise exception 'Only an admin can change role, tier, status, cap, approval or availability override fields'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

-- 3. Helpers. Security definer so they can read profiles without recursing into RLS.
create or replace function public.can_override_availability()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and p.can_enter_availability
      and p.role = any (array['manager', 'admin']::public.app_role[])
  )
$$;

create or replace function public.is_hostess_target(p_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_profile
      and p.status = 'active'
      and p.tier = 1
  )
$$;

revoke execute on function public.can_override_availability() from public;
revoke execute on function public.is_hostess_target(uuid) from public;
grant execute on function public.can_override_availability() to authenticated;
grant execute on function public.is_hostess_target(uuid) to authenticated;

-- 4. Replace the broad manager write policy with the flagged, hostess-only version.
--    Reads stay as they were (availability_select). Locked weeks do not block an override.
drop policy if exists availability_manager_write on public.availability;

create policy availability_override_insert on public.availability
  for insert to authenticated
  with check (public.can_override_availability() and public.is_hostess_target(profile_id));

create policy availability_override_update on public.availability
  for update to authenticated
  using (public.can_override_availability() and public.is_hostess_target(profile_id))
  with check (public.can_override_availability() and public.is_hostess_target(profile_id));

create policy availability_override_delete on public.availability
  for delete to authenticated
  using (public.can_override_availability() and public.is_hostess_target(profile_id));

-- 5. Audit log. Written only by the trigger below. Managers and admins can read it.
create table public.availability_overrides (
  id          bigint generated always as identity primary key,
  changed_at  timestamptz not null default now(),
  changed_by  uuid not null references public.profiles (id),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  week_start  date not null,
  action      text not null check (action in ('insert', 'update', 'delete')),
  old_row     jsonb,
  new_row     jsonb
);

create index availability_overrides_profile_idx on public.availability_overrides (profile_id, week_start);

alter table public.availability_overrides enable row level security;

create policy availability_overrides_select on public.availability_overrides
  for select to authenticated
  using (public.is_manager_or_admin());

grant select on public.availability_overrides to authenticated;

-- 6. Trigger: any change made by someone other than the hostess is logged.
create or replace function public.log_availability_override()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
begin
  if auth.uid() is null then
    return null;
  end if;
  r := coalesce(new, old);
  if r.profile_id = auth.uid() then
    return null;
  end if;
  insert into public.availability_overrides (changed_by, profile_id, week_start, action, old_row, new_row)
  values (
    auth.uid(),
    r.profile_id,
    r.week_start,
    lower(tg_op),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return null;
end;
$$;

create trigger availability_audit
  after insert or update or delete on public.availability
  for each row execute function public.log_availability_override();
