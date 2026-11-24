// Validation and week helpers for party entry. Pure functions, so they can be unit tested.
// The database enforces who may change assignments (the guard trigger), so sales can't set hosts here.

export const PARTY_TYPES = ['bowling', 'other'] as const;
export type PartyType = (typeof PARTY_TYPES)[number];

export type PartyInput = {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  kids: string;
  partyType: string;
  customerName: string;
  notes: string;
};

export type PartyValue = {
  partyDate: string;
  startTime: string;
  endTime: string;
  kidsCount: number;
  partyType: PartyType;
  customerName: string;
  notes: string;
};

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isRealDate(s: string): boolean {
  if (!DATE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function validateParty(input: PartyInput): ValidationResult<PartyValue> {
  const date = input.date.trim();
  if (!isRealDate(date)) return { ok: false, error: 'Pick a valid date.' };

  const startTime = input.startTime.trim();
  const endTime = input.endTime.trim();
  if (!TIME.test(startTime) || !TIME.test(endTime)) {
    return { ok: false, error: 'Pick a start and end time, like 2:00 p.m.' };
  }
  if (endTime <= startTime) return { ok: false, error: 'End time must be after the start time.' };

  const kids = Number(input.kids.trim());
  if (!Number.isInteger(kids) || kids < 0 || kids > 200) {
    return { ok: false, error: 'Kids must be a whole number from 0 to 200.' };
  }

  if (!(PARTY_TYPES as readonly string[]).includes(input.partyType)) {
    return { ok: false, error: 'Pick Bowling or Arcade.' };
  }

  const customerName = input.customerName.trim();
  if (customerName.length === 0 || customerName.length > 120) {
    return { ok: false, error: 'Customer name is required (up to 120 characters).' };
  }

  const notes = input.notes.trim();
  if (notes.length > 500) return { ok: false, error: 'Notes must be 500 characters or fewer.' };

  return {
    ok: true,
    value: {
      partyDate: date,
      startTime,
      endTime,
      kidsCount: kids,
      partyType: input.partyType as PartyType,
      customerName,
      notes,
    },
  };
}

// Monday that starts the ISO week containing the given date (YYYY-MM-DD).
export function weekStart(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

// Monday of the week for a user-supplied date. A bad or missing date (for example 2026-99-99)
// uses the fallback instead of throwing, so the request fails cleanly rather than with a 500.
export function validWeekStart(input: string | null | undefined, fallback: string): string {
  const candidate = (input ?? '').trim();
  return weekStart(isRealDate(candidate) ? candidate : fallback);
}

// Today's date (YYYY-MM-DD) in the business time zone, so a late-evening Eastern date is not
// treated as tomorrow.
export function todayBusiness(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(now);
}

// Current time (HH:MM) in the business time zone.
export function nowClockBusiness(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);
}

// Adds whole days to a YYYY-MM-DD date (negative to go back).
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekDays(monday: string): string[] {
  const d = new Date(`${monday}T00:00:00Z`);
  return Array.from({ length: 7 }, (_, i) => {
    const copy = new Date(d);
    copy.setUTCDate(d.getUTCDate() + i);
    return copy.toISOString().slice(0, 10);
  });
}
