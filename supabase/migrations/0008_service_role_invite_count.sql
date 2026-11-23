-- ============================================================================
-- 0008: let the server (service_role) count invites per inviter (2026-11-23).
-- Found in production: service_role had no table privileges on public.profiles, so the
-- invite cap query in app/invite/actions.ts got 403 and every invite failed safely.
-- Grants ONLY column-level SELECT on the three columns the count reads. No write access,
-- nothing for anon or authenticated. service_role already bypasses RLS; it only lacked
-- the table privilege. Safe to re-run.
--
-- Rollback:
--   revoke select (id, invited_by, created_at) on public.profiles from service_role;
-- ============================================================================

grant usage on schema public to service_role;
grant select (id, invited_by, created_at) on public.profiles to service_role;
