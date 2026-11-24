-- ============================================================================
-- 0023: record that availability was submitted for a week, even when no windows
-- were entered. Staff who save an empty week are no longer sent back to the
-- availability page at every login. A row is never updated or deleted.
--
-- Writes: the person for their own unlocked week, or a manager/admin with the
-- override flag for an active staff target. Every override is logged.
--
-- Rollback:
--   drop trigger if exists availability_submission_audit on public.availability_submissions;
--   drop function if exists public.log_submission_override();
--   drop table if exists public.availability_submissions;
-- ============================================================================

create table public.availability_submissions (
  profile_id   uuid        not null references public.profiles(id) on delete cascade,
  week_start   date        not null,
  submitted_at timestamptz not null default now(),
  submitted_by uuid        not null references public.profiles(id),
  primary key (profile_id, week_start),
  constraint availability_submissions_week_is_monday check (extract(isodow from week_start) = 1)
);

alter table public.availability_submissions enable row level security;

-- Read: the person themself, and managers and admins.
create policy availability_submissions_select on public.availability_submissions
  for select to authenticated
  using (profile_id = auth.uid() or public.is_manager_or_admin());

-- Write by the person, for an unlocked week.
create policy availability_submissions_insert_self on public.availability_submissions
  for insert to authenticated
  with check (
    profile_id = auth.uid()
    and submitted_by = auth.uid()
    and public.is_active()
    and not public.availability_locked(week_start)
  );

-- Write by a manager or admin with the override flag, for an active staff target.
create policy availability_submissions_insert_override on public.availability_submissions
  for insert to authenticated
  with check (
    submitted_by = auth.uid()
    and public.can_override_availability()
    and public.is_hostess_target(profile_id)
  );

grant select, insert on public.availability_submissions to authenticated;

-- Backfill: anyone who already has windows for a week counts as submitted.
insert into public.availability_submissions (profile_id, week_start, submitted_by)
select distinct profile_id, week_start, profile_id
from public.availability
on conflict (profile_id, week_start) do nothing;

-- Log a marker written by someone other than the person (an override), in the same
-- audit table as window changes. The person's own submissions are not logged.
create or replace function public.log_submission_override()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or new.profile_id = auth.uid() then
    return null;
  end if;
  insert into public.availability_overrides (changed_by, profile_id, week_start, action, old_row, new_row)
  values (auth.uid(), new.profile_id, new.week_start, 'insert', null, to_jsonb(new));
  return null;
end;
$$;

create trigger availability_submission_audit
  after insert on public.availability_submissions
  for each row execute function public.log_submission_override();
