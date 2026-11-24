import { describe, expect, it } from 'vitest';
import { allDayWindow } from './business-hours';

describe('allDayWindow', () => {
  it('opens at 10:00 a.m. Sunday to Thursday', () => {
    for (const day of [1, 2, 3, 4, 7]) expect(allDayWindow(day).start).toBe('10:00');
  });

  it('opens at 9:00 a.m. on Friday and Saturday', () => {
    expect(allDayWindow(5).start).toBe('09:00');
    expect(allDayWindow(6).start).toBe('09:00');
  });

  it('always ends at 11:59 p.m. on the same date', () => {
    for (const day of [1, 2, 3, 4, 5, 6, 7]) expect(allDayWindow(day).end).toBe('23:59');
  });
});
