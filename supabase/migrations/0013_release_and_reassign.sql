-- ============================================================================
-- 0013: hostesses can release a party 48 hours before its arrival. Reassignment is automatic.
--
-- release_log: one row per release. Written only by the server (service role, which bypasses RLS).
-- Managers and admins can read it. No one else can write or read it.
--
-- release_window_open(party): true when the caller is the assigned hostess, the party is active
-- and not locked, and now is before (arrival - 48 hours). Arrival is one hour before the start
-- for the hostess's first party of the day, otherwise the start.
--
-- Rollback:
--   drop function if exists public.release_window_open(bigint);
--   drop table if exists public.release_log;
-- ============================================================================

create table public.release_log (
  id           bigint generated always as identity primary key,
  party_id     bigint      not null references public.parties (id) on delete cascade,
  released_by  uuid        not null references public.profiles (id) on delete cascade,
  released_at  timestamptz not null default now(),
  outcome      text        not null check (outcome in ('reassigned', 'unassigned')),
  new_host     uuid        references public.profiles (id) on delete set null
);

alter table public.release_log enable row level security;

create policy release_log_manager_read on public.release_log
  for select to authenticated
  using (public.is_manager_or_admin());

create or replace function public.release_window_open(p_party_id bigint)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  me        public.parties%rowtype;
  first_day boolean;
  arrival   timestamptz;
  start_ts  timestamptz;
begin
  select * into me
  from public.parties p
  where p.id = p_party_id
    and p.assigned_host = auth.uid()
    and p.status = 'active'
    and not p.assignment_locked;
  if not found then
    return false;
  end if;

  first_day := not exists (
    select 1 from public.parties o
    where o.assigned_host = me.assigned_host
      and o.party_date = me.party_date
      and o.status = 'active'
      and o.id <> me.id
      and o.start_time < me.start_time
  );

  start_ts := (me.party_date + me.start_time) at time zone public.setting_text('business_tz');
  arrival := start_ts - case when first_day then interval '60 minutes' else interval '0 minutes' end;
  return now() < arrival - interval '48 hours';
end;
$$;

grant execute on function public.release_window_open(bigint) to authenticated;
