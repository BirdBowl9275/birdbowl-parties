-- ============================================================================
-- 0025 (DRAFT, not applied): the availability cutoff falls inside the schedule
-- week, not the week before it.
--
-- Before: the cutoff day was in the week BEFORE the schedule week, so the week
-- of Mon Nov 23 locked on Wed Nov 18 at the cutoff time.
-- After: the cutoff day is the Wednesday of the schedule week itself, so the
-- week of Mon Nov 23 locks on Wed Nov 25 at the cutoff time (8:00 p.m. Eastern).
--
-- Effect on applying: the week of Nov 23 becomes OPEN for staff again until
-- Wed Nov 25 at the cutoff time. Parties before the cutoff are hand picked by a
-- manager, as agreed.
--
-- Only availability_locked changes. RLS on availability and availability_submissions
-- already calls it, so they follow the new rule.
--
-- Rollback: re-run the function from 0001_init.sql (the "- 7" version).
-- ============================================================================

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
    (p_week_start + (public.setting_text('availability_cutoff_dow')::int - 1))
    + public.setting_text('availability_cutoff_time')::time
  ) at time zone public.setting_text('business_tz');
  return now() >= v_cutoff;
end;
$$;
