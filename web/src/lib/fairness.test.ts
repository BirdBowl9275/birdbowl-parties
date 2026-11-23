import { describe, expect, it } from 'vitest';
import { fairnessSummary, formatClock } from './fairness';

describe('fairnessSummary', () => {
  it('counts parties, total kids and average per host inside the window', () => {
    const rows = fairnessSummary(
      [
        { hostId: 'a', date: '2026-11-20', kids: 10 },
        { hostId: 'a', date: '2026-11-21', kids: 20 },
        { hostId: 'b', date: '2026-11-22', kids: 6 },
      ],
      ['a', 'b'],
      '2026-11-22',
      30,
    );
    expect(rows).toEqual([
      { hostId: 'a', parties: 2, totalKids: 30, averageKids: 15 },
      { hostId: 'b', parties: 1, totalKids: 6, averageKids: 6 },
    ]);
  });

  it('ignores parties before the window and after the summary date', () => {
    const rows = fairnessSummary(
      [
        { hostId: 'a', date: '2026-10-01', kids: 50 }, // outside 30 days
        { hostId: 'a', date: '2026-11-30', kids: 50 }, // after asOf
        { hostId: 'a', date: '2026-11-10', kids: 8 },
      ],
      ['a'],
      '2026-11-22',
      30,
    );
    expect(rows[0]).toEqual({ hostId: 'a', parties: 1, totalKids: 8, averageKids: 8 });
  });

  it('reports no average for a host with no parties in the window', () => {
    const rows = fairnessSummary([], ['a'], '2026-11-22', 30);
    expect(rows[0].averageKids).toBeNull();
    expect(rows[0].parties).toBe(0);
  });

  it('includes hosts with no parties at all, sorted by id', () => {
    const rows = fairnessSummary([], ['c', 'a', 'b'], '2026-11-22', 30);
    expect(rows.map((r) => r.hostId)).toEqual(['a', 'b', 'c']);
  });
});

describe('formatClock', () => {
  it('formats times for staff in words', () => {
    expect(formatClock('14:00')).toBe('2:00 p.m.');
    expect(formatClock('08:00')).toBe('8:00 a.m.');
    expect(formatClock('12:00')).toBe('12:00 p.m.');
    expect(formatClock('00:00')).toBe('12:00 a.m.');
    expect(formatClock('16:30')).toBe('4:30 p.m.');
  });
});
