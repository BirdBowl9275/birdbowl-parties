-- ============================================================================
-- 0015: remove the "sales" role. Managers now have everything sales had.
--
-- Decision (2026-11-23): one level above staff for parties is "manager". Sales abilities move to
-- managers, and sales accounts become managers.
--
-- What changes:
--   * Existing profiles with role 'sales' become 'manager'.
--   * can_manage_parties() (enter and edit parties) now allows manager and admin.
--   * can_view_parties() (read the parties list) now allows viewer, manager and admin.
--
-- What does not change:
--   * The app_role enum keeps the value 'sales'. Postgres cannot drop an enum value safely, and
--     nothing will use it after this migration. The app no longer offers it.
--   * Staff, viewer, manager and admin rules, the guard trigger, and every other policy.
--
-- Rollback: set the roles back to 'sales' only where you need them, then re-run the two function
-- definitions from 0001_init.sql and 0005_viewer_read_access.sql.
-- ============================================================================

update public.profiles
   set role = 'manager'
 where role = 'sales';

create or replace function public.can_manage_parties()
returns boolean
language sql
stable
as $$
  select public.has_role(array['manager', 'admin']::public.app_role[])
$$;

create or replace function public.can_view_parties()
returns boolean
language sql
stable
as $$
  select public.has_role(array['viewer', 'manager', 'admin']::public.app_role[])
$$;
