// Business hours for the availability "All day" tick. Pure, so it is unit tested.
//
// Sunday to Thursday: open 10:00 a.m., close 12:00 a.m. (midnight).
// Friday and Saturday: open 9:00 a.m., close 2:00 a.m.
//
// An availability window cannot cross midnight, so "All day" runs from opening to 11:59 p.m. on
// the same date. Hours after midnight are not part of the tick. Day numbers follow availability:
// 1 = Monday ... 5 = Friday, 6 = Saturday, 7 = Sunday.
//
// The two opening times are admin settings (business_open_weekday, business_open_weekend, migration
// 0024). If a setting is missing or not HH:MM, the default below is used.

export type Hours = { weekdayOpen: string; weekendOpen: string };

export const DEFAULT_HOURS: Hours = {
  weekdayOpen: '10:00', // Sunday to Thursday
  weekendOpen: '09:00', // Friday and Saturday
};

export const ALL_DAY_END = '23:59';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

// Reads the opening times from the settings values. Settings are stored as JSON strings, so the
// quotes are removed before the HH:MM check.
export function hoursFromSettings(values: ReadonlyMap<string, unknown>): Hours {
  const read = (key: string, fallback: string): string => {
    const clean = String(values.get(key) ?? '').replace(/"/g, '').trim();
    return HHMM.test(clean) ? clean : fallback;
  };
  return {
    weekdayOpen: read('business_open_weekday', DEFAULT_HOURS.weekdayOpen),
    weekendOpen: read('business_open_weekend', DEFAULT_HOURS.weekendOpen),
  };
}

export function allDayWindow(day: number, hours: Hours = DEFAULT_HOURS): { start: string; end: string } {
  const weekend = day === 5 || day === 6;
  return { start: weekend ? hours.weekendOpen : hours.weekdayOpen, end: ALL_DAY_END };
}
