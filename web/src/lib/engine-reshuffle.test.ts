import { describe, expect, it } from 'vitest';
import { assignWeek, type EngineSettings, type Host, type Party } from './engine';

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

// Both hosts have 1 hour this week. A has 12 kids, B has 3. The open 6-kid party is currently with A.
const base = [
  party('a1', { fixed: true, assignedHost: 'a', start: '10:00', end: '11:00', kids: 12 }),
  party('b1', { fixed: true, assignedHost: 'b', start: '10:00', end: '11:00', kids: 3 }),
];

describe('reshuffle: unlocked, unrevealed parties can move to even out kids', () => {
  it('moves an unlocked party from the host with more kids to the host with fewer', () => {
    const r = assignWeek([...base, party('open', { start: '15:00', end: '16:00', kids: 6, assignedHost: 'a' })],
      [host('a'), host('b')], [], settings);
    expect(r.assignments.find((a) => a.partyId === 'open')?.hostId).toBe('b');
  });

  it('keeps a locked party with its host even when kids would favor a move', () => {
    const r = assignWeek([...base, party('open', { start: '15:00', end: '16:00', kids: 6, assignedHost: 'a', fixed: true })],
      [host('a'), host('b')], [], settings);
    expect(r.assignments.find((a) => a.partyId === 'open')?.hostId).toBe('a');
  });
});
