-- ============================================================================
-- 0004: add the read-only "viewer" role (decision 2026-11-23: Dion and Susie are read-only).
-- Run this file ON ITS OWN, then run 0005_viewer_read_access.sql.
-- Postgres only allows a new enum value to be used after the statement that adds it has
-- committed, so the two files must not be pasted into the SQL editor together.
-- Safe to re-run. Adding a value changes nothing for existing users.
-- Rollback: not needed for safety (an unused enum value grants nothing); removing an enum
-- value in Postgres requires recreating the type, so leave it in place if 0005 is undone.
-- ============================================================================

alter type public.app_role add value if not exists 'viewer';
