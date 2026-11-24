-- ============================================================================
-- 0018: let signed-in users reach staff_shifts at all, so the row rules can apply.
--
-- Problem: staff_shifts has row-level security policies (managers and admins only), but the
-- signed-in role was never granted table privileges. Every roster upload failed with
-- 42501 (permission denied) before the policies were checked.
--
-- This grant does not widen access. The policies from 0010 still decide which rows a person can
-- read or write: only managers and admins, and only rows they imported. Staff and anonymous users
-- get nothing, because the policies return no rows for them.
--
-- Rollback: revoke select, insert, update, delete on public.staff_shifts from authenticated;
-- ============================================================================

grant select, insert, update, delete on public.staff_shifts to authenticated;
