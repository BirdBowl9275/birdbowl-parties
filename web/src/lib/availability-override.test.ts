import { describe, expect, it } from 'vitest';
import { isOverrideTarget, isUuid } from './availability-override';

describe('isOverrideTarget', () => {
  it('allows an active staff member in any tier (1, 2 or 3)', () => {
    expect(isOverrideTarget({ status: 'active', role: 'staff', tier: 1 })).toBe(true);
    expect(isOverrideTarget({ status: 'active', role: 'staff', tier: 2 })).toBe(true);
    expect(isOverrideTarget({ status: 'active', role: 'staff', tier: 3 })).toBe(true);
  });

  it('refuses managers, admins, viewers, people without a tier, and removed or pending people', () => {
    expect(isOverrideTarget({ status: 'active', role: 'manager', tier: null })).toBe(false);
    expect(isOverrideTarget({ status: 'active', role: 'admin', tier: null })).toBe(false);
    expect(isOverrideTarget({ status: 'active', role: 'viewer', tier: 1 })).toBe(false);
    expect(isOverrideTarget({ status: 'active', role: 'staff', tier: null })).toBe(false);
    expect(isOverrideTarget({ status: 'removed', role: 'staff', tier: 1 })).toBe(false);
    expect(isOverrideTarget({ status: 'pending', role: 'staff', tier: 1 })).toBe(false);
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
