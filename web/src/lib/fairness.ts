// Fairness summary for managers: parties, total kids and average kids per person over the window.
// Pure code, so it can be unit tested. Window ends on the day of the summary and counts back
// the admin-set number of days.

import { addDays } from './parties';

export type SummaryParty = { hostId: string; date: string; kids: number };

export type HostSummary = {
  hostId: string;
  parties: number;
  totalKids: number;
  averageKids: number | null; // null when the host has no parties in the window
};

export function fairnessSummary(
  parties: SummaryParty[],
  hostIds: string[],
  asOf: string,
  windowDays: number,
): HostSummary[] {
  const from = addDays(asOf, -windowDays);
  const rows = new Map<string, { parties: number; totalKids: number }>(
    hostIds.map((id) => [id, { parties: 0, totalKids: 0 }]),
  );

  for (const p of parties) {
    if (p.date < from || p.date > asOf) continue;
    const row = rows.get(p.hostId);
    if (!row) continue;
    row.parties += 1;
    row.totalKids += p.kids;
  }

  return hostIds
    .map((id) => {
      const row = rows.get(id)!;
      return {
        hostId: id,
        parties: row.parties,
        totalKids: row.totalKids,
        averageKids: row.parties > 0 ? row.totalKids / row.parties : null,
      };
    })
    .sort((a, b) => a.hostId.localeCompare(b.hostId));
}

// "14:00" -> "2:00 p.m."; "08:30" -> "8:30 a.m."
export function formatClock(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  const period = h >= 12 ? 'p.m.' : 'a.m.';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12}:00 ${period}` : `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}
