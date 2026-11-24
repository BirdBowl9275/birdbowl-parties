// Pure checks for a manual host assignment: does the hostess's uploaded schedule or her
// availability clash with the party? Used by the manager's assign action, and unit tested.

export type Span = { start: string; end: string; endNextDay?: boolean };

// Minutes from midnight. An end on the next day (an overnight shift) counts as past midnight.
function minutes(t: string, nextDay = false): number {
  const [h, m] = t.slice(0, 5).split(':').map(Number);
  return h * 60 + m + (nextDay ? 24 * 60 : 0);
}

// True when a shift overlaps the party. Touching at one point (a shift ending as the party starts)
// is not an overlap.
export function overlapsShift(party: Span, shift: Span): boolean {
  const ps = minutes(party.start);
  const pe = minutes(party.end, party.endNextDay);
  const ss = minutes(shift.start);
  const se = minutes(shift.end, shift.endNextDay);
  return ss < pe && se > ps;
}

// True when one availability window covers the whole party.
export function windowCovers(windows: { start: string; end: string }[], party: Span): boolean {
  const ps = minutes(party.start);
  const pe = minutes(party.end);
  return windows.some((w) => minutes(w.start) <= ps && minutes(w.end) >= pe);
}

// 1 = Monday … 7 = Sunday, the same numbering as availability.day_of_week.
export function dayOfWeek(date: string): number {
  return ((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
}
