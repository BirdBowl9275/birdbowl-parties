import { describe, expect, it } from 'vitest';
import { changedPartyIds, type SavedParty } from './assignment-changes';

const current: SavedParty[] = [
  { id: 1, assigned_host: 'ana', assignment_locked: false },
  { id: 2, assigned_host: 'ben', assignment_locked: true },
  { id: 3, assigned_host: null, assignment_locked: false },
];

describe('changedPartyIds', () => {
  it('returns nothing when every row matches the database', () => {
    const posted = new Map([
      [1, { host: 'ana', locked: false }],
      [2, { host: 'ben', locked: true }],
      [3, { host: null, locked: false }],
    ]);
    expect(changedPartyIds(current, posted)).toEqual([]);
  });

  it('returns a row whose host changed', () => {
    const posted = new Map([[1, { host: 'cal', locked: false }]]);
    expect(changedPartyIds(current, posted)).toEqual([1]);
  });

  it('returns a row whose lock changed', () => {
    const posted = new Map([[2, { host: 'ben', locked: false }]]);
    expect(changedPartyIds(current, posted)).toEqual([2]);
  });

  it('ignores a party that is not on the form', () => {
    const posted = new Map([[1, { host: null, locked: false }]]);
    expect(changedPartyIds(current, posted)).toEqual([1]);
  });
});
