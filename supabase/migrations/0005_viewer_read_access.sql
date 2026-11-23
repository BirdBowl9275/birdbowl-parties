-- ============================================================================
-- 0005: read-only access for the "viewer" role. Run after 0004_add_viewer_role.sql has committed.
-- Safe to re-run.
--
-- A viewer (active profile, role = 'viewer') may:
--   * read the parties table (weekly schedule and parties list), like sales/managers;
--   * read host names, tiers and daily caps through schedule_hosts(), which returns no
--     email, phone or other personal fields;
--   * read settings (already allowed for every active user) and their own profile.
-- A viewer may NOT:
--   * insert or update parties (insert/update policies still use can_manage_parties(),
--     which excludes viewer), assign hosts, lock, or cancel;
--   * read other users' profiles (no profiles policy covers viewer), or availability;
--   * change settings or any profile field (unchanged admin-only policies and guards).
--
-- Rollback (restores the previous behaviour exactly). Roll back 0006 FIRST: its policies
-- depend on is_viewer(), so dropping is_viewer() fails while they exist.
--   drop policy if exists parties_select on public.parties;
--   create policy parties_select on public.parties for select to authenticated
--     using (public.can_manage_parties());
--   drop function if exists public.schedule_hosts();
--   drop function if exists public.can_view_parties();
--   drop function if exists public.is_viewer();
--   (and move any viewer users back to another role first)
-- ============================================================================

create or replace function public.is_viewer()
returns boolean
language sql
stable
as $$
  select public.has_role(array['viewer']::public.app_role[])
$$;

-- Who may READ parties: viewers plus everyone who may manage them.
create or replace function public.can_view_parties()
returns boolean
language sql
stable
as $$
  select public.has_role(array['viewer', 'sales', 'manager', 'admin']::public.app_role[])
$$;

-- parties: widen SELECT only. INSERT and UPDATE keep can_manage_parties().
drop policy if exists parties_select on public.parties;
create policy parties_select on public.parties
  for select to authenticated
  using (public.can_view_parties());

-- Host list for the weekly schedule and fairness table, limited to the four columns the
-- screen shows. Viewers, managers and admins only; everyone else gets zero rows.
create or replace function public.schedule_hosts()
returns table (id uuid, full_name text, tier smallint, daily_cap smallint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.full_name, p.tier, p.daily_cap
  from public.profiles p
  where p.status = 'active'
    and p.tier is not null
    and public.has_role(array['viewer', 'manager', 'admin']::public.app_role[])
  order by p.full_name
$$;

-- New functions are executable by PUBLIC by default; match 0001's deny-by-default grants.
revoke all on function public.is_viewer()        from public, anon;
revoke all on function public.can_view_parties() from public, anon;
revoke all on function public.schedule_hosts()   from public, anon;
grant execute on function public.is_viewer()        to authenticated;
grant execute on function public.can_view_parties() to authenticated;
grant execute on function public.schedule_hosts()   to authenticated;
