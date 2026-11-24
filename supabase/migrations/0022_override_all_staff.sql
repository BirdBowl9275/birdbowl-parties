-- ============================================================================
-- 0022: the availability override applies to every active staff member with a
-- tier (1, 2 or 3), not only tier-1 hostesses. Managers and admins are never targets.
--
-- Rollback: create or replace public.is_hostess_target(p_profile uuid) with the
--   body from migration 0020 (status = 'active' and tier = 1).
-- ============================================================================

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
      and p.role = 'staff'
      and p.tier between 1 and 3
  )
$$;
