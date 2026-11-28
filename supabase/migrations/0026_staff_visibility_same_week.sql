-- ============================================================================
-- 0026 (DRAFT, not applied): hostesses see their party time slots from the
-- availability cutoff of the SAME schedule week (Wednesday 8:00 p.m. Eastern),
-- not the week before. Matches migration 0025, which changed the lock rule.
--
-- Only visible_from changes. The return columns match migration 0017, including
-- party_start_time. Details still show at the reveal time (8:00 a.m. on the day
-- of the party), or sooner if the party is locked.
--
-- Rollback: re-run the my_schedule function from 0017_party_start_on_schedule.sql.
-- ============================================================================

create or replace function public.my_schedule(
  p_from date default current_date,
  p_to   date default current_date + 14
)
returns table (
  party_id         bigint,
  party_date       date,
  start_time       time,
  end_time         time,
  revealed         boolean,
  party_type       public.party_type,
  customer_name    text,
  kids_count       smallint,
  notes            text,
  party_start_time time
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
           -- Cutoff day inside the party's own schedule week (same rule as availability_locked).
           ((((p.party_date - (extract(isodow from p.party_date)::int - 1))
                + (public.setting_text('availability_cutoff_dow')::int - 1))
                + public.setting_text('availability_cutoff_time')::time)
              at time zone public.setting_text('business_tz')) + interval '5 minutes' as visible_from,
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
         case when s.is_revealed then s.notes         end,
         s.start_time
  from shown s
  order by s.party_date, s.start_time
$$;
