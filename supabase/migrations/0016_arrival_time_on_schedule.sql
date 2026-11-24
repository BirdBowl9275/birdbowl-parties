-- ============================================================================
-- 0016: a hostess's first party of the day starts one hour early on her schedule.
--
-- Rule (2026-11-23): a hostess arrives one hour before her first party of the day. Her schedule
-- shows that arrival time as the start. Later parties that day keep their own start time.
-- The end time never changes.
--
-- Only the displayed start time changes. Reveal rules, week visibility and the 14-day range are
-- the same as migration 0014.
--
-- Rollback: re-run the my_schedule definition from 0014_reveal_locked_immediately.sql.
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
           ((((p.party_date - (extract(isodow from p.party_date)::int - 1))
                + (public.setting_text('availability_cutoff_dow')::int - 1) - 7)
                + public.setting_text('availability_cutoff_time')::time)
              at time zone public.setting_text('business_tz')) + interval '5 minutes' as visible_from,
           -- 1 for this hostess's earliest active party on the date. Only her own parties are in
           -- this set, because of the assigned_host filter below.
           row_number() over (
             partition by p.party_date
             order by p.start_time, p.id
           ) as day_order
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
         case when s.day_order = 1 then s.start_time - interval '60 minutes' else s.start_time end::time,
         s.end_time,
         s.is_revealed,
         case when s.is_revealed then s.party_type    end,
         case when s.is_revealed then s.customer_name end,
         case when s.is_revealed then s.kids_count    end,
         case when s.is_revealed then s.notes         end
  from shown s
  order by s.party_date, s.start_time
$$;
