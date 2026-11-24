-- ============================================================================
-- 0017: my_schedule also returns the party's own start time.
--
-- Decision (2026-11-23): a hostess's first party of the day shows her arrival time (one hour
-- early) as its start, and a line under it says when the party itself starts. party_start_time
-- is that party's real start. For every other party it equals start_time.
--
-- Changing the return columns needs drop-then-create. Everything else is the same as 0016.
--
-- Rollback: drop function public.my_schedule(date, date); then re-run the definition in
-- 0016_arrival_time_on_schedule.sql.
-- ============================================================================

drop function if exists public.my_schedule(date, date);

create function public.my_schedule(
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
           ((((p.party_date - (extract(isodow from p.party_date)::int - 1))
                + (public.setting_text('availability_cutoff_dow')::int - 1) - 7)
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
