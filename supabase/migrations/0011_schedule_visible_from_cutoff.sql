-- ============================================================================
-- 0011: staff see a week's assignments only from the cutoff plus 5 minutes.
--
-- Rule (2026-11-23): a hostess's assigned parties for a week appear on her schedule starting
-- Wednesday 8:05 p.m. Eastern of the week before. Before that, nothing for that week shows.
-- The cutoff is the same setting the availability lock uses (availability_cutoff_dow and
-- availability_cutoff_time), so the two stay in step. Only the visibility check is new; slot
-- times, the 8 a.m. reveal and the 14-day range are unchanged.
--
-- Rollback: re-run the my_schedule definition from 0001_init.sql (the "Staff schedule" section).
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
           -- Cutoff for the week that contains this party (the Monday before it, then the
           -- cutoff day and time, same arithmetic as availability_locked), plus 5 minutes.
           ((((p.party_date - (extract(isodow from p.party_date)::int - 1))
                + (public.setting_text('availability_cutoff_dow')::int - 1) - 7)
                + public.setting_text('availability_cutoff_time')::time)
              at time zone public.setting_text('business_tz')) + interval '5 minutes' as visible_from
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
  where now() >= m.visible_from
  order by m.party_date, m.start_time
$$;
