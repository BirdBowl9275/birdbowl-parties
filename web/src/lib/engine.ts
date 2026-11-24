// Assignment engine: decides which host gets each party for one week.
// Pure code with no database or network calls, so every rule can be unit tested.
// The database still enforces who may save assignments (RLS and the guard trigger).
//
// Order of work: parties are handled biggest first (by kids). Each party goes to an
// eligible host in the highest tier that has someone eligible. Within that tier the
// choice is: fewest parties this week, then the host whose average kids per party
// (over the rolling window ending on the party date) lands closest to the target,
// then the lowest parties-per-available-day in the window, then alphabetical.
// Counting per available day means a host who was unavailable for a stretch is not owed
// parties for it, so absence does not give them priority over someone always available.

import { addDays } from './parties';

export type Tier = 1 | 2 | 3; // 1 party hostess, 2 front desk, 3 server
export type PartyType = 'bowling' | 'other';

export type Window = { date: string; start: string; end: string }; // HH:MM

export type Host = {
  id: string;
  name: string;
  tier: Tier;
  availability: Window[];
};

export type Party = {
  id: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  kids: number;
  type: PartyType;
  // Fixed parties keep their host and count toward load. A manager lock or a
  // reveal that has already happened makes a party fixed.
  fixed: boolean;
  assignedHost: string | null;
};

// Parties outside this run that already have a host (for the fairness window).
export type HistoryParty = {
  hostId: string;
  date: string;
  start: string;
  end: string;
  kids: number;
};

// A day a host was marked available (any time window), used as the fairness denominator.
export type Offer = { hostId: string; date: string };

export type EngineSettings = {
  windowDays: number; // admin setting, default 30
  hostessAllowancePct: number; // admin setting, default 25
  bowlingServerAfter: string; // HH:MM, default 18:00
};

export type EngineResult = {
  assignments: { partyId: string; hostId: string }[];
  unassigned: { partyId: string; reason: 'no_eligible_host' | 'locked_host_missing' }[];
};

type Entry = { date: string; start: string; end: string; kids: number };

// Ceiling for a tier's average kids per party. Party hostesses may run up to the allowance
// above the team average. Everyone else may not run above the team average.
export function ceilingFor(tier: Tier, teamAverage: number, allowancePct: number): number {
  return tier === 1 ? teamAverage * (1 + allowancePct / 100) : teamAverage;
}

function inWindow(entry: Entry, date: string, windowDays: number): boolean {
  return entry.date >= addDays(date, -windowDays) && entry.date <= date;
}

function eligible(host: Host, party: Party, ledger: Map<string, Entry[]>, s: EngineSettings): boolean {
  // Bowling parties that start after the cutoff go to servers only. This overrides tier order.
  if (party.type === 'bowling' && party.start > s.bowlingServerAfter && host.tier !== 3) return false;

  const entries = ledger.get(host.id) ?? [];
  const sameDay = entries.filter((e) => e.date === party.date);

  // No overlapping time slots for the same host. There is no daily party limit.
  if (sameDay.some((e) => party.start < e.end && e.start < party.end)) return false;

  // Only people marked available for the whole party on that day.
  return host.availability.some(
    (w) => w.date === party.date && w.start <= party.start && w.end >= party.end,
  );
}

export function assignWeek(
  parties: Party[],
  hosts: Host[],
  history: HistoryParty[],
  settings: EngineSettings,
  offers: Offer[] = [],
): EngineResult {
  const hostById = new Map(hosts.map((h) => [h.id, h]));
  const ledger = new Map<string, Entry[]>(hosts.map((h) => [h.id, []]));
  const weekCount = new Map<string, number>(hosts.map((h) => [h.id, 0]));

  // Distinct days each host was available, for the per-available-day fairness share.
  const offerDates = new Map<string, Set<string>>();
  for (const o of offers) {
    const dates = offerDates.get(o.hostId) ?? new Set<string>();
    dates.add(o.date);
    offerDates.set(o.hostId, dates);
  }

  const record = (hostId: string, e: Entry) => ledger.get(hostId)?.push(e);

  for (const r of history) {
    if (hostById.has(r.hostId)) {
      record(r.hostId, { date: r.date, start: r.start, end: r.end, kids: r.kids });
    }
  }

  const result: EngineResult = { assignments: [], unassigned: [] };
  const open: Party[] = [];

  for (const p of parties) {
    if (p.fixed) {
      if (p.assignedHost && hostById.has(p.assignedHost)) {
        result.assignments.push({ partyId: p.id, hostId: p.assignedHost });
        record(p.assignedHost, { date: p.date, start: p.start, end: p.end, kids: p.kids });
        weekCount.set(p.assignedHost, (weekCount.get(p.assignedHost) ?? 0) + 1);
      } else {
        // A locked party whose host is no longer available is reported, never moved silently.
        result.unassigned.push({ partyId: p.id, reason: 'locked_host_missing' });
      }
    } else {
      open.push(p);
    }
  }

  // Biggest first, then date, start time and id so the order is always the same.
  const ordered = [...open].sort(
    (a, b) =>
      b.kids - a.kids || a.date.localeCompare(b.date) || a.start.localeCompare(b.start) || a.id.localeCompare(b.id),
  );
  const runKidsAverage = ordered.length
    ? ordered.reduce((sum, p) => sum + p.kids, 0) / ordered.length
    : 0;

  for (const p of ordered) {
    const candidates = hosts.filter((h) => eligible(h, p, ledger, settings));
    if (candidates.length === 0) {
      result.unassigned.push({ partyId: p.id, reason: 'no_eligible_host' });
      continue;
    }

    // Highest tier that has someone eligible (lower tiers only when higher ones can't take it).
    const topTier = Math.min(...candidates.map((h) => h.tier));
    const pool = candidates.filter((h) => h.tier === topTier);

    // Team average over the window ending on this party's date, across all hosts.
    let total = 0;
    let count = 0;
    for (const entries of ledger.values()) {
      for (const e of entries) {
        if (inWindow(e, p.date, settings.windowDays)) {
          total += e.kids;
          count += 1;
        }
      }
    }
    const teamAverage = count > 0 ? total / count : runKidsAverage;

    const scored = pool.map((h) => {
      const win = (ledger.get(h.id) ?? []).filter((e) => inWindow(e, p.date, settings.windowDays));
      const winSum = win.reduce((s, e) => s + e.kids, 0);
      const newAverage = (winSum + p.kids) / (win.length + 1);
      const ceiling = ceilingFor(h.tier, teamAverage, settings.hostessAllowancePct);
      // Days this host was available inside the window ending on the party date. With no offers
      // supplied this is 0, so the share falls back to the raw party count.
      const offeredDays = [...(offerDates.get(h.id) ?? [])].filter(
        (d) => d >= addDays(p.date, -settings.windowDays) && d <= p.date,
      ).length;
      return {
        host: h,
        weekParties: weekCount.get(h.id) ?? 0,
        overCeiling: newAverage > ceiling,
        deviation: Math.abs(newAverage - teamAverage),
        partiesPerDay: win.length / Math.max(offeredDays, 1),
      };
    });

    // Fewest parties this week first. Then anyone who would stay under their ceiling.
    // Then the host whose average, with this party, lands closest to the team average.
    // Then the lowest share of parties per day they were available in the window.
    scored.sort(
      (a, b) =>
        a.weekParties - b.weekParties ||
        Number(a.overCeiling) - Number(b.overCeiling) ||
        a.deviation - b.deviation ||
        a.partiesPerDay - b.partiesPerDay ||
        a.host.name.localeCompare(b.host.name) ||
        a.host.id.localeCompare(b.host.id),
    );

    const chosen = scored[0].host;
    result.assignments.push({ partyId: p.id, hostId: chosen.id });
    record(chosen.id, { date: p.date, start: p.start, end: p.end, kids: p.kids });
    weekCount.set(chosen.id, (weekCount.get(chosen.id) ?? 0) + 1);
  }

  return result;
}
