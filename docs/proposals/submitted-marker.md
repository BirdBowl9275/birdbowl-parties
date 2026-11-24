# Proposal: record that availability was submitted

Status: **draft, not approved.** Nothing has been changed in the database or the app.

## The problem

A staff member who saves no availability for next week is sent to the availability page on every login, until the week locks.

The cause is in two places:

- `web/src/app/app/page.tsx` redirects staff to `/app/availability` when next week is not locked **and** the person has zero `availability` rows for that week.
- `web/src/app/app/availability/actions.ts` (`saveAvailability`) accepts a save with every day unticked. It then inserts no rows, so the count stays at zero and the redirect fires again.

So "I have no time that week" cannot be recorded. The app treats it as "not answered yet."

## Proposed fix

Record the act of submitting, separately from the time windows.

### 1. New table (migration `0023_availability_submissions.sql`, draft below)

`availability_submissions`, one row per person per week:

| column | type | meaning |
|---|---|---|
| `profile_id` | uuid, FK to profiles | the person the week is for |
| `week_start` | date | the Monday of the week |
| `submitted_at` | timestamptz, default now() | when it was submitted |
| `submitted_by` | uuid, FK to profiles | who pressed save (the person, or a manager on override) |

Primary key `(profile_id, week_start)`. A row is never updated or deleted, so the submission time stays fixed.

### 2. Who can write it

- The person, for their own week, while the week is not locked (same rule as `availability`).
- A manager or admin with the override flag, for an active staff target (reuses `can_override_availability()` and `is_hostess_target()` from migration 0020/0022).
- Nobody else. No update or delete grants.

### 3. App changes (after approval)

- `saveAvailability` and `saveOverride`: after a successful save, insert the marker if it is not already there. This also covers a save with no days ticked.
- Staff landing (`app/page.tsx`): redirect to `/app/availability` only when next week is unlocked **and** no marker exists for that person and week. Replace the `availability` count with a check on `availability_submissions`.
- Override page: show "Submitted on …" or "Not submitted yet" for the chosen person and week. Optional, but it helps managers see who is missing.

### 4. Backfill

Insert a marker for every `(profile_id, week_start)` that already has availability rows, with `submitted_by = profile_id`. Without this, everyone who already submitted would be redirected once.

## Draft SQL (not applied)

```sql
-- 0023: record that availability was submitted for a week, even when no windows were entered.
create table public.availability_submissions (
  profile_id   uuid        not null references public.profiles(id) on delete cascade,
  week_start   date        not null,
  submitted_at timestamptz not null default now(),
  submitted_by uuid        not null references public.profiles(id),
  primary key (profile_id, week_start),
  constraint submissions_week_is_monday check (extract(isodow from week_start) = 1)
);

alter table public.availability_submissions enable row level security;

-- Read: the person themself, and managers and admins.
create policy submissions_select on public.availability_submissions
  for select to authenticated
  using (profile_id = auth.uid() or public.is_manager_or_admin());

-- Write by the person, for an unlocked week.
create policy submissions_insert_self on public.availability_submissions
  for insert to authenticated
  with check (
    profile_id = auth.uid()
    and submitted_by = auth.uid()
    and public.is_active()
    and not public.availability_locked(week_start)
  );

-- Write by a manager or admin with the override flag, for an active staff target.
create policy submissions_insert_override on public.availability_submissions
  for insert to authenticated
  with check (
    submitted_by = auth.uid()
    and public.can_override_availability()
    and public.is_hostess_target(profile_id)
  );

grant select, insert on public.availability_submissions to authenticated;

-- Backfill: everyone who already has windows for a week counts as submitted.
insert into public.availability_submissions (profile_id, week_start, submitted_by)
select distinct profile_id, week_start, profile_id
from public.availability
on conflict (profile_id, week_start) do nothing;
```

Notes on the draft:

- `submitted_by` is set from `auth.uid()` in both insert policies, so nobody can record a submission under someone else's name.
- The `week_start` Monday check should be confirmed against how `validWeekStart` builds dates before it is applied.
- The backfill uses `profile_id` as `submitted_by` because the SQL editor has no signed-in user.

## Audit

The override is already logged for availability windows (`log_availability_override`, migration 0020). Open question: should the marker insert also be logged when a manager writes it, so an override that enters no windows still leaves a record? I recommend yes, by attaching the same trigger to the new table. This needs your decision.

## Tests

- Unit tests for the redirect rule: no marker and unlocked redirects; marker present does not; locked does not.
- Unit or action test: a save with no days ticked still writes the marker.
- Database checks on the test project (`birdbowl-parties-test`) before live:
  - a staff member can insert their own marker while unlocked;
  - the same insert is refused once the week is locked;
  - a staff member cannot insert a marker for someone else;
  - a manager with the override flag can insert for an active staff target, and not for a manager or admin;
  - a manager without the flag is refused;
  - a second insert for the same week is refused (primary key).
- Run the full test suite and build (`node node_modules/vitest/vitest.mjs run`, `node node_modules/next/dist/bin/next build`).

## Rollback

- Migration: `drop table public.availability_submissions;`
- App: revert the redirect in `web/src/app/app/page.tsx` to the availability count check, and remove the marker insert from the two save actions.

## Decisions needed from you

1. Approve the table and policies above (schema change on the test project first, then live, each approved separately).
2. Approve the app change to the staff redirect and the two save actions.
3. Decide whether manager overrides on the marker should be logged (recommended: yes).
4. Decide whether the override page should show submitted or not submitted (recommended: yes).

No database change and no deploy happens until you approve each step.
