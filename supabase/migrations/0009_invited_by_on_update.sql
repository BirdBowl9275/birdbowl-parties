-- ============================================================================
-- 0009: record the inviter when Supabase writes app_metadata AFTER creating the user
-- (found in production 2026-11-23). auth.admin.createUser inserts the auth.users row first and
-- sets app_metadata.invited_by in a following update, so 0007's insert trigger saw no inviter
-- and profiles.invited_by stayed empty (no "Invited by" label, invite cap never counted).
-- This adds an update trigger that fills profiles.invited_by once, and backfills existing rows.
-- Only fills an EMPTY invited_by, and only with the id of an existing profile. Safe to re-run.
--
-- Rollback:
--   drop trigger if exists on_auth_user_app_meta on auth.users;
--   drop function if exists public.sync_invited_by();
-- ============================================================================

create or replace function public.sync_invited_by()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_inviter text := new.raw_app_meta_data ->> 'invited_by';
begin
  if v_inviter ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     and exists (select 1 from public.profiles p where p.id = v_inviter::uuid) then
    update public.profiles
       set invited_by = v_inviter::uuid
     where id = new.id
       and invited_by is null;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_invited_by() from public, anon, authenticated;

drop trigger if exists on_auth_user_app_meta on auth.users;
create trigger on_auth_user_app_meta
  after update of raw_app_meta_data on auth.users
  for each row
  when (new.raw_app_meta_data ? 'invited_by')
  execute function public.sync_invited_by();

-- Backfill people already invited.
update public.profiles p
   set invited_by = (u.raw_app_meta_data ->> 'invited_by')::uuid
  from auth.users u
 where u.id = p.id
   and p.invited_by is null
   and (u.raw_app_meta_data ->> 'invited_by') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   and exists (select 1 from public.profiles i where i.id = (u.raw_app_meta_data ->> 'invited_by')::uuid);
