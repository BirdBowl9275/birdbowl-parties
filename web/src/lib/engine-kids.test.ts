import { describe, expect, it } from 'vitest';
import { assignWeek, type EngineSettings, type Host, type Offer, type Party } from './engine';

const DAY = '2026-11-28';
const settings: EngineSettings = { windowDays: 30, hostessAllowancePct: 20, bowlingServerAfter: '18:00' };
const openDay = [{ date: DAY, start: '10:00', end: '22:00' }];

function host(id: string): Host {
  return { id, name: id, tier: 1, weeklyHours: 0, availability: openDay };
}

function party(id: string, overrides: Partial<Party> = {}): Party {
  return {
    id,
    date: DAY,
    start: '12:00',
    end: '13:00',
    kids: 10,
    type: 'other',
    fixed: false,
    assignedHost: null,
    ...overrides,
  };
}

describe('fairness is kids, not party count', () => {
  it('gives the next party to the host with fewer kids this week, even if she has more parties', () => {
    // Both hosts have 2 hours this week. A has two parties (10 kids in total). B has one (12 kids).
    // Party count would favor B. Kids favor A.
    const parties = [
      party('a1', { fixed: true, assignedHost: 'a', start: '10:00', end: '11:00', kids: 5 }),
      party('a2', { fixed: true, assignedHost: 'a', start: '12:00', end: '13:00', kids: 5 }),
      party('b1', { fixed: true, assignedHost: 'b', start: '10:00', end: '12:00', kids: 12 }),
      party('new', { start: '15:00', end: '16:00', kids: 6 }),
    ];
    const r = assignWeek(parties, [host('a'), host('b')], [], settings);
    expect(r.assignments.find((a) => a.partyId === 'new')?.hostId).toBe('a');
  });

  it('breaks a tie by who was available on more days, not by name', () => {
    // Same hours, kids and parties. "a" sorts first by name, but "b" was available on more days.
    const parties = [party('new', { start: '15:00', end: '16:00', kids: 6 })];
    const offers: Offer[] = [
      { hostId: 'a', date: '2026-11-22' },
      { hostId: 'a', date: '2026-11-23' },
      { hostId: 'b', date: '2026-11-20' },
      { hostId: 'b', date: '2026-11-21' },
      { hostId: 'b', date: '2026-11-22' },
      { hostId: 'b', date: '2026-11-23' },
    ];
    const r = assignWeek(parties, [host('a'), host('b')], [], settings, offers);
    expect(r.assignments.find((a) => a.partyId === 'new')?.hostId).toBe('b');
  });
});
