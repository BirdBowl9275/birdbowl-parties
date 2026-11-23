-- RLS and trigger tests for 0001_init.sql. Local throwaway Postgres only.
-- Run order: 00_auth_stub.sql, ../migrations/0001_init.sql, 0002_security_fixes.sql,
-- 0003_pending_name_and_sales_edits.sql, 0004_add_viewer_role.sql, 0005_viewer_read_access.sql,
-- 0006 … 0009 (see run-local.sh), rls_tests.sql
-- psql -v ON_ERROR_STOP=1 makes any failed assertion stop the run with a non-zero exit.
-- All users, emails and UUIDs below are fake.

\set QUIET on
set client_min_messages = notice;

-- ---------------------------------------------------------------------------
-- Helpers (created as superuser, callable by anon and authenticated)
-- ---------------------------------------------------------------------------
create schema tests;
grant usage on schema tests to anon, authenticated;

create table tests.counter (n int not null);
insert into tests.counter values (0);
grant select, update on tests.counter to anon, authenticated;

create function tests.ok(p_cond boolean, p_msg text) returns void
language plpgsql as $$
begin
  if p_cond is distinct from true then
    raise exception 'FAIL: %', p_msg;
  end if;
  update tests.counter set n = n + 1;
  raise notice 'ok - %', p_msg;
end $$;

-- Passes only if p_sql raises an error. Runs as the caller's current role.
create function tests.fails(p_sql text, p_msg text) returns void
language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    perform tests.ok(true, p_msg || ' [' || sqlstate || ': ' || sqlerrm || ']');
    return;
  end;
  raise exception 'FAIL: % (statement succeeded but should have failed)', p_msg;
end $$;

-- Runs p_sql and returns the number of rows it affected.
create function tests.rows(p_sql text) returns bigint
language plpgsql as $$
declare v bigint;
begin
  execute p_sql;
  get diagnostics v = row_count;
  return v;
end $$;

create function tests.today() returns date
language sql stable as $$ select (now() at time zone 'America/New_York')::date $$;

create function tests.this_monday() returns date
language sql stable as $$ select tests.today() - (extract(isodow from tests.today())::int - 1) $$;

grant execute on all functions in schema tests to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Seed (superuser, RLS bypassed, auth.uid() null)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@example.com',   '{"full_name":"Test Admin"}'),
  ('00000000-0000-0000-0000-00000000000b', 'manager@example.com', '{"full_name":"Test Manager"}'),
  ('00000000-0000-0000-0000-00000000000c', 'sales@example.com',   '{"full_name":"Test Sales"}'),
  ('00000000-0000-0000-0000-000000000001', 'host1@example.com',   '{"full_name":"Test Host One"}'),
  ('00000000-0000-0000-0000-000000000002', 'host2@example.com',   '{"full_name":"Test Host Two"}'),
  ('00000000-0000-0000-0000-00000000000d', 'pending@example.com', '{}'),
  ('00000000-0000-0000-0000-00000000000e', 'removed@example.com', '{"full_name":"Test Removed"}'),
  ('00000000-0000-0000-0000-00000000000f', 'viewer@example.com',  '{"full_name":"Test Viewer"}');

select tests.ok((select count(*) from public.profiles where status = 'pending') = 8,
                'auth trigger created 8 pending profiles');

update public.profiles set status = 'active', role = 'admin'   where id = '00000000-0000-0000-0000-00000000000a';
update public.profiles set status = 'active', role = 'manager' where id = '00000000-0000-0000-0000-00000000000b';
update public.profiles set status = 'active', role = 'sales'   where id = '00000000-0000-0000-0000-00000000000c';
update public.profiles set status = 'active', role = 'staff', tier = 1 where id = '00000000-0000-0000-0000-000000000001';
update public.profiles set status = 'active', role = 'staff', tier = 3 where id = '00000000-0000-0000-0000-000000000002';
-- Starts active with a party; the admin removes this user during the tests.
update public.profiles set status = 'active', role = 'staff', tier = 2 where id = '00000000-0000-0000-0000-00000000000e';
update public.profiles set status = 'active', role = 'viewer' where id = '00000000-0000-0000-0000-00000000000f';

insert into public.parties (party_date, start_time, end_time, kids_count, party_type, customer_name, assigned_host, created_by) values
  (tests.today() - 3, '14:00', '16:00', 10, 'bowling', 'Past Customer',       '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000c'),
  (tests.today() + 1, '14:00', '16:00', 12, 'other',   'Tomorrow Customer',   '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000c'),
  (tests.today() + 1, '17:00', '19:00',  8, 'bowling', 'Host Two Customer',   '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000c'),
  (tests.today() + 2, '12:00', '14:00',  6, 'other',   'Unassigned Customer', null,                                   '00000000-0000-0000-0000-00000000000c'),
  (tests.today() - 2, '12:00', '14:00',  5, 'other',   'Removed Customer',    '00000000-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-00000000000c');

-- ---------------------------------------------------------------------------
-- Pending user
-- ---------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
select tests.ok((select count(*) from public.profiles) = 1, 'pending: sees exactly one profile');
select tests.ok((select id from public.profiles) = '00000000-0000-0000-0000-00000000000d', 'pending: the profile is their own');
select tests.ok((select count(*) from public.parties) = 0, 'pending: zero parties');
select tests.ok((select count(*) from public.my_schedule(tests.today() - 30, tests.today() + 30)) = 0, 'pending: zero my_schedule rows');
select tests.ok((select count(*) from public.settings) = 0, 'pending: zero settings');
reset role;

-- ---------------------------------------------------------------------------
-- Host 1 (tier 1)
-- ---------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
select tests.ok((select count(*) from public.parties) = 0, 'host: zero rows from parties table');
select tests.ok((select count(*) from public.my_schedule(tests.today() - 30, tests.today() + 30)) = 2, 'host: my_schedule returns own 2 parties');
select tests.ok((select customer_name from public.my_schedule(tests.today() - 30, tests.today() + 30)
                 where party_date = tests.today() - 3) = 'Past Customer', 'host: past party shows customer_name');
select tests.ok((select revealed from public.my_schedule(tests.today() - 30, tests.today() + 30)
                 where party_date = tests.today() - 3), 'host: past party revealed = true');
select tests.ok((select customer_name is null and revealed = false and kids_count is null and party_type is null and notes is null
                 from public.my_schedule(tests.today() - 30, tests.today() + 30)
                 where party_date = tests.today() + 1), 'host: tomorrow party hidden (customer_name NULL, revealed false)');
select tests.ok((select start_time = '14:00' and end_time = '16:00'
                 from public.my_schedule(tests.today() - 30, tests.today() + 30)
                 where party_date = tests.today() + 1), 'host: tomorrow party slot times visible');
select tests.ok(not exists (select 1 from public.my_schedule(tests.today() - 30, tests.today() + 30)
                 where start_time = '17:00'), 'host: second host''s party not visible');
select tests.fails($$insert into public.parties (party_date, start_time, end_time, kids_count, party_type, customer_name, created_by)
                    values (current_date + 5, '10:00', '12:00', 4, 'other', 'Host Insert', '00000000-0000-0000-0000-000000000001')$$,
                   'host: cannot insert a party');
select tests.fails($$update public.profiles set role = 'admin' where id = auth.uid()$$, 'host: cannot change own role');
select tests.fails($$update public.profiles set tier = 3 where id = auth.uid()$$,       'host: cannot change own tier');
select tests.fails($$update public.profiles set status = 'pending' where id = auth.uid()$$, 'host: cannot change own status');
select tests.ok(tests.rows($$update public.profiles set full_name = 'Renamed Host' where id = auth.uid()$$) = 1,
                'host: can change own full_name');
select tests.ok(tests.rows($$update public.profiles set full_name = 'Hacked' where id = '00000000-0000-0000-0000-000000000002'$$) = 0,
                'host: cannot change another user''s profile');
select tests.ok(public.availability_locked(tests.this_monday() - 7), 'availability_locked(this Monday - 7) is true');
select tests.ok(not public.availability_locked(tests.this_monday() + 21), 'availability_locked(this Monday + 21) is false');
select tests.ok(tests.rows(format(
  $$insert into public.availability (profile_id, week_start, day_of_week, start_time, end_time)
    values ('00000000-0000-0000-0000-000000000001', %L, 6, '10:00', '18:00')$$, tests.this_monday() + 21)) = 1,
  'host: can insert availability 3 weeks ahead');
select tests.fails(format(
  $$insert into public.availability (profile_id, week_start, day_of_week, start_time, end_time)
    values ('00000000-0000-0000-0000-000000000001', %L, 6, '10:00', '18:00')$$, tests.this_monday() - 7),
  'host: cannot insert availability for a locked week');
reset role;

-- ---------------------------------------------------------------------------
-- Sales
-- ---------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
select tests.ok((select count(*) from public.parties) = 5, 'sales: sees all parties');
select tests.ok(tests.rows($$insert into public.parties (party_date, start_time, end_time, kids_count, party_type, customer_name, created_by)
                             values (current_date + 5, '10:00', '12:00', 4, 'other', 'Sales Insert', '00000000-0000-0000-0000-00000000000c')$$) = 1,
                'sales: can insert a party with created_by = self');
select tests.fails($$insert into public.parties (party_date, start_time, end_time, kids_count, party_type, customer_name, created_by)
                    values (current_date + 5, '10:00', '12:00', 4, 'other', 'Spoofed', '00000000-0000-0000-0000-00000000000b')$$,
                   'sales: cannot insert a party with created_by = someone else');
select tests.fails($$update public.parties set assigned_host = '00000000-0000-0000-0000-000000000001' where customer_name = 'Unassigned Customer'$$,
                   'sales: cannot update assigned_host');
select tests.fails($$update public.parties set assignment_locked = true where customer_name = 'Unassigned Customer'$$,
                   'sales: cannot update assignment_locked');
select tests.fails($$insert into public.parties (party_date, start_time, end_time, kids_count, party_type, customer_name, created_by, assigned_host)
                    values (current_date + 5, '10:00', '12:00', 4, 'other', 'X', '00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000001')$$,
                   'sales: cannot insert with assigned_host');
select tests.fails($$insert into public.parties (party_date, start_time, end_time, kids_count, party_type, customer_name, created_by, assignment_locked)
                    values (current_date + 5, '10:00', '12:00', 4, 'other', 'X', '00000000-0000-0000-0000-00000000000c', true)$$,
                   'sales: cannot insert with assignment_locked');
select tests.ok(tests.rows($$update public.parties set notes = 'Bring candles' where customer_name = 'Tomorrow Customer'$$) = 1,
                'sales: can edit details of an already-assigned party');
select tests.ok(tests.rows($$update public.settings set value = '7' where key = 'fairness_window_days'$$) = 0,
                'sales: cannot change settings');
reset role;

-- ---------------------------------------------------------------------------
-- Viewer (0005): reads parties and host names; writes nothing
-- ---------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000f', false);
select tests.ok(public.is_viewer(), 'viewer: is_viewer() is true');
select tests.ok(not public.can_manage_parties(), 'viewer: can_manage_parties() is false');
select tests.ok((select count(*) from public.parties) = 6, 'viewer: sees all parties (read)');
select tests.ok((select count(*) from public.profiles) = 1, 'viewer: sees only their own profile row');
select tests.ok((select count(*) from public.schedule_hosts()) = 3, 'viewer: schedule_hosts() lists the 3 active hosts');
select tests.ok(not exists (select 1 from public.schedule_hosts() where id = '00000000-0000-0000-0000-00000000000c'),
                'viewer: schedule_hosts() excludes non-hosts');
select tests.ok((select count(*) from public.availability) = 0, 'viewer: zero availability rows');
select tests.ok((select count(*) from public.settings) > 0, 'viewer: can read settings');
select tests.fails($$insert into public.parties (party_date, start_time, end_time, kids_count, party_type, customer_name, created_by)
                    values (current_date + 5, '10:00', '12:00', 4, 'other', 'Viewer Insert', '00000000-0000-0000-0000-00000000000f')$$,
                   'viewer: cannot insert a party');
select tests.ok(tests.rows($$update public.parties set assigned_host = '00000000-0000-0000-0000-000000000001' where customer_name = 'Unassigned Customer'$$) = 0,
                'viewer: cannot assign a host (0 rows)');
select tests.ok(tests.rows($$update public.parties set assignment_locked = true where customer_name = 'Unassigned Customer'$$) = 0,
                'viewer: cannot lock (0 rows)');
select tests.ok(tests.rows($$update public.parties set status = 'cancelled' where customer_name = 'Tomorrow Customer'$$) = 0,
                'viewer: cannot cancel a party (0 rows)');
select tests.ok(tests.rows($$update public.parties set notes = 'Viewer edit' where customer_name = 'Tomorrow Customer'$$) = 0,
                'viewer: cannot edit party details (0 rows)');
select tests.ok(tests.rows($$update public.settings set value = '7' where key = 'fairness_window_days'$$) = 0,
                'viewer: cannot change settings (0 rows)');
select tests.fails($$update public.profiles set role = 'manager' where id = auth.uid()$$, 'viewer: cannot change own role');
select tests.ok(tests.rows($$update public.profiles set full_name = 'Hacked' where id = '00000000-0000-0000-0000-000000000002'$$) = 0,
                'viewer: cannot change another user''s profile');
select tests.fails($$insert into public.availability (profile_id, week_start, day_of_week, start_time, end_time)
                    values ('00000000-0000-0000-0000-000000000001', current_date + 28, 6, '10:00', '18:00')$$,
                   'viewer: cannot write another user''s availability');
select tests.fails(format(
  $$insert into public.availability (profile_id, week_start, day_of_week, start_time, end_time)
    values ('00000000-0000-0000-0000-00000000000f', %L, 6, '10:00', '18:00')$$, tests.this_monday() + 21),
  'viewer (0006): cannot insert own availability');
reset role;
select tests.ok((select status from public.parties where customer_name = 'Tomorrow Customer') = 'active',
                'viewer: Tomorrow Customer still active after viewer attempts');
select tests.ok((select notes is distinct from 'Viewer edit' from public.parties where customer_name = 'Tomorrow Customer'),
                'viewer: Tomorrow Customer notes unchanged');

-- Non-viewers outside the schedule roles get nothing from schedule_hosts().
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
select tests.ok((select count(*) from public.schedule_hosts()) = 0, 'sales: schedule_hosts() returns zero rows');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
select tests.ok((select count(*) from public.schedule_hosts()) = 0, 'host: schedule_hosts() returns zero rows');
reset role;

-- ---------------------------------------------------------------------------
-- Manager
-- ---------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
select tests.ok(tests.rows($$update public.parties set assigned_host = '00000000-0000-0000-0000-000000000002', assignment_locked = true
                             where customer_name = 'Unassigned Customer'$$) = 1,
                'manager: can set assigned_host and assignment_locked');
select tests.ok(tests.rows($$update public.settings set value = '7' where key = 'fairness_window_days'$$) = 0,
                'manager: cannot change settings (0 rows)');
select tests.fails($$update public.parties set assigned_host = '00000000-0000-0000-0000-00000000000d' where customer_name = 'Sales Insert'$$,
                   'trigger: rejects a pending assigned_host');
select tests.fails($$update public.parties set assigned_host = '00000000-0000-0000-0000-00000000000c' where customer_name = 'Sales Insert'$$,
                   'trigger: rejects an assigned_host with no tier');
reset role;

-- ---------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select tests.ok(tests.rows($$update public.settings set value = '45' where key = 'fairness_window_days'$$) = 1,
                'admin: can change settings');
select tests.ok(tests.rows($$update public.profiles set status = 'removed' where id = '00000000-0000-0000-0000-00000000000e'$$) = 1,
                'admin: can remove a user');
select tests.fails($$update public.profiles set tier = 1 where id = '00000000-0000-0000-0000-00000000000f'$$,
                   'viewer (0006): admin cannot give a viewer a host tier');
reset role;

-- ---------------------------------------------------------------------------
-- Removed user
-- ---------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', false);
select tests.ok(not public.is_active(), 'removed: is_active() is false');
select tests.ok((select count(*) from public.my_schedule(tests.today() - 30, tests.today() + 30)) = 0, 'removed: zero my_schedule rows');
select tests.ok((select count(*) from public.parties) = 0, 'removed: zero parties');
reset role;

-- ---------------------------------------------------------------------------
-- Anon
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '', false);
set role anon;
select tests.fails($$select * from public.parties$$, 'anon: select from parties is denied');
select tests.fails($$select * from public.schedule_hosts()$$, 'anon: schedule_hosts() is denied');
reset role;

-- ---------------------------------------------------------------------------
-- 0002 and 0003 checks: protected profile and party fields, pending name, sales edits
-- ---------------------------------------------------------------------------
insert into public.parties (party_date, start_time, end_time, kids_count, party_type, customer_name, created_by)
  values ('2026-12-06', '10:00', '11:00', 3, 'other', 'Open Party', '00000000-0000-0000-0000-00000000000b');
insert into public.parties (party_date, start_time, end_time, kids_count, party_type, customer_name, assignment_locked)
  values ('2026-12-05', '10:00', '11:00', 3, 'other', 'Locked By Manager', true);

-- Sales: cannot change protected profile fields on own row.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
set role authenticated;
select tests.fails($$update public.profiles set email = 'spoof@test.local' where id = auth.uid()$$,
  '0002: user cannot change own email');
select tests.fails($$update public.profiles set created_at = now() + interval '1 day' where id = auth.uid()$$,
  '0002: user cannot change own created_at');
-- Sales: cannot change who created a party or when.
select tests.fails($$update public.parties set created_by = auth.uid() where customer_name = 'Open Party'$$,
  '0002: sales cannot change party created_by');
select tests.fails($$update public.parties set created_at = now() + interval '1 day' where customer_name = 'Open Party'$$,
  '0002: sales cannot change party created_at');
-- Sales: cannot move a locked party, but can still edit an unassigned one.
select tests.fails($$update public.parties set start_time = '12:00', end_time = '13:00' where customer_name = 'Locked By Manager'$$,
  '0003: sales cannot move a locked party');
update public.parties set start_time = '12:00', end_time = '13:00' where customer_name = 'Open Party';
update public.parties set kids_count = 4 where customer_name = 'Open Party';
reset role;
select tests.ok((select start_time from public.parties where customer_name = 'Open Party') = time '12:00',
  '0003: sales can still move an unassigned party');

-- Pending user: may save own name, may not change role or email.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
set role authenticated;
update public.profiles set full_name = 'Pending Person' where id = auth.uid();
select tests.fails($$update public.profiles set role = 'admin' where id = auth.uid()$$,
  '0003: pending user cannot change own role');
select tests.fails($$update public.profiles set email = 'spoof@test.local' where id = auth.uid()$$,
  '0002: pending user cannot change own email');
reset role;
select tests.ok((select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000d') = 'Pending Person',
  '0003: pending user name was saved');

-- 0007: invited_by is set by the new-user trigger from app_metadata, and users cannot change it.
insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data) values
  ('00000000-0000-0000-0000-000000000011', 'invitee@example.com', '{"full_name":"Invitee"}',
   '{"invited_by":"00000000-0000-0000-0000-00000000000c"}'),
  ('00000000-0000-0000-0000-000000000012', 'bogus@example.com', '{"full_name":"Bogus"}',
   '{"invited_by":"not-a-uuid"}');
select tests.ok((select invited_by from public.profiles where id = '00000000-0000-0000-0000-000000000011')
                = '00000000-0000-0000-0000-00000000000c', '0007: trigger records the inviter');
select tests.ok((select status from public.profiles where id = '00000000-0000-0000-0000-000000000011') = 'pending'
                and (select role from public.profiles where id = '00000000-0000-0000-0000-000000000011') = 'staff',
                '0007: an invited person starts pending with the default role');
select tests.ok((select invited_by is null from public.profiles where id = '00000000-0000-0000-0000-000000000012'),
                '0007: a malformed inviter id is ignored');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
set role authenticated;
select tests.fails($$update public.profiles set invited_by = null where id = auth.uid()$$,
                   '0007: a user cannot change their own invited_by');
reset role;

-- 0008: the server role may read only the invite-count columns of profiles.
select tests.ok(has_column_privilege('service_role', 'public.profiles', 'invited_by', 'select'), '0008: service_role can read invited_by');
select tests.ok(not has_column_privilege('service_role', 'public.profiles', 'email', 'select'), '0008: service_role cannot read email');
select tests.ok(not has_table_privilege('service_role', 'public.profiles', 'update'), '0008: service_role cannot update profiles');

-- 0009: Supabase sets app_metadata after creating the user; the update trigger records the inviter.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000013', 'late@example.com', '{"full_name":"Late Tag"}');
select tests.ok((select invited_by is null from public.profiles where id = '00000000-0000-0000-0000-000000000013'),
                '0009: no inviter before app_metadata arrives');
update auth.users set raw_app_meta_data = '{"provider":"email","invited_by":"00000000-0000-0000-0000-00000000000b"}'
 where id = '00000000-0000-0000-0000-000000000013';
select tests.ok((select invited_by from public.profiles where id = '00000000-0000-0000-0000-000000000013')
                = '00000000-0000-0000-0000-00000000000b', '0009: inviter recorded when app_metadata is set later');
update auth.users set raw_app_meta_data = '{"provider":"email","invited_by":"00000000-0000-0000-0000-00000000000a"}'
 where id = '00000000-0000-0000-0000-000000000013';
select tests.ok((select invited_by from public.profiles where id = '00000000-0000-0000-0000-000000000013')
                = '00000000-0000-0000-0000-00000000000b', '0009: an existing inviter is never overwritten');

select format('ALL %s ASSERTIONS PASSED', n) as result from tests.counter;
