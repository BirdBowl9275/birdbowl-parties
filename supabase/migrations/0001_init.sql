-- Bird Bowl Party Hostess Scheduler
-- 0001_init.sql: enums, tables, helper functions, Row Level Security, grants.
--
-- Not applied to any database yet. Review, then apply through the Supabase SQL editor
-- or the CLI once approved (see ../README.md).
--
-- Permissions are enforced here, in Postgres. The UI can hide things, but these
-- policies decide what each signed-in user can read or change.

-- ============================================================================
-- Enums
-- ============================================================================
create type public.app_role     as enum ('staff', 'sales', 'manager', 'admin');
create type public.user_status  as enum ('pending', 'active', 'removed');
create type public.party_type   as enum ('bowling', 'other');
create type public.party_status as enum ('active', 'cancelled');

-- ============================================================================
-- Settings (admin-adjustable)
-- Values are stored as JSON. Scalars only.
-- ============================================================================
create table public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value) values
  ('fairness_window_days',      '30'),
  ('hostess_avg_allowance_pct', '25'),                 -- hostesses may average up to 25% more kids per party
  ('reveal_time',               '"08:00"'),            -- morning reveal of party details
  ('availability_cutoff_dow',   '3'),                  -- ISO weekday: 3 = Wednesday
  ('availability_cutoff_time',  '"20:00"'),
  ('bowling_server_only_after', '"18:00"'),            -- enforced by the assignment engine (step 5)
  ('business_tz',               '"America/New_York"');

-- ============================================================================
-- Profiles: one row per auth user. Created automatically on sign-up as 'pending'.
-- ============================================================================
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  email       text,
  phone       text,
  status      public.user_status not null default 'pending',
  role        public.app_role    not null default 'staff',
  tier        smallint check (tier between 1 and 3),   -- 1 hostess, 2 front desk, 3 server; null = not a host
  daily_cap   smallint not null default 3 check (daily_cap between 0 and 3),
  created_at  timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles (id)
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, phone, full_name)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ============================================================================
-- Helper functions used by policies
-- security definer so they can read profiles without recursing into its RLS.
-- ============================================================================
create or replace function public.setting_text(p_key text)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select s.value #>> '{}' from public.settings s where s.key = p_key
$$;

create or replace function public.is_active()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active'
  )
$$;

create or replace function public.has_role(p_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active' and p.role = any (p_roles)
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.has_role(array['admin']::public.app_role[])
$$;

create or replace function public.is_manager_or_admin()
returns boolean
language sql
stable
as $$
  select public.has_role(array['manager', 'admin']::public.app_role[])
$$;

create or replace function public.can_manage_parties()
returns boolean
language sql
stable
as $$
  select public.has_role(array['sales', 'manager', 'admin']::public.app_role[])
$$;

-- True once the availability cutoff for the week starting on p_week_start has passed.
-- Default: Wednesday 8 p.m. Eastern of the prior week.
create or replace function public.availability_locked(p_week_start date)
returns boolean
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_cutoff timestamptz;
begin
  v_cutoff := (
    (p_week_start + ((public.setting_text('availability_cutoff_dow')::int - 1) - 7))
    + public.setting_text('availability_cutoff_time')::time
  ) at time zone public.setting_text('business_tz');
  return now() >= v_cutoff;
end;
$$;

-- ============================================================================
-- Guard: users can edit their own name and phone only.
-- Role, tier, status, cap and approval fields are admin-only.
-- ============================================================================
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if (new.id, new.role, new.tier, new.status, new.daily_cap, new.approved_at, new.approved_by)
       is distinct from
       (old.id, old.role, old.tier, old.status, old.daily_cap, old.approved_at, old.approved_by) then
      raise exception 'Only an admin can change role, tier, status, cap or approval fields'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ============================================================================
-- Availability: a host's windows for one week (Monday start).
-- ============================================================================
create table public.availability (
  id          bigint generated always as identity primary key,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  week_start  date not null check (extract(isodow from week_start) = 1),
  day_of_week smallint not null check (day_of_week between 1 and 7),  -- ISO: 1 Monday .. 7 Sunday
  start_time  time not null,
  end_time    time not null,
  check (end_time > start_time)
);

create index availability_profile_week_idx on public.availability (profile_id, week_start);

-- ============================================================================
-- Parties
-- ============================================================================
create table public.parties (
  id                bigint generated always as identity primary key,
  party_date        date not null,
  start_time        time not null,
  end_time          time not null,
  kids_count        smallint not null check (kids_count >= 0),
  party_type        public.party_type   not null,
  customer_name     text not null,
  notes             text not null default '',
  status            public.party_status not null default 'active',
  assigned_host     uuid references public.profiles (id),
  assignment_locked boolean not null default false,
  created_by        uuid references public.profiles (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (end_time > start_time)
);

create index parties_date_idx       on public.parties (party_date);
create index parties_host_date_idx  on public.parties (assigned_host, party_date);

-- Only managers and admins may set or lock assignments. Assigned hosts must be
-- active and host-eligible (tier not null). The assignment engine runs with the
-- service role, where auth.uid() is null, so it is not blocked here.
create or replace function public.guard_party_write()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();

  if auth.uid() is not null and not public.is_manager_or_admin() then
    if tg_op = 'INSERT' then
      if new.assigned_host is not null or new.assignment_locked then
        raise exception 'Only a manager can assign hosts or lock assignments' using errcode = '42501';
      end if;
    elsif new.assigned_host is distinct from old.assigned_host
       or new.assignment_locked is distinct from old.assignment_locked then
      raise exception 'Only a manager can assign hosts or lock assignments' using errcode = '42501';
    end if;
  end if;

  if new.assigned_host is not null and not exists (
    select 1 from public.profiles p
    where p.id = new.assigned_host and p.status = 'active' and p.tier is not null
  ) then
    raise exception 'Assigned host must be an active, host-eligible user';
  end if;

  return new;
end;
$$;

create trigger parties_guard
  before insert or update on public.parties
  for each row execute function public.guard_party_write();

-- ============================================================================
-- Staff schedule: the only way a host reads parties.
-- Returns the host's own active assignments in the date range.
-- The slot (date and times) is always visible. Customer, kids, type and notes
-- appear only after the morning reveal.
-- ============================================================================
create or replace function public.my_schedule(
  p_from date default current_date,
  p_to   date default current_date + 14
)
returns table (
  party_id      bigint,
  party_date    date,
  start_time    time,
  end_time      time,
  revealed      boolean,
  party_type    public.party_type,
  customer_name text,
  kids_count    smallint,
  notes         text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with mine as (
    select p.*,
           ((p.party_date + public.setting_text('reveal_time')::time)
              at time zone public.setting_text('business_tz')) as reveal_at
    from public.parties p
    where p.assigned_host = auth.uid()
      and p.status = 'active'
      and p.party_date between p_from and p_to
      and public.is_active()
  )
  select m.id,
         m.party_date,
         m.start_time,
         m.end_time,
         now() >= m.reveal_at,
         case when now() >= m.reveal_at then m.party_type    end,
         case when now() >= m.reveal_at then m.customer_name end,
         case when now() >= m.reveal_at then m.kids_count    end,
         case when now() >= m.reveal_at then m.notes         end
  from mine m
  order by m.party_date, m.start_time
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.settings     enable row level security;
alter table public.profiles     enable row level security;
alter table public.availability enable row level security;
alter table public.parties      enable row level security;

-- settings: any active user reads; only admin changes. No insert or delete.
create policy settings_read on public.settings
  for select to authenticated
  using (public.is_active());

create policy settings_admin_update on public.settings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- profiles: users see their own row (so pending users see their status).
-- Managers and admins see everyone. Users edit their own row (guarded above).
-- Admins edit anyone. Inserts come from the auth trigger only. No deletes:
-- removal is status = 'removed', which ends access at once.
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy profiles_select_managers on public.profiles
  for select to authenticated
  using (public.is_manager_or_admin());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid() and public.is_active())
  with check (id = auth.uid());

create policy profiles_admin_update on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- availability: a host reads and writes their own windows, but only for weeks
-- that are not locked. Managers and admins can always write.
create policy availability_select on public.availability
  for select to authenticated
  using (
    (profile_id = auth.uid() and public.is_active())
    or public.is_manager_or_admin()
  );

create policy availability_insert_self on public.availability
  for insert to authenticated
  with check (
    profile_id = auth.uid()
    and public.is_active()
    and not public.availability_locked(week_start)
  );

create policy availability_update_self on public.availability
  for update to authenticated
  using (
    profile_id = auth.uid()
    and public.is_active()
    and not public.availability_locked(week_start)
  )
  with check (
    profile_id = auth.uid()
    and public.is_active()
    and not public.availability_locked(week_start)
  );

create policy availability_delete_self on public.availability
  for delete to authenticated
  using (
    profile_id = auth.uid()
    and public.is_active()
    and not public.availability_locked(week_start)
  );

create policy availability_manager_write on public.availability
  for all to authenticated
  using (public.is_manager_or_admin())
  with check (public.is_manager_or_admin());

-- parties: sales, managers and admins work with full details.
-- No policy exists for staff, so hosts cannot read this table directly.
-- They use my_schedule(). No deletes: parties are cancelled by status.
create policy parties_select on public.parties
  for select to authenticated
  using (public.can_manage_parties());

create policy parties_insert on public.parties
  for insert to authenticated
  with check (public.can_manage_parties() and created_by = auth.uid());

create policy parties_update on public.parties
  for update to authenticated
  using (public.can_manage_parties())
  with check (public.can_manage_parties());

-- ============================================================================
-- Grants: deny by default, then open only what each table needs.
-- RLS still decides row access on top of these.
-- ============================================================================
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon;

grant select, update            on public.settings     to authenticated;
grant select, update            on public.profiles     to authenticated;
grant select, insert, update, delete on public.availability to authenticated;
grant select, insert, update    on public.parties      to authenticated;
grant usage on all sequences in schema public to authenticated;

grant execute on function public.my_schedule(date, date)   to authenticated;
grant execute on function public.setting_text(text)        to authenticated;
grant execute on function public.is_active()               to authenticated;
grant execute on function public.has_role(public.app_role[]) to authenticated;
grant execute on function public.is_admin()                to authenticated;
grant execute on function public.is_manager_or_admin()     to authenticated;
grant execute on function public.can_manage_parties()      to authenticated;
grant execute on function public.availability_locked(date) to authenticated;
