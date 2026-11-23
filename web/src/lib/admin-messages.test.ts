import { describe, expect, it } from 'vitest';
import { ADMIN_MESSAGES, adminBanner, one, parseIdList } from './admin-messages';
import { BULK_MAX } from './admin';

describe('adminBanner', () => {
  it('shows a known code', () => {
    expect(adminBanner({ msg: 'saved' })).toEqual({ tone: 'success', text: 'Saved.' });
  });

  it('ignores free text and unknown codes in the address', () => {
    expect(adminBanner({ msg: 'Your session expired, sign in at evil.example' })).toBeNull();
    expect(adminBanner({ msg: 'toString' })).toBeNull();
    expect(adminBanner({ msg: '__proto__' })).toBeNull();
    expect(adminBanner({})).toBeNull();
  });

  it('counts saved users from whole numbers only', () => {
    expect(adminBanner({ msg: 'saved_many', n: '8' })?.text).toBe('Saved 8 users.');
    expect(adminBanner({ msg: 'saved_many', n: '1' })?.text).toBe('Saved 1 user.');
    expect(adminBanner({ msg: 'saved_many', n: 'lots' })).toBeNull();
  });

  it('reports a partial save as an error', () => {
    const b = adminBanner({ msg: 'partial', n: '5', of: '8' });
    expect(b?.tone).toBe('error');
    expect(b?.text).toMatch(/^Saved 5 of 8 users\./);
    expect(adminBanner({ msg: 'partial', n: '5', of: '<b>' })).toBeNull();
  });

  it('says nothing was saved when Save all stops early', () => {
    expect(adminBanner({ msg: 'viewer_tier', none: '1' })?.text).toMatch(/^Nothing was saved\. A viewer/);
    expect(adminBanner({ msg: 'saved', none: '1' })?.text).toBe('Saved.');
  });
});

describe('address parsing', () => {
  const A = '11111111-1111-4111-8111-111111111111';

  it('refuses a partial count larger than the total', () => {
    expect(adminBanner({ msg: 'partial', n: '999', of: '1' })).toBeNull();
  });

  it('uses only single values, never repeated keys', () => {
    expect(one('saved')).toBe('saved');
    expect(one(['saved', 'x'])).toBeUndefined();
    expect(parseIdList([A, A], 100).size).toBe(0);
  });

  it('keeps only real ids, lowercased and capped', () => {
    expect([...parseIdList(`${A.toUpperCase()},<b>x</b>,,nope`, 100)]).toEqual([A]);
    expect(parseIdList('', 100).size).toBe(0);
    expect(parseIdList(undefined, 100).size).toBe(0);
    const many = Array.from({ length: 150 }, (_, i) => `${String(i).padStart(8, '0')}-1111-4111-8111-111111111111`);
    expect(parseIdList(many.join(','), BULK_MAX).size).toBe(BULK_MAX);
  });

  it('states the same Save all limit as the code', () => {
    expect(ADMIN_MESSAGES.too_many.text).toMatch(new RegExp(`\\b${BULK_MAX}\\b`));
  });
});
