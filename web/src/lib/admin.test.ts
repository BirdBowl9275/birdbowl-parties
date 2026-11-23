import { describe, expect, it } from 'vitest';
import { validateProfileChange, validateSetting } from './admin';

const base = { role: 'staff', status: 'active', tier: '1', dailyCap: '3', actorId: 'a', targetId: 'b' };

describe('validateProfileChange', () => {
  it('accepts a normal change and returns numbers', () => {
    const r = validateProfileChange(base);
    expect(r).toEqual({ ok: true, value: { role: 'staff', status: 'active', tier: 1, dailyCap: 3 } });
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

  it('rejects a daily cap above 3, the hard rule', () => {
    expect(validateProfileChange({ ...base, dailyCap: '4' }).ok).toBe(false);
    expect(validateProfileChange({ ...base, dailyCap: '-1' }).ok).toBe(false);
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
