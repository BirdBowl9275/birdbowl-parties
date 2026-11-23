// Pure eligibility and priority rules for assigning hostesses. No I/O, so they are unit tested.
// The database and RLS protect the data. These rules decide who may be offered a party.
//
// Rules (from the 2026-11-23 requirements):
//  - A hostess's weekly hours may never exceed MAX_WEEKLY_HOURS (35).
//  - Staff under PRIORITY_BELOW_HOURS (32) are considered first. Among them, the one with the most
//    room under 32 goes first. Staff at 32 or more come after, lowest hours first.
//  - A hostess arrives ARRIVAL_LEAD_MIN (60) minutes before her first party of the day.
//    Later parties that day start at the party start time.
//  - No overlap with a front desk or server shift on the same date (conflict check only).
//  - A hostess is eligible for another party only if the next arrival is at least
//    GAP_AFTER_PARTY_MIN (30) minutes after the previous party ends, in either order.

export const MAX_WEEKLY_HOURS = 35;
export const PRIORITY_BELOW_HOURS = 32;
export const ARRIVAL_LEAD_MIN = 60;
export const GAP_AFTER_PARTY_MIN = 30;

// Times are "HH:MM" on the same calendar date.
export type ShiftRow = { tier: 1 | 2 | 3; date: string; start: string; end: string };

// A party this hostess is already booked for. `arrival` is when she must be there.
export type Booking = { date: string; arrival: string; end: string };

export type Candidate = {
  id: string;
  name: string;
  // HotSchedules shifts for the week, all roles. Used for hours and conflicts.
  shifts: ShiftRow[];
  // Parties she is already assigned to this week.
  bookings: Booking[];
};

export type PartyRequest = {
  date: string;
  start: string;
  end: string;
  // True when this is the hostess's first party of the day, which sets the one-hour arrival.
  isFirstOfDay: boolean;
};

export type Eligibility = {
  eligible: boolean;
  arrival: string;
  hoursAfter: number;
  reasons: string[];
};

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function toHHMM(total: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, total));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function arrivalFor(party: Pick<PartyRequest, 'start' | 'isFirstOfDay'>): string {
  const lead = party.isFirstOfDay ? ARRIVAL_LEAD_MIN : 0;
  return toHHMM(toMinutes(party.start) - lead);
}

export function shiftHours(shift: Pick<ShiftRow, 'start' | 'end'>): number {
  return (toMinutes(shift.end) - toMinutes(shift.start)) / 60;
}

export function weeklyHours(shifts: ShiftRow[]): number {
  return shifts.reduce((sum, s) => sum + shiftHours(s), 0);
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function checkEligibility(candidate: Candidate, party: PartyRequest): Eligibility {
  const reasons: string[] = [];
  const arrival = arrivalFor(party);
  const arrivalMin = toMinutes(arrival);
  const endMin = toMinutes(party.end);

  // Hours cap: current HotSchedules hours plus this party's arrival-to-end time.
  const current = weeklyHours(candidate.shifts);
  const added = (endMin - arrivalMin) / 60;
  const hoursAfter = current + added;
  if (hoursAfter > MAX_WEEKLY_HOURS) {
    reasons.push(`Would reach ${hoursAfter.toFixed(1)} hours (limit ${MAX_WEEKLY_HOURS}).`);
  }

  // Conflicts: front desk (2) or server (3) shifts that overlap the arrival-to-end window.
  for (const s of candidate.shifts) {
    if (s.date !== party.date || (s.tier !== 2 && s.tier !== 3)) continue;
    if (overlaps(arrivalMin, endMin, toMinutes(s.start), toMinutes(s.end))) {
      reasons.push(`Overlaps a ${s.tier === 2 ? 'front desk' : 'server'} shift (${s.start}–${s.end}).`);
      break;
    }
  }

  // Gap: the next party's arrival must be at least 30 minutes after the other party ends,
  // or the new party must end at least 30 minutes before the other party's arrival.
  for (const b of candidate.bookings) {
    if (b.date !== party.date) continue;
    const bArrival = toMinutes(b.arrival);
    const bEnd = toMinutes(b.end);
    const after = arrivalMin >= bEnd + GAP_AFTER_PARTY_MIN;
    const before = endMin + GAP_AFTER_PARTY_MIN <= bArrival;
    if (!after && !before) {
      reasons.push(`Needs 30 minutes between parties; another party ends at ${b.end}.`);
      break;
    }
  }

  return { eligible: reasons.length === 0, arrival, hoursAfter, reasons };
}

// Order for offers: under 32 first (most room first), then 32 to 35 (lowest hours first).
export function priorityCompare(a: { hours: number }, b: { hours: number }): number {
  const aUnder = a.hours < PRIORITY_BELOW_HOURS;
  const bUnder = b.hours < PRIORITY_BELOW_HOURS;
  if (aUnder !== bUnder) return aUnder ? -1 : 1;
  if (aUnder) return (PRIORITY_BELOW_HOURS - b.hours) - (PRIORITY_BELOW_HOURS - a.hours);
  return a.hours - b.hours;
}

export function rankCandidates(candidates: Candidate[]): Candidate[] {
  return [...candidates]
    .map((c) => ({ c, hours: weeklyHours(c.shifts) }))
    .sort((x, y) => priorityCompare({ hours: x.hours }, { hours: y.hours }) || x.c.name.localeCompare(y.c.name))
    .map((x) => x.c);
}
