import { describe, expect, it } from 'vitest';
import { daysFromForm, parseAvailability, type DayInput } from './availability';

const off = (day: number): DayInput => ({ day, on: false, start: '', end: '' });

describe('parseAvailability', () => {
  it('keeps only the days that are switched on', () => {
    const days = [off(1), { day: 2, on: true, start: '17:00', end: '21:00' }, off(3), off(4), off(5), off(6), off(7)];
    expect(parseAvailability(days)).toEqual({ ok: true, windows: [{ day: 2, start: '17:00', end: '21:00' }] });
  });

  it('accepts no days switched on (not available all week)', () => {
    expect(parseAvailability([1, 2, 3, 4, 5, 6, 7].map(off))).toEqual({ ok: true, windows: [] });
  });

  it('rejects an end time that is not after the start', () => {
    const r = parseAvailability([{ day: 3, on: true, start: '18:00', end: '18:00' }]);
    expect(r).toEqual({ ok: false, error: 'Wednesday: the end time must be after the start time.' });
  });

  it('rejects a time that is not HH:MM', () => {
    const r = parseAvailability([{ day: 6, on: true, start: '6pm', end: '22:00' }]);
    expect(r.ok).toBe(false);
  });

  it('rejects an hour out of range', () => {
    const r = parseAvailability([{ day: 1, on: true, start: '24:00', end: '23:00' }]);
    expect(r.ok).toBe(false);
  });
});

describe('daysFromForm', () => {
  it('reads the on, start and end fields for each day', () => {
    const fields: Record<string, string> = { 'on-5': 'on', 'start-5': '16:00', 'end-5': '20:00' };
    const days = daysFromForm((name) => fields[name] ?? '');
    expect(days[4]).toEqual({ day: 5, on: true, start: '16:00', end: '20:00' });
    expect(days[0]).toEqual({ day: 1, on: false, start: '', end: '' });
  });
});
