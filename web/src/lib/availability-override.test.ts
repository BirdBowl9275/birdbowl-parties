import { describe, expect, it } from 'vitest';
import { isOverrideTarget, isUuid } from './availability-override';

describe('isOverrideTarget', () => {
  it('allows an active tier-1 hostess', () => {
    expect(isOverrideTarget({ status: 'active', tier: 1 })).toBe(true);
  });

  it('refuses other tiers, removed or pending people, and people who are not hosts', () => {
    expect(isOverrideTarget({ status: 'active', tier: 2 })).toBe(false);
    expect(isOverrideTarget({ status: 'active', tier: 3 })).toBe(false);
    expect(isOverrideTarget({ status: 'active', tier: null })).toBe(false);
    expect(isOverrideTarget({ status: 'removed', tier: 1 })).toBe(false);
    expect(isOverrideTarget({ status: 'pending', tier: 1 })).toBe(false);
    expect(isOverrideTarget(null)).toBe(false);
  });
});

describe('isUuid', () => {
  it('accepts a UUID and rejects anything else', () => {
    expect(isUuid('6f1c2a3e-9b7d-4c10-8a55-1e2f3a4b5c6d')).toBe(true);
    expect(isUuid('not-an-id')).toBe(false);
    expect(isUuid('')).toBe(false);
  });
});
