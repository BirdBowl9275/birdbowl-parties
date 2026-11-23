import { describe, expect, it } from 'vitest';
import { assignWeek, ceilingFor, type EngineSettings, type Host, type HistoryParty, type Party } from './engine';

const DAY = '2026-11-28'; // a Saturday
const settings: EngineSettings = { windowDays: 30, hostessAllowancePct: 25, bowlingServerAfter: '18:00' };
const openDay = [{ date: DAY, start: '10:00', end: '22:00' }];

function host(id: string, tier: Host['tier'], overrides: Partial<Host> = {}): Host {
  return { id, name: id, tier, dailyCap: 3, availability: openDay, ...overrides };
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

function hostOf(result: ReturnType<typeof assignWeek>, partyId: string): string | undefined {
  return result.assignments.find((a) => a.partyId === partyId)?.hostId;
}

describe('hard rules', () => {
  it('sends bowling parties starting after 6 p.m. to servers only, even when hostesses are free', () => {
    const hosts = [host('hostess', 1), host('server', 3)];
    const r = assignWeek([party('p', { type: 'bowling', start: '18:30', end: '20:00' })], hosts, [], settings);
    expect(hostOf(r, 'p')).toBe('server');
  });

  it('leaves a bowling party after 6 p.m. unassigned when no server is eligible', () => {
    const r = assignWeek(
      [party('p', { type: 'bowling', start: '18:30', end: '20:00' })],
      [host('hostess', 1)],
      [],
      settings,
    );
    expect(r.unassigned).toEqual([{ partyId: 'p', reason: 'no_eligible_host' }]);
  });

  it('lets a hostess take a non-bowling party after 6 p.m.', () => {
    const r = assignWeek(
      [party('p', { type: 'other', start: '18:30', end: '20:00' })],
      [host('hostess', 1)],
      [],
      settings,
    );
    expect(hostOf(r, 'p')).toBe('hostess');
  });

  it('gives one host one party per time slot: no overlaps', () => {
    const r = assignWeek(
      [party('a', { start: '12:00', end: '14:00' }), party('b', { start: '13:00', end: '15:00', kids: 9 })],
      [host('solo', 1)],
      [],
      settings,
    );
    expect(r.assignments).toHaveLength(1);
    expect(r.unassigned.map((u) => u.partyId)).toEqual(['b']);
  });

  it('never gives a host more than three parties in one day', () => {
    const parties = ['a', 'b', 'c', 'd'].map((id, i) =>
      party(id, { start: `${10 + i * 2}:00`, end: `${11 + i * 2}:00` }),
    );
    const r = assignWeek(parties, [host('solo', 1, { dailyCap: 3 })], [], settings);
    expect(r.assignments).toHaveLength(3);
    expect(r.unassigned).toHaveLength(1);
  });

  it('respects a lower daily cap set by the admin', () => {
    const parties = [party('a', { start: '10:00', end: '11:00' }), party('b', { start: '12:00', end: '13:00' })];
    const r = assignWeek(parties, [host('solo', 1, { dailyCap: 1 })], [], settings);
    expect(r.assignments).toHaveLength(1);
    expect(r.unassigned).toHaveLength(1);
  });

  it('assigns only hosts whose availability covers the whole party', () => {
    const narrow = host('narrow', 1, { availability: [{ date: DAY, start: '10:00', end: '12:00' }] });
    const r = assignWeek([party('p', { start: '11:00', end: '13:00' })], [narrow], [], settings);
    expect(r.unassigned).toEqual([{ partyId: 'p', reason: 'no_eligible_host' }]);
  });

  it('assigns no one on a day they are not available', () => {
    const other = host('other', 1, { availability: [{ date: '2026-11-29', start: '10:00', end: '22:00' }] });
    const r = assignWeek([party('p')], [other], [], settings);
    expect(r.unassigned).toHaveLength(1);
  });

  it('always gives each party exactly one host or reports it as unassigned', () => {
    const parties = [party('a'), party('b', { start: '12:00', end: '13:00' }), party('c', { start: '16:00', end: '17:00' })];
    const r = assignWeek(parties, [host('x', 1), host('y', 2)], [], settings);
    expect(r.assignments.length + r.unassigned.length).toBe(parties.length);
  });
});

describe('tier order', () => {
  it('uses a hostess before front desk, and front desk before servers', () => {
    const r = assignWeek(
      [party('p')],
      [host('server', 3), host('front', 2), host('hostess', 1)],
      [],
      settings,
    );
    expect(hostOf(r, 'p')).toBe('hostess');
  });

  it('uses front desk only when every hostess is unavailable', () => {
    const noTime = host('hostess', 1, { availability: [] });
    const r = assignWeek([party('p')], [noTime, host('front', 2)], [], settings);
    expect(hostOf(r, 'p')).toBe('front');
  });
});

describe('party count spread', () => {
  it('gives three hostesses one party each when there are three parties', () => {
    const parties = [party('a'), party('b', { start: '14:00', end: '15:00' }), party('c', { start: '16:00', end: '17:00' })];
    const hosts = [host('h1', 1), host('h2', 1), host('h3', 1)];
    const r = assignWeek(parties, hosts, [], settings);
    const used = new Set(r.assignments.map((a) => a.hostId));
    expect(used.size).toBe(3);
  });
});

describe('party size and order', () => {
  it('assigns the biggest party first, so a single party is not left to the last host', () => {
    const parties = [party('small', { kids: 4 }), party('big', { kids: 20, start: '14:00', end: '15:00' })];
    const r = assignWeek(parties, [host('solo', 1, { dailyCap: 1 })], [], settings);
    expect(hostOf(r, 'big')).toBe('solo');
    expect(r.unassigned.map((u) => u.partyId)).toEqual(['small']);
  });

  it('caps hostess averages at 25% above the team average, and everyone else at the team average', () => {
    expect(ceilingFor(1, 16, 25)).toBe(20);
    expect(ceilingFor(2, 16, 25)).toBe(16);
    expect(ceilingFor(3, 16, 25)).toBe(16);
  });
});

describe('fairness history', () => {
  it('ignores history older than the window (45 days back with a 30-day window)', () => {
    const old: HistoryParty[] = [{ hostId: 'bea', date: '2026-10-14', start: '10:00', end: '11:00', kids: 20 }];
    const hosts = [host('bea', 1), host('ann', 1)];
    const r = assignWeek([party('p')], hosts, old, settings);
    // Nothing in the window for either host, so the alphabetical tie-break decides.
    expect(hostOf(r, 'p')).toBe('ann');
  });

  it('counts history inside the window: a small party goes to the host whose average runs high', () => {
    // Bea averages 20 kids over the window, Cal averages 10, Ann has no parties. Team average = 15.
    // A 10-kid party pulls Bea's average toward the team average, so she takes it.
    const recent: HistoryParty[] = [
      { hostId: 'bea', date: '2026-11-18', start: '10:00', end: '11:00', kids: 20 },
      { hostId: 'bea', date: '2026-11-19', start: '10:00', end: '11:00', kids: 20 },
      { hostId: 'bea', date: '2026-11-20', start: '10:00', end: '11:00', kids: 20 },
      { hostId: 'cal', date: '2026-11-18', start: '13:00', end: '14:00', kids: 10 },
      { hostId: 'cal', date: '2026-11-19', start: '13:00', end: '14:00', kids: 10 },
      { hostId: 'cal', date: '2026-11-20', start: '13:00', end: '14:00', kids: 10 },
    ];
    const hosts = [host('ann', 1), host('bea', 1), host('cal', 1)];
    const r = assignWeek([party('p', { kids: 10 })], hosts, recent, settings);
    expect(hostOf(r, 'p')).toBe('bea');
  });
});

describe('fairness counts parties per available day', () => {
  // Window for a party on DAY (2026-11-28) with 30 days back is 2026-10-29 to 2026-11-28.
  const twoParties = (host: string, dates: string[]): HistoryParty[] =>
    dates.map((date) => ({ hostId: host, date, start: '10:00', end: '11:00', kids: 10 }));

  it('a host who missed a weekend is not owed one: zoe (1 party in 2 available days) does not beat bea (2 in 4)', () => {
    // Both run 1 party per 2 available days; the name decides. The old count rule picked zoe (1 < 2).
    const history: HistoryParty[] = [
      ...twoParties('zoe', ['2026-11-20']),
      ...twoParties('bea', ['2026-11-18', '2026-11-19']),
    ];
    const offers = [
      { hostId: 'zoe', date: '2026-11-20' },
      { hostId: 'zoe', date: DAY },
      { hostId: 'bea', date: '2026-11-17' },
      { hostId: 'bea', date: '2026-11-18' },
      { hostId: 'bea', date: '2026-11-19' },
      { hostId: 'bea', date: DAY },
    ];
    const hosts = [host('zoe', 1), host('bea', 1)];
    const r = assignWeek([party('p')], hosts, history, settings, offers);
    expect(hostOf(r, 'p')).toBe('bea');
  });

  it('gives the party to the host with the lower share of their available days, even with more parties in total', () => {
    // ann: 1 party in 2 available days (0.5). bea: 2 parties in 8 available days (0.25).
    // The old count rule picked ann (1 < 2).
    const history: HistoryParty[] = [
      ...twoParties('ann', ['2026-11-20']),
      ...twoParties('bea', ['2026-11-18', '2026-11-19']),
    ];
    const offers = [
      { hostId: 'ann', date: '2026-11-20' },
      { hostId: 'ann', date: DAY },
      ...['2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-21', DAY].map(
        (date) => ({ hostId: 'bea', date }),
      ),
    ];
    const r = assignWeek([party('p')], [host('ann', 1), host('bea', 1)], history, settings, offers);
    expect(hostOf(r, 'p')).toBe('bea');
  });

  it('ignores available days outside the window', () => {
    // bea's old offers (before 2026-10-29) must not dilute her share.
    const history = twoParties('bea', ['2026-11-18', '2026-11-19']);
    const offers = [
      { hostId: 'bea', date: '2026-11-18' },
      { hostId: 'bea', date: '2026-11-19' },
      { hostId: 'bea', date: DAY },
      { hostId: 'bea', date: '2026-09-01' },
      { hostId: 'bea', date: '2026-09-02' },
      { hostId: 'bea', date: '2026-09-03' },
    ];
    const hosts = [host('bea', 1), host('cal', 1)];
    // bea: 2 parties / 3 in-window days = 0.67. cal: 0 parties (0 / 1). cal has the lower share.
    const r = assignWeek([party('p')], hosts, history, settings, offers);
    expect(hostOf(r, 'p')).toBe('cal');
  });
});

describe('locked and revealed parties', () => {
  it('keeps a fixed party with its host and counts it toward that host’s day', () => {
    const fixed = party('locked', { fixed: true, assignedHost: 'h1', start: '12:00', end: '13:00' });
    const open = party('open', { start: '12:30', end: '13:30' });
    const r = assignWeek([fixed, open], [host('h1', 1), host('h2', 1)], [], settings);
    expect(hostOf(r, 'locked')).toBe('h1');
    expect(hostOf(r, 'open')).toBe('h2');
  });

  it('reports a fixed party whose host is gone instead of moving it', () => {
    const fixed = party('locked', { fixed: true, assignedHost: 'removed' });
    const r = assignWeek([fixed], [host('h1', 1)], [], settings);
    expect(r.assignments).toEqual([]);
    expect(r.unassigned).toEqual([{ partyId: 'locked', reason: 'locked_host_missing' }]);
  });
});

describe('determinism', () => {
  it('gives the same answer every time for the same input', () => {
    const parties = [party('a', { kids: 12 }), party('b', { kids: 8, start: '14:00', end: '15:00' })];
    const hosts = [host('h1', 1), host('h2', 1), host('h3', 2)];
    const first = assignWeek(parties, hosts, [], settings);
    const second = assignWeek(parties, hosts, [], settings);
    expect(second).toEqual(first);
  });
});
