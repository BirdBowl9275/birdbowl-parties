import { describe, expect, it } from 'vitest';
import { assignWeek, type EngineSettings, type Host, type Party } from './engine';

const DAY = '2026-11-28';
const settings: EngineSettings = { windowDays: 30, hostessAllowancePct: 25, bowlingServerAfter: '18:00' };
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

describe('kept hosts: a run only fills parties that have no host', () => {
  it('keeps an unlocked party with an eligible current host', () => {
    const r = assignWeek(
      [party('p', { assignedHost: 'a', keepHost: true })],
      [host('a'), host('b')],
      [],
      settings,
    );
    expect(r.assignments).toEqual([{ partyId: 'p', hostId: 'a' }]);
  });

  it('re-picks a party whose current host is no longer eligible', () => {
    const r = assignWeek(
      [party('p', { assignedHost: 'gone', keepHost: true })],
      [host('b')],
      [],
      settings,
    );
    expect(r.assignments).toEqual([{ partyId: 'p', hostId: 'b' }]);
  });

  it('still fills an uncovered party when a kept host is on another party', () => {
    const r = assignWeek(
      [
        party('kept', { assignedHost: 'a', keepHost: true }),
        party('open', { start: '15:00', end: '16:00' }),
      ],
      [host('a'), host('b')],
      [],
      settings,
    );
    expect(r.assignments.find((a) => a.partyId === 'kept')?.hostId).toBe('a');
    expect(r.assignments.find((a) => a.partyId === 'open')?.hostId).toBeDefined();
  });
});
