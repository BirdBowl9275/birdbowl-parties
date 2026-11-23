// Availability form rules. Pure, so they are unit tested. The database (RLS and availability_locked)
// is what actually enforces the cutoff and ownership.

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export type DayInput = { day: number; on: boolean; start: string; end: string };
export type Window = { day: number; start: string; end: string };
export type ParseResult = { ok: true; windows: Window[] } | { ok: false; error: string };

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// One window per day. A day that is switched off contributes nothing.
export function parseAvailability(days: DayInput[]): ParseResult {
  const windows: Window[] = [];
  for (const d of days) {
    if (!d.on) continue;
    const name = DAY_NAMES[d.day - 1] ?? `Day ${d.day}`;
    if (!HHMM.test(d.start) || !HHMM.test(d.end)) {
      return { ok: false, error: `${name}: enter both times as HH:MM.` };
    }
    if (toMinutes(d.end) <= toMinutes(d.start)) {
      return { ok: false, error: `${name}: the end time must be after the start time.` };
    }
    windows.push({ day: d.day, start: d.start, end: d.end });
  }
  return { ok: true, windows };
}

// Parses the form fields on-1..on-7, start-1..start-7, end-1..end-7.
export function daysFromForm(get: (name: string) => string): DayInput[] {
  return [1, 2, 3, 4, 5, 6, 7].map((day) => ({
    day,
    on: get(`on-${day}`) === 'on',
    start: get(`start-${day}`).trim(),
    end: get(`end-${day}`).trim(),
  }));
}
