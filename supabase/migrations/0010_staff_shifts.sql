-- ============================================================================
-- 0010: staff_shifts, read-only shift data imported from HotSchedules.
--
-- Purpose: the scheduler checks each candidate's weekly hours (cap 35, priority under 32),
-- and checks front desk and server shifts for conflicts. This app never assigns those roles.
-- The data comes from a manager-run import of the HotSchedules week view. Nothing here writes
-- back to HotSchedules.
--
-- Access: managers and admins only (same as the schedule screens). Staff and sales cannot read
-- other people's shifts. Writes are limited to managers and admins, so the import runs as a
-- signed-in manager, not as a service key.
--
-- Rollback:
--   drop table if exists public.staff_shifts;
-- ============================================================================

create table public.staff_shifts (
  id              bigint generated always as identity primary key,
  source          text        not null default 'hotschedules' check (source = 'hotschedules'),
  staff_name      text        not null check (length(trim(staff_name)) > 0),
  -- Matched app profile, when the name maps to someone who has signed in. Null when unmatched.
  profile_id      uuid        references public.profiles (id) on delete set null,
  -- 1 hostess, 2 front desk, 3 server. Same meaning as profiles.tier.
  tier            smallint    not null check (tier between 1 and 3),
  shift_date      date        not null,
  start_time      time        not null,
  end_time        time        not null,
  -- Monday of the week this shift belongs to. Lets the week view and hour totals filter cheaply.
  week_start      date        not null,
  imported_at     timestamptz not null default now(),
  imported_by     uuid        references public.profiles (id) on delete set null,
  check (end_time > start_time),
  -- Re-importing the same week must not duplicate shifts.
  unique (source, staff_name, tier, shift_date, start_time, end_time)
);

create index staff_shifts_week_idx on public.staff_shifts (week_start);
create index staff_shifts_profile_idx on public.staff_shifts (profile_id, shift_date);

alter table public.staff_shifts enable row level security;

create policy staff_shifts_manager_read on public.staff_shifts
  for select to authenticated
  using (public.is_manager_or_admin());

create policy staff_shifts_manager_insert on public.staff_shifts
  for insert to authenticated
  with check (public.is_manager_or_admin() and imported_by = auth.uid());

create policy staff_shifts_manager_update on public.staff_shifts
  for update to authenticated
  using (public.is_manager_or_admin())
  with check (public.is_manager_or_admin());

create policy staff_shifts_manager_delete on public.staff_shifts
  for delete to authenticated
  using (public.is_manager_or_admin());
