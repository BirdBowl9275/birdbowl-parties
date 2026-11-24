// Business hours for the availability "All day" tick. Pure, so it is unit tested.
//
// Sunday to Thursday: open 10:00 a.m., close 12:00 a.m. (midnight).
// Friday and Saturday: open 9:00 a.m., close 2:00 a.m.
//
// An availability window cannot cross midnight, so "All day" runs from opening to 11:59 p.m. on
// the same date. Hours after midnight are not part of the tick. Day numbers follow availability:
// 1 = Monday ... 5 = Friday, 6 = Saturday, 7 = Sunday.

export const BUSINESS_HOURS = {
  weekdayOpen: '10:00', // Sunday to Thursday
  weekendOpen: '09:00', // Friday and Saturday
} as const;

export const ALL_DAY_END = '23:59';

export function allDayWindow(day: number): { start: string; end: string } {
  const weekend = day === 5 || day === 6;
  return { start: weekend ? BUSINESS_HOURS.weekendOpen : BUSINESS_HOURS.weekdayOpen, end: ALL_DAY_END };
}
