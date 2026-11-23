import { describe, expect, it } from 'vitest';
import { validateParty, type PartyInput } from './parties';
import { SALES_MESSAGES, salesBanner, salesCodeFor, scheduleBanner } from './page-messages';

const good: PartyInput = {
  date: '2026-11-28',
  startTime: '14:00',
  endTime: '16:00',
  kids: '10',
  partyType: 'bowling',
  customerName: 'Rivera',
  notes: '',
};

describe('Sales banners', () => {
  it('shows only known codes', () => {
    expect(salesBanner('party_saved')).toEqual({ tone: 'success', text: 'Party saved.' });
    expect(salesBanner('Call 555-0100 to confirm your booking')).toBeNull();
    expect(salesBanner('__proto__')).toBeNull();
    expect(salesBanner('toString')).toBeNull();
    expect(salesBanner(undefined)).toBeNull();
  });

  it('has a code for every party form error, so none falls back to the generic one', () => {
    const bad: Partial<PartyInput>[] = [
      { date: 'nope' },
      { startTime: '2pm' },
      { endTime: '13:00' },
      { kids: '-1' },
      { partyType: 'karaoke' },
      { customerName: '' },
      { notes: 'x'.repeat(501) },
    ];
    for (const change of bad) {
      const r = validateParty({ ...good, ...change });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        const code = salesCodeFor(r.error);
        expect(SALES_MESSAGES[code].text).toBe(r.error);
      }
    }
  });

  it('turns unknown text into a generic error code', () => {
    expect(salesCodeFor('something new')).toBe('save_change_failed');
  });
});

describe('Schedule banners', () => {
  it('shows only known codes', () => {
    expect(scheduleBanner('assignment_saved', undefined)?.tone).toBe('success');
    expect(scheduleBanner('confirm_preview', undefined)?.tone).toBe('error');
    expect(scheduleBanner('<b>hi</b>', undefined)).toBeNull();
    expect(scheduleBanner('constructor', undefined)).toBeNull();
  });

  it('counts assignments from whole numbers only', () => {
    expect(scheduleBanner('assignments_saved', '3')?.text).toBe('Saved 3 assignments.');
    expect(scheduleBanner('assignments_saved', '1')?.text).toBe('Saved 1 assignment.');
    expect(scheduleBanner('assignments_stopped', '2')?.tone).toBe('error');
    expect(scheduleBanner('assignments_saved', 'many')).toBeNull();
    expect(scheduleBanner('assignments_saved', undefined)).toBeNull();
  });
});
