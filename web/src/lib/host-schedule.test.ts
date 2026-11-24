import { describe, expect, it } from 'vitest';
import { dayOfWeek, overlapsShift, windowCovers } from './host-schedule';

const party = { start: '16:00', end: '18:00' };

describe('overlapsShift', () => {
  it('flags a shift that overlaps the party', () => {
    expect(overlapsShift(party, { start: '15:00', end: '17:00' })).toBe(true);
    expect(overlapsShift(party, { start: '17:00', end: '21:00' })).toBe(true);
  });

  it('does not flag a shift that ends exactly when the party starts, or starts when it ends', () => {
    expect(overlapsShift(party, { start: '10:00', end: '16:00' })).toBe(false);
    expect(overlapsShift(party, { start: '18:00', end: '22:00' })).toBe(false);
  });

  it('flags an overnight shift that runs into the party', () => {
    expect(overlapsShift(party, { start: '14:00', end: '02:00', endNextDay: true })).toBe(true);
  });
});

describe('windowCovers', () => {
  it('is true when one window contains the whole party', () => {
    expect(windowCovers([{ start: '15:00', end: '19:00' }], party)).toBe(true);
  });

  it('is false when no window contains the whole party', () => {
    expect(windowCovers([{ start: '15:00', end: '17:00' }], party)).toBe(false);
    expect(windowCovers([], party)).toBe(false);
  });
});

describe('dayOfWeek', () => {
  it('numbers Monday as 1 and Sunday as 7', () => {
    expect(dayOfWeek('2026-11-23')).toBe(1); // Monday
    expect(dayOfWeek('2026-11-27')).toBe(5); // Friday
    expect(dayOfWeek('2026-11-29')).toBe(7); // Sunday
  });
});
