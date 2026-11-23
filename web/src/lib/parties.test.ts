import { describe, expect, it } from 'vitest';
import { validateParty, validWeekStart, weekDays, weekStart, type PartyInput } from './parties';

describe('validWeekStart', () => {
  it('returns the Monday of a valid date', () => {
    expect(validWeekStart('2026-11-28', '2026-11-22')).toBe('2026-11-23');
  });

  it('uses the fallback for an impossible date instead of throwing', () => {
    expect(validWeekStart('2026-99-99', '2026-11-22')).toBe('2026-11-16');
  });

  it('uses the fallback for missing or malformed input', () => {
    expect(validWeekStart(undefined, '2026-11-22')).toBe('2026-11-16');
    expect(validWeekStart('', '2026-11-22')).toBe('2026-11-16');
    expect(validWeekStart('not-a-date', '2026-11-22')).toBe('2026-11-16');
  });
});

const good: PartyInput = {
  date: '2026-11-28',
  startTime: '14:00',
  endTime: '16:00',
  kids: '12',
  partyType: 'bowling',
  customerName: '  Smith family ',
  notes: ' birthday cake at 3 ',
};

describe('validateParty', () => {
  it('accepts a complete party and trims text', () => {
    const r = validateParty(good);
    expect(r).toEqual({
      ok: true,
      value: {
        partyDate: '2026-11-28',
        startTime: '14:00',
        endTime: '16:00',
        kidsCount: 12,
        partyType: 'bowling',
        customerName: 'Smith family',
        notes: 'birthday cake at 3',
      },
    });
  });

  it('rejects impossible dates', () => {
    expect(validateParty({ ...good, date: '2026-02-30' }).ok).toBe(false);
    expect(validateParty({ ...good, date: '11/28/2026' }).ok).toBe(false);
  });

  it('requires the end time to be after the start time', () => {
    expect(validateParty({ ...good, endTime: '14:00' }).ok).toBe(false);
    expect(validateParty({ ...good, endTime: '13:00' }).ok).toBe(false);
  });

  it('rejects malformed clock times', () => {
    expect(validateParty({ ...good, startTime: '2pm' }).ok).toBe(false);
    expect(validateParty({ ...good, endTime: '25:00' }).ok).toBe(false);
  });

  it('checks the kid count is a whole number in range', () => {
    expect(validateParty({ ...good, kids: '0' }).ok).toBe(true);
    expect(validateParty({ ...good, kids: '-1' }).ok).toBe(false);
    expect(validateParty({ ...good, kids: '2.5' }).ok).toBe(false);
    expect(validateParty({ ...good, kids: '201' }).ok).toBe(false);
  });

  it('accepts only bowling or other as party type', () => {
    expect(validateParty({ ...good, partyType: 'other' }).ok).toBe(true);
    expect(validateParty({ ...good, partyType: 'laser tag' }).ok).toBe(false);
  });

  it('requires a customer name and caps notes', () => {
    expect(validateParty({ ...good, customerName: '   ' }).ok).toBe(false);
    expect(validateParty({ ...good, notes: 'x'.repeat(501) }).ok).toBe(false);
  });
});

describe('week helpers', () => {
  it('finds the Monday of the week for any day in it', () => {
    expect(weekStart('2026-11-22')).toBe('2026-11-16'); // Sunday belongs to the week starting the Monday before
    expect(weekStart('2026-11-23')).toBe('2026-11-23'); // Monday
    expect(weekStart('2026-11-29')).toBe('2026-11-23'); // Sunday
  });

  it('lists seven days from Monday to Sunday', () => {
    expect(weekDays('2026-11-23')).toEqual([
      '2026-11-23',
      '2026-11-24',
      '2026-11-25',
      '2026-11-26',
      '2026-11-27',
      '2026-11-28',
      '2026-11-29',
    ]);
  });
});
