-- ============================================================================
-- 0012: staff_shifts may end after midnight (for example 5:00 PM to 2:00 AM).
--
-- end_time stays a time of day. end_next_day = true means the shift ends on the following
-- calendar day, so the length is end_time + 24h - start_time. Without this, overnight shifts
-- would be cut at midnight and undercount hours against the 35-hour cap.
--
-- Rollback: delete overnight rows first (end_next_day = true), then
--   alter table public.staff_shifts drop constraint staff_shifts_end_check;
--   alter table public.staff_shifts drop column end_next_day;
--   alter table public.staff_shifts add constraint staff_shifts_check check (end_time > start_time);
-- ============================================================================

alter table public.staff_shifts
  add column end_next_day boolean not null default false;

alter table public.staff_shifts drop constraint staff_shifts_check;

alter table public.staff_shifts add constraint staff_shifts_end_check check (
  (end_next_day and end_time <= start_time)
  or (not end_next_day and end_time > start_time)
);
