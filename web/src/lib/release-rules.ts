// Chooses the replacement hostess when a party is released. Pure, so it is unit tested.
// The server action gathers the data (with the admin key, server side only) and calls this.
// Rules: the same eligibility as schedule-rules.ts, plus the hostess must be available for the whole
// arrival-to-end window and must be under her daily cap. The first eligible hostess in priority
// order gets the party (direct assignment).

import {
  arrivalFor,
  checkEligibility,
  priorityCompare,
  weeklyHours,
  type Booking,
  type ShiftRow,
} from './schedule-rules';

export type ReleaseParty = { id: number; date: string; start: string; end: string };
export type Booked = { partyId: number; date: string; start: string; end: string };
export type AvailWindow = { date: string; start: string; end: string };
export type ReplacementCandidate = {
  id: string;
  name: string;
  shifts: ShiftRow[];
  booked: Booked[];
  availability: AvailWindow[];
};

const mins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// True when one availability window on the date covers the whole arrival-to-end window.
export function availabilityFits(windows: AvailWindow[], date: string, arrival: string, end: string): boolean {
  return windows.some((w) => w.date === date && mins(w.start) <= mins(arrival) && mins(w.end) >= mins(end));
}

// Each booking's arrival depends on whether it is the first party that day for that hostess.
function toBookings(booked: Booked[]): Booking[] {
  return booked.map((b) => {
    const sameDay = booked.filter((o) => o.date === b.date);
    const earliest = Math.min(...sameDay.map((o) => mins(o.start)));
    return {
      date: b.date,
      arrival: arrivalFor({ start: b.start, isFirstOfDay: mins(b.start) === earliest }),
      end: b.end,
    };
  });
}

export function pickReplacement(
  party: ReleaseParty,
  releaserId: string,
  candidates: ReplacementCandidate[],
): { hostId: string; name: string } | null {
  const eligible: { c: ReplacementCandidate; hours: number }[] = [];

  for (const c of candidates) {
    if (c.id === releaserId) continue;
    const others = c.booked.filter((b) => b.partyId !== party.id);

    const isFirstOfDay = others.filter((b) => b.date === party.date).every((b) => mins(party.start) <= mins(b.start));
    const result = checkEligibility(
      { id: c.id, name: c.name, shifts: c.shifts, bookings: toBookings(others) },
      { date: party.date, start: party.start, end: party.end, isFirstOfDay },
    );
    if (!result.eligible) continue;
    if (!availabilityFits(c.availability, party.date, result.arrival, party.end)) continue;

    eligible.push({ c, hours: weeklyHours(c.shifts) });
  }

  eligible.sort((a, b) => priorityCompare({ hours: a.hours }, { hours: b.hours }) || a.c.name.localeCompare(b.c.name));
  const first = eligible[0];
  return first ? { hostId: first.c.id, name: first.c.name } : null;
}
