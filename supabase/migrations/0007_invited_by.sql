-- ============================================================================
-- 0007: record who invited each person (security review WEB-INV-01/02, 2026-11-23).
-- Run after 0006. Safe to re-run.
--   * profiles.invited_by: set only by the new-user trigger from app_metadata.invited_by,
--     which only the server (service role) can write. Shown on the Pending approval list and
--     used to cap invites per inviter per day.
--   * The profile guard now also stops non-admins changing invited_by.
--
-- Rollback (run before rolling back 0006/0005):
--   restore handle_new_auth_user() and guard_profile_update() from 0001_init.sql / 0002;
--   alter table public.profiles drop column if exists invited_by;
-- ============================================================================

alter table public.profiles
  add column if not exists invited_by uuid references public.profiles (id) on delete set null;

create index if not exists profiles_invited_by_idx on public.profiles (invited_by, created_at);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_inviter text := new.raw_app_meta_data ->> 'invited_by';
begin
  insert into public.profiles (id, email, phone, full_name, invited_by)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    -- Only accept a well-formed id of an existing profile; anything else is ignored.
    case
      when v_inviter ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       and exists (select 1 from public.profiles p where p.id = v_inviter::uuid)
      then v_inviter::uuid
    end
  );
  return new;
end;
$$;

create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if (new.id, new.role, new.tier, new.status, new.daily_cap, new.approved_at, new.approved_by,
        new.email, new.created_at, new.invited_by)
       is distinct from
       (old.id, old.role, old.tier, old.status, old.daily_cap, old.approved_at, old.approved_by,
        old.email, old.created_at, old.invited_by) then
      raise exception 'Only an admin can change role, tier, status, cap, approval, email, inviter or created date'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
