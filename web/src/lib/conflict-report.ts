// Builds the read-only conflict report for one week. No I/O and no writes, so it is unit tested.
// It uses the eligibility rules in schedule-rules.ts. It never assigns anyone.

import {
  arrivalFor,
  checkEligibility,
  priorityCompare,
  weeklyHours,
  type Booking,
  type ShiftRow,
} from './schedule-rules';

export type ReportParty = { id: number; date: string; start: string; end: string };
export type ReportHost = { id: string; name: string };
export type ReportShift = {
  profileId: string | null;
  staffName: string;
  tier: 1 | 2 | 3;
  date: string;
  start: string;
  end: string;
  // True when the shift ends on the following calendar day (for example 5 PM to 2 AM).
  endNextDay?: boolean;
};
export type ReportAssignment = { partyId: number; hostId: string };

export type CandidateRow = {
  hostId: string;
  name: string;
  hours: number;
  hoursAfter: number;
  eligible: boolean;
  arrival: string;
  reasons: string[];
};

export type PartyReport = { party: ReportParty; candidates: CandidateRow[] };

export type ConflictReport = {
  parties: PartyReport[];
  hostHours: { hostId: string; name: string; hours: number }[];
  // Shift rows whose name did not match an app account. Shown so a manager can fix the match.
  unmatchedShiftNames: string[];
};

type Booked = { partyId: number; date: string; start: string; end: string };

// Turns a host's booked parties into rule-ready bookings, with each arrival set by its own
// first-of-day status on that date.
function toBookings(booked: Booked[]): Booking[] {
  return booked.map((b) => {
    const sameDay = booked.filter((o) => o.date === b.date);
    const earliest = Math.min(...sameDay.map((o) => parseHHMM(o.start)));
    const isFirstOfDay = parseHHMM(b.start) === earliest;
    return { date: b.date, arrival: arrivalFor({ start: b.start, isFirstOfDay }), end: b.end };
  });
}

function parseHHMM(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function buildConflictReport(input: {
  parties: ReportParty[];
  hosts: ReportHost[];
  shifts: ReportShift[];
  assignments: ReportAssignment[];
}): ConflictReport {
  const shiftsByHost = new Map<string, ShiftRow[]>();
  const unmatched = new Set<string>();
  for (const s of input.shifts) {
    if (!s.profileId) {
      unmatched.add(s.staffName);
      continue;
    }
    const list = shiftsByHost.get(s.profileId) ?? [];
    list.push({ tier: s.tier, date: s.date, start: s.start, end: s.end, endNextDay: s.endNextDay });
    shiftsByHost.set(s.profileId, list);
  }

  const partyById = new Map(input.parties.map((p) => [p.id, p]));
  const bookedByHost = new Map<string, Booked[]>();
  for (const a of input.assignments) {
    const p = partyById.get(a.partyId);
    if (!p) continue;
    const list = bookedByHost.get(a.hostId) ?? [];
    list.push({ partyId: p.id, date: p.date, start: p.start, end: p.end });
    bookedByHost.set(a.hostId, list);
  }

  const sortedParties = [...input.parties].sort(
    (a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start) || a.id - b.id,
  );

  const parties: PartyReport[] = sortedParties.map((party) => {
    const candidates: CandidateRow[] = input.hosts.map((host) => {
      const shifts = shiftsByHost.get(host.id) ?? [];
      // Other parties this host holds, not counting this one.
      const others = (bookedByHost.get(host.id) ?? []).filter((b) => b.partyId !== party.id);
      const sameDayStarts = others.filter((b) => b.date === party.date).map((b) => parseHHMM(b.start));
      const isFirstOfDay = sameDayStarts.every((s) => parseHHMM(party.start) <= s);

      const result = checkEligibility(
        { id: host.id, name: host.name, shifts, bookings: toBookings(others) },
        { date: party.date, start: party.start, end: party.end, isFirstOfDay },
      );
      return {
        hostId: host.id,
        name: host.name,
        hours: weeklyHours(shifts),
        hoursAfter: result.hoursAfter,
        eligible: result.eligible,
        arrival: result.arrival,
        reasons: result.reasons,
      };
    });

    // Eligible first, then the priority order (under 32 with most room, then 32 to 35).
    candidates.sort(
      (a, b) =>
        Number(b.eligible) - Number(a.eligible) ||
        priorityCompare({ hours: a.hours }, { hours: b.hours }) ||
        a.name.localeCompare(b.name),
    );
    return { party, candidates };
  });

  const hostHours = input.hosts
    .map((h) => ({ hostId: h.id, name: h.name, hours: weeklyHours(shiftsByHost.get(h.id) ?? []) }))
    .sort((a, b) => a.hours - b.hours || a.name.localeCompare(b.name));

  return { parties, hostHours, unmatchedShiftNames: [...unmatched].sort() };
}
