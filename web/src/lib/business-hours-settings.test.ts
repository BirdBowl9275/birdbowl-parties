import { describe, expect, it } from 'vitest';
import { allDayWindow, DEFAULT_HOURS, hoursFromSettings } from './business-hours';
import { daysFromForm } from './availability';

describe('hoursFromSettings', () => {
  it('reads the stored JSON strings, with quotes removed', () => {
    const values = new Map<string, unknown>([
      ['business_open_weekday', '"11:00"'],
      ['business_open_weekend', '"08:30"'],
    ]);
    expect(hoursFromSettings(values)).toEqual({ weekdayOpen: '11:00', weekendOpen: '08:30' });
  });

  it('falls back to the defaults when a setting is missing', () => {
    expect(hoursFromSettings(new Map())).toEqual(DEFAULT_HOURS);
  });

  it('falls back to the default when a setting is not HH:MM', () => {
    const values = new Map<string, unknown>([['business_open_weekday', '"nine"']]);
    expect(hoursFromSettings(values).weekdayOpen).toBe('10:00');
  });
});

describe('All day uses the stored hours', () => {
  const hours = { weekdayOpen: '11:00', weekendOpen: '08:30' };

  it('uses the stored weekend opening for Friday and Saturday', () => {
    expect(allDayWindow(5, hours).start).toBe('08:30');
    expect(allDayWindow(6, hours).start).toBe('08:30');
  });

  it('uses the stored weekday opening for Sunday to Thursday', () => {
    expect(allDayWindow(1, hours).start).toBe('11:00');
    expect(allDayWindow(7, hours).start).toBe('11:00');
  });

  it('passes the stored hours through the form parser', () => {
    const days = daysFromForm((name) => (name === 'allday-6' ? 'on' : ''), hours);
    expect(days.find((d) => d.day === 6)).toEqual({ day: 6, on: true, start: '08:30', end: '23:59' });
  });
});
