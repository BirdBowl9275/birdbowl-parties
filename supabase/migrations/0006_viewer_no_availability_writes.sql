-- ============================================================================
-- 0006: viewers are read-only, so they cannot write availability either
-- (security review WEB-01, 2026-11-23). Run after 0005. Safe to re-run.
-- Recreates the three "own availability" policies from 0001 with one extra condition:
-- `and not public.is_viewer()`. Nothing changes for staff, sales, managers or admins.
--
-- Also: a database rule that a viewer can never have a host tier (security review WEB-02),
-- so even a direct database edit cannot make a viewer an assignable host.
--
-- Rollback (run BEFORE rolling back 0005, because these policies use is_viewer()):
--   alter table public.profiles drop constraint if exists profiles_viewer_not_host;
--   drop policy if exists availability_insert_self on public.availability;
--   drop policy if exists availability_update_self on public.availability;
--   drop policy if exists availability_delete_self on public.availability;
--   then recreate the three policies exactly as in 0001_init.sql
--   (availability_insert_self, availability_update_self, availability_delete_self).
-- ============================================================================

drop policy if exists availability_insert_self on public.availability;
create policy availability_insert_self on public.availability
  for insert to authenticated
  with check (
    profile_id = auth.uid()
    and public.is_active()
    and not public.is_viewer()
    and not public.availability_locked(week_start)
  );

drop policy if exists availability_update_self on public.availability;
create policy availability_update_self on public.availability
  for update to authenticated
  using (
    profile_id = auth.uid()
    and public.is_active()
    and not public.is_viewer()
    and not public.availability_locked(week_start)
  )
  with check (
    profile_id = auth.uid()
    and public.is_active()
    and not public.is_viewer()
    and not public.availability_locked(week_start)
  );

drop policy if exists availability_delete_self on public.availability;
create policy availability_delete_self on public.availability
  for delete to authenticated
  using (
    profile_id = auth.uid()
    and public.is_active()
    and not public.is_viewer()
    and not public.availability_locked(week_start)
  );

-- A viewer is never a host. Fails if any viewer already has a tier: clear it first.
alter table public.profiles drop constraint if exists profiles_viewer_not_host;
alter table public.profiles add constraint profiles_viewer_not_host
  check (role <> 'viewer' or tier is null);
