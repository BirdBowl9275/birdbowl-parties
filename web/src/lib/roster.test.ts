import { describe, expect, it } from 'vitest';
import { parseClock, parseCsv, parseDate, parseRoster } from './roster';

const HEADER = 'Employee Name,Phone,Job,Date,Start,End';

describe('parseCsv', () => {
  it('handles quoted commas, escaped quotes, CRLF and a BOM', () => {
    const rows = parseCsv('﻿A,"B, Jr.","say ""hi""",D\r\n1,2,3,4\r\n');
    expect(rows).toEqual([
      ['A', 'B, Jr.', 'say "hi"', 'D'],
      ['1', '2', '3', '4'],
    ]);
  });
});

describe('parseClock and parseDate', () => {
  it('reads 24-hour and AM/PM times', () => {
    expect(parseClock('9:00')).toBe('09:00');
    expect(parseClock('9:00 AM')).toBe('09:00');
    expect(parseClock('12:30 pm')).toBe('12:30');
    expect(parseClock('12:00 AM')).toBe('00:00');
    expect(parseClock('21:15')).toBe('21:15');
    expect(parseClock('25:00')).toBeNull();
    expect(parseClock('soon')).toBeNull();
  });

  it('reads ISO and US dates, and rejects impossible ones', () => {
    expect(parseDate('2026-11-25')).toBe('2026-11-25');
    expect(parseDate('11/25/2026')).toBe('2026-11-25');
    expect(parseDate('11/25/26')).toBe('2026-11-25');
    expect(parseDate('02/30/2026')).toBeNull();
    expect(parseDate('later')).toBeNull();
  });
});

describe('parseRoster', () => {
  it('maps jobs to tiers and skips other jobs', () => {
    const r = parseRoster(
      [
        HEADER,
        'Ana Diaz,555-0100,Game Room,2026-11-25,10:00 AM,2:00 PM',
        'Bo Lee,555-0101,Front Desk,2026-11-25,9:00,17:00',
        'Cy Ruiz,555-0102,Shoes,2026-11-25,9:00,17:00',
        'Dee Park,555-0103,Lane Service,2026-11-25,4:00 PM,11:00 PM',
        'Eli Wu,555-0104,Dishwasher,2026-11-25,9:00,17:00',
      ].join('\n'),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows.map((x) => [x.staffName, x.tier])).toEqual([
      ['Ana Diaz', 1],
      ['Bo Lee', 2],
      ['Cy Ruiz', 2],
      ['Dee Park', 3],
    ]);
    expect(r.skippedJobs).toBe(1);
  });

  it('never reads the phone column', () => {
    const r = parseRoster([HEADER, 'Ana Diaz,DO NOT USE,Game Room,2026-11-25,10:00,14:00'].join('\n'));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(JSON.stringify(r.rows)).not.toContain('DO NOT USE');
    expect(Object.keys(r.rows[0])).not.toContain('phone');
  });

  it('marks a shift that ends after midnight as ending the next day', () => {
    const r = parseRoster([HEADER, 'Dee Park,,Lane Service,2026-11-25,5:00 PM,2:00 AM'].join('\n'));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows[0]).toMatchObject({ start: '17:00', end: '02:00', endNextDay: true });
  });

  it('sets each row to the Monday of its own week', () => {
    // 2026-11-29 is a Sunday, so it belongs to the week that starts 2026-11-23.
    const r = parseRoster([HEADER, 'Ana Diaz,,Game Room,2026-11-29,10:00,14:00'].join('\n'));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows[0].weekStart).toBe('2026-11-23');
  });

  it('counts rows it cannot read, without importing them', () => {
    const r = parseRoster(
      [
        HEADER,
        ',,Game Room,2026-11-25,10:00,14:00', // no name
        'Ana Diaz,,Game Room,not-a-date,10:00,14:00', // bad date
        'Bo Lee,,Game Room,2026-11-25,10:00,10:00', // same start and end
        'Cy Ruiz,,Game Room,2026-11-25,10:00,14:00',
      ].join('\n'),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows.map((x) => x.staffName)).toEqual(['Cy Ruiz']);
    expect(r.invalidRows).toBe(3);
  });

  it('finds the columns by name, whatever order they are in', () => {
    const r = parseRoster(
      ['Job,End,Start,Date,Name', 'Game Room,14:00,10:00,2026-11-25,Ana Diaz'].join('\n'),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows[0]).toMatchObject({ staffName: 'Ana Diaz', tier: 1, start: '10:00', end: '14:00' });
  });

  it('reports missing columns by name', () => {
    const r = parseRoster('Name,Job,Date,Start\nAna,Game Room,2026-11-25,10:00');
    expect(r).toEqual({ ok: false, error: 'missing_columns', missing: ['End'] });
  });

  it('rejects an empty file', () => {
    expect(parseRoster('   \n  ')).toEqual({ ok: false, error: 'empty' });
  });
});
