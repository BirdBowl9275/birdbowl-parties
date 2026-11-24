import { describe, expect, it } from 'vitest';
import { BULK_MAX, validateBulkProfileChanges, validateProfileChange, validateSetting } from './admin';

const base = { role: 'staff', status: 'active', tier: '1', actorId: 'a', targetId: 'b' };

describe('validateProfileChange', () => {
  it('accepts a normal change and returns numbers', () => {
    const r = validateProfileChange(base);
    expect(r).toEqual({ ok: true, value: { role: 'staff', status: 'active', tier: 1 } });
  });

  it('accepts the read-only viewer role', () => {
    const r = validateProfileChange({ ...base, role: 'viewer', tier: '' });
    expect(r.ok).toBe(true);
  });

  it('does not let a viewer have a host tier', () => {
    expect(validateProfileChange({ ...base, role: 'viewer', tier: '1' }).ok).toBe(false);
  });

  it('treats an empty tier as not a host', () => {
    const r = validateProfileChange({ ...base, tier: '' });
    expect(r.ok && r.value.tier).toBeNull();
  });

  it('rejects tiers outside 1 to 3', () => {
    expect(validateProfileChange({ ...base, tier: '4' }).ok).toBe(false);
    expect(validateProfileChange({ ...base, tier: '0' }).ok).toBe(false);
    expect(validateProfileChange({ ...base, tier: '1.5' }).ok).toBe(false);
  });

  it('rejects unknown roles and statuses', () => {
    expect(validateProfileChange({ ...base, role: 'owner' }).ok).toBe(false);
    expect(validateProfileChange({ ...base, status: 'deleted' }).ok).toBe(false);
  });

  it('stops an admin from removing or demoting themselves', () => {
    const self = { ...base, actorId: 'x', targetId: 'x', role: 'admin' };
    expect(validateProfileChange({ ...self, status: 'removed' }).ok).toBe(false);
    expect(validateProfileChange({ ...self, role: 'manager' }).ok).toBe(false);
    expect(validateProfileChange(self).ok).toBe(true);
  });
});

describe('validateBulkProfileChanges', () => {
  const A = '11111111-1111-4111-8111-111111111111';
  const B = '22222222-2222-4222-8222-222222222222';
  const row = { id: A, role: 'manager', status: 'active', tier: '' };

  it('accepts several valid rows', () => {
    const r = validateBulkProfileChanges([row, { ...row, id: B, role: 'viewer' }], 'admin');
    expect(r.ok && r.value.map((v) => v.role)).toEqual(['manager', 'viewer']);
  });

  it('rejects an empty list and too many rows', () => {
    expect(validateBulkProfileChanges([], 'admin').ok).toBe(false);
    const many = Array.from({ length: BULK_MAX + 1 }, (_, i) => ({
      ...row,
      id: `${String(i).padStart(8, '0')}-1111-4111-8111-111111111111`,
    }));
    expect(validateBulkProfileChanges(many, 'admin').ok).toBe(false);
  });

  it('rejects duplicate or malformed ids', () => {
    expect(validateBulkProfileChanges([row, row], 'admin').ok).toBe(false);
    expect(validateBulkProfileChanges([{ ...row, id: 'nope' }], 'admin').ok).toBe(false);
  });

  it('never removes anyone in bulk', () => {
    expect(validateBulkProfileChanges([{ ...row, status: 'removed' }], 'admin').ok).toBe(false);
  });

  it('saves nothing if one row is invalid', () => {
    const r = validateBulkProfileChanges([row, { ...row, id: B, role: 'viewer', tier: '1' }], 'admin');
    expect(r.ok).toBe(false);
  });

  it('still stops an admin demoting themselves', () => {
    expect(validateBulkProfileChanges([{ ...row, role: 'manager' }], A).ok).toBe(false);
  });

  it('is not fooled by an uppercase copy of the same id', () => {
    const C = 'abcdef12-1111-4111-8111-111111111111';
    expect(validateBulkProfileChanges([{ ...row, id: C.toUpperCase(), role: 'manager' }], C).ok).toBe(false);
    expect(validateBulkProfileChanges([{ ...row, id: C }, { ...row, id: C.toUpperCase() }], 'admin').ok).toBe(false);
    expect(validateProfileChange({ ...base, actorId: C, targetId: C.toUpperCase(), role: 'staff' }).ok).toBe(false);
  });
});

describe('validateSetting', () => {
  it('accepts a valid fairness window', () => {
    expect(validateSetting('fairness_window_days', ' 30 ')).toEqual({ ok: true, value: 30 });
  });

  it('rejects a window of 0 or a fraction', () => {
    expect(validateSetting('fairness_window_days', '0').ok).toBe(false);
    expect(validateSetting('fairness_window_days', '2.5').ok).toBe(false);
  });

  it('keeps the hostess allowance between 0 and 100 percent', () => {
    expect(validateSetting('hostess_avg_allowance_pct', '25')).toEqual({ ok: true, value: 25 });
    expect(validateSetting('hostess_avg_allowance_pct', '101').ok).toBe(false);
  });

  it('accepts cutoff day 1 to 7 only', () => {
    expect(validateSetting('availability_cutoff_dow', '3').ok).toBe(true);
    expect(validateSetting('availability_cutoff_dow', '8').ok).toBe(false);
  });

  it('checks clock times', () => {
    expect(validateSetting('reveal_time', '08:00').ok).toBe(true);
    expect(validateSetting('reveal_time', '8am').ok).toBe(false);
    expect(validateSetting('availability_cutoff_time', '24:00').ok).toBe(false);
  });

  it('rejects settings the app does not know about', () => {
    expect(validateSetting('business_tz', 'UTC').ok).toBe(false);
  });
});
