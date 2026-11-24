import { describe, expect, it } from 'vitest';
import { availabilityFits, pickReplacement, type ReplacementCandidate } from './release-rules';

const D = '2026-11-30';
const open = [{ date: D, start: '12:00', end: '23:00' }];

function cand(id: string, name: string, over: Partial<ReplacementCandidate> = {}): ReplacementCandidate {
  return { id, name, dailyCap: 3, shifts: [], booked: [], availability: open, ...over };
}

const party = { id: 99, date: D, start: '18:00', end: '20:00' };

describe('availabilityFits', () => {
  it('needs one window covering arrival through end', () => {
    expect(availabilityFits(open, D, '17:00', '20:00')).toBe(true);
    expect(availabilityFits(open, D, '11:00', '20:00')).toBe(false);
    expect(availabilityFits([{ date: D, start: '17:30', end: '19:00' }], D, '17:00', '20:00')).toBe(false);
  });
});

describe('pickReplacement', () => {
  it('never picks the hostess who released the party', () => {
    expect(pickReplacement(party, 'me', [cand('me', 'Me')])).toBeNull();
  });

  it('skips a hostess who is not available for the whole window', () => {
    const r = pickReplacement(party, 'me', [cand('a', 'Ana', { availability: [{ date: D, start: '18:30', end: '21:00' }] })]);
    expect(r).toBeNull();
  });

  it('skips a hostess at her daily cap', () => {
    const booked = [
      { partyId: 1, date: D, start: '10:00', end: '11:00' },
      { partyId: 2, date: D, start: '12:00', end: '13:00' },
    ];
    expect(pickReplacement(party, 'me', [cand('a', 'Ana', { dailyCap: 2, booked })])).toBeNull();
  });

  it('skips a hostess who would conflict with a server shift', () => {
    const shifts = [{ tier: 3 as const, date: D, start: '17:00', end: '21:00' }];
    expect(pickReplacement(party, 'me', [cand('a', 'Ana', { shifts })])).toBeNull();
  });

  it('picks by priority: under 32 hours first, most room first', () => {
    const tenHours = [{ tier: 1 as const, date: '2026-11-23', start: '08:00', end: '18:00' }];
    const twentyHours = [{ tier: 1 as const, date: '2026-11-23', start: '08:00', end: '18:00' }, { tier: 1 as const, date: '2026-11-24', start: '08:00', end: '18:00' }];
    const r = pickReplacement(party, 'me', [
      cand('a', 'Ana', { shifts: twentyHours }),
      cand('b', 'Bo', { shifts: tenHours }),
    ]);
    expect(r).toEqual({ hostId: 'b', name: 'Bo' });
  });

  it('counts an overnight shift in full when picking by hours', () => {
    // Ana: one 10 h day shift, so 22 h of room under 32. Bo: one 9 h overnight shift (5 PM to 2 AM),
    // so 23 h of room. Bo has more room, so Bo goes first. If the overnight shift were cut at
    // midnight it would count as 7 h and the order would be different.
    const overnight = [{ tier: 1 as const, date: '2026-11-23', start: '17:00', end: '02:00', endNextDay: true }];
    const day = [{ tier: 1 as const, date: '2026-11-23', start: '08:00', end: '18:00' }];
    const r = pickReplacement(party, 'me', [cand('a', 'Ana', { shifts: day }), cand('b', 'Bo', { shifts: overnight })]);
    expect(r).toEqual({ hostId: 'b', name: 'Bo' });
  });

  it('returns null when nobody is eligible', () => {
    expect(pickReplacement(party, 'me', [])).toBeNull();
  });
});
