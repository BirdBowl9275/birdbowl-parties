import { describe, expect, it } from 'vitest';
import { daysFromForm, parseAvailability } from './availability';

function form(values: Record<string, string>) {
  return (name: string) => values[name] ?? '';
}

describe('All day tick', () => {
  it('fills in the business hours for a day ticked All day, and ignores the typed times', () => {
    const days = daysFromForm(form({ 'allday-5': 'on', 'start-5': '17:00', 'end-5': '18:00' }));
    const friday = days.find((d) => d.day === 5);
    expect(friday).toEqual({ day: 5, on: true, start: '09:00', end: '23:59' });
    const parsed = parseAvailability(days);
    expect(parsed.ok && parsed.windows.find((w) => w.day === 5)).toEqual({ day: 5, start: '09:00', end: '23:59' });
  });

  it('uses the weekday opening for Sunday', () => {
    const sunday = daysFromForm(form({ 'allday-7': 'on' })).find((d) => d.day === 7);
    expect(sunday).toEqual({ day: 7, on: true, start: '10:00', end: '23:59' });
  });

  it('leaves a day alone when All day is not ticked', () => {
    const monday = daysFromForm(form({ 'on-1': 'on', 'start-1': '17:00', 'end-1': '21:00' })).find((d) => d.day === 1);
    expect(monday).toEqual({ day: 1, on: true, start: '17:00', end: '21:00' });
  });
});
