import { describe, expect, it } from 'vitest';
import {
  arrivalFor,
  checkEligibility,
  rankCandidates,
  weeklyHours,
  type Candidate,
  type PartyRequest,
} from './schedule-rules';

const D = '2026-11-30';

function host(id: string, name: string, shifts: Candidate['shifts'] = [], bookings: Candidate['bookings'] = []): Candidate {
  return { id, name, shifts, bookings };
}

function party(start: string, end: string, isFirstOfDay = true): PartyRequest {
  return { date: D, start, end, isFirstOfDay };
}

describe('arrivalFor', () => {
  it('arrives one hour early for the first party of the day', () => {
    expect(arrivalFor(party('14:00', '16:00', true))).toBe('13:00');
  });

  it('arrives at the start time for later parties the same day', () => {
    expect(arrivalFor(party('17:00', '19:00', false))).toBe('17:00');
  });
});

describe('weekly hours cap (35)', () => {
  it('allows a party that keeps the total at 35 or below', () => {
    const c = host('1', 'Ana', [{ tier: 1, date: D, start: '09:00', end: '17:00' }]); // 8 h
    // Party 14:00-19:00, first of day, arrives 13:00: 6 more hours, total 14.
    expect(checkEligibility(c, party('14:00', '19:00')).eligible).toBe(true);
  });

  it('blocks a party that would push the total over 35', () => {
    const shifts = [0, 1, 2, 3].map((i) => ({ tier: 1 as const, date: `2026-11-${24 + i}`, start: '09:00', end: '18:00' })); // 36 h
    const r = checkEligibility(host('1', 'Ana', shifts), party('14:00', '16:00'));
    expect(r.eligible).toBe(false);
    expect(r.reasons.join(' ')).toMatch(/limit 35/);
  });
});

describe('conflicts with front desk and server shifts', () => {
  it('blocks a party that overlaps a server shift', () => {
    const c = host('1', 'Ana', [{ tier: 3, date: D, start: '12:00', end: '15:00' }]);
    const r = checkEligibility(c, party('14:00', '16:00'));
    expect(r.eligible).toBe(false);
    expect(r.reasons.join(' ')).toMatch(/server shift/);
  });

  it('ignores a hostess shift and a different date', () => {
    const c = host('1', 'Ana', [
      { tier: 1, date: D, start: '12:00', end: '15:00' },
      { tier: 3, date: '2026-12-01', start: '12:00', end: '15:00' },
    ]);
    expect(checkEligibility(c, party('14:00', '16:00')).eligible).toBe(true);
  });
});

describe('30-minute gap after a previous party', () => {
  it('blocks a next party whose arrival is less than 30 minutes after the last party ends', () => {
    // Previous party ends 18:00. New party starts 18:30, not first of day, arrives 18:30: only 30 min, passes.
    // New party starts 18:15: arrives 18:15, 15 min after, fails.
    const c = host('1', 'Ana', [], [{ date: D, arrival: '14:00', end: '18:00' }]);
    expect(checkEligibility(c, party('18:15', '20:00', false)).eligible).toBe(false);
    expect(checkEligibility(c, party('18:30', '20:00', false)).eligible).toBe(true);
  });

  it('applies the gap when the new party comes before the existing one', () => {
    const c = host('1', 'Ana', [], [{ date: D, arrival: '18:00', end: '20:00' }]);
    // New party ends 17:40, which is only 20 min before 18:00.
    expect(checkEligibility(c, party('15:40', '17:40', false)).eligible).toBe(false);
    // New party ends 17:30, which is 30 min before 18:00.
    expect(checkEligibility(c, party('15:30', '17:30', false)).eligible).toBe(true);
  });
});

describe('priority order', () => {
  it('lists staff under 32 hours first, with the most room first', () => {
    const at = (name: string, hours: number) =>
      host(name, name, [{ tier: 1, date: D, start: '08:00', end: `${String(8 + hours).padStart(2, '0')}:00` }]);
    const ranked = rankCandidates([at('Bea', 30), at('Cal', 10), at('Dee', 33), at('Eli', 20), at('Fay', 34)]);
    expect(ranked.map((c) => c.name)).toEqual(['Cal', 'Eli', 'Bea', 'Dee', 'Fay']);
  });

  it('computes weekly hours from shift times', () => {
    expect(weeklyHours([{ tier: 1, date: D, start: '09:00', end: '13:30' }])).toBe(4.5);
  });
});
