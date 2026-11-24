-- ============================================================================
-- 0024 (DRAFT, not applied): business opening times for the availability
-- "All day" tick, stored as admin settings so managers can change them.
--
-- Sunday to Thursday open 10:00 a.m. Friday and Saturday open 9:00 a.m.
-- The All day tick always ends at 11:59 p.m., because an availability window
-- cannot cross midnight. Closing times are therefore not stored.
--
-- Values are JSON strings in HH:MM (24-hour), the same format as the other
-- time settings. The admin Settings page shows them with a.m./p.m. pickers.
--
-- Rollback:
--   delete from public.settings where key in ('business_open_weekday', 'business_open_weekend');
-- ============================================================================

insert into public.settings (key, value) values
  ('business_open_weekday', '"10:00"'),  -- Sunday to Thursday
  ('business_open_weekend', '"09:00"')   -- Friday and Saturday
on conflict (key) do nothing;
