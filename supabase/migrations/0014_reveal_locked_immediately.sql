-- ============================================================================
-- 0014: party details reveal rule.
--
-- Rule (2026-11-23): details (customer, kids count, party type, notes) show to the assigned
-- hostess at 8:00 a.m. Eastern on the party date. A party whose assignment is locked
-- (parties.assignment_locked = true) shows its details immediately, with no wait for 8 a.m.
--
-- Unchanged: the week visibility cutoff from 0011 (a hostess sees her slots from the cutoff
-- onward), the slot times, and the 14-day range.
--
-- Rollback: re-run the my_schedule definition from 0011_schedule_visible_from_cutoff.sql.
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
              at time zone public.setting_text('business_tz')) as reveal_at,
           -- Cutoff for the week that contains this party, plus 5 minutes (unchanged from 0011).
           ((((p.party_date - (extract(isodow from p.party_date)::int - 1))
                + (public.setting_text('availability_cutoff_dow')::int - 1) - 7)
                + public.setting_text('availability_cutoff_time')::time)
              at time zone public.setting_text('business_tz')) + interval '5 minutes' as visible_from
    from public.parties p
    where p.assigned_host = auth.uid()
      and p.status = 'active'
      and p.party_date between p_from and p_to
      and public.is_active()
  ),
  shown as (
    select m.*,
           (m.assignment_locked or now() >= m.reveal_at) as is_revealed
    from mine m
    where now() >= m.visible_from
  )
  select s.id,
         s.party_date,
         s.start_time,
         s.end_time,
         s.is_revealed,
         case when s.is_revealed then s.party_type    end,
         case when s.is_revealed then s.customer_name end,
         case when s.is_revealed then s.kids_count    end,
         case when s.is_revealed then s.notes         end
  from shown s
  order by s.party_date, s.start_time
$$;
