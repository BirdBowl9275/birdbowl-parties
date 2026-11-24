// Reads a HotSchedules weekly roster export (CSV). Pure: no database, so it is unit tested.
// It never assigns anyone. The output is shift rows for conflict checks and hour totals only.
//
// Rules:
//  - The Phone column is never read.
//  - Job to tier: Game Room is 1 (hostess); Front Desk and Shoes are 2; Lane Service, Server,
//    Bar and Bartender are 3. Any other job is skipped and counted.
//  - A shift that ends at or before its start ends the next day (overnight).
//  - Dates may be YYYY-MM-DD or M/D/YYYY. Times may be 24-hour or with AM/PM.

import { addDays } from './parties';

export const MAX_ROSTER_ROWS = 2000;

export type RosterRow = {
  staffName: string;
  tier: 1 | 2 | 3;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  endNextDay: boolean;
  weekStart: string; // Monday of the row's date
};

export type RosterParse =
  | { ok: true; rows: RosterRow[]; skippedJobs: number; invalidRows: number }
  | { ok: false; error: 'empty' | 'missing_columns' | 'too_many_rows'; missing?: string[] };

const JOB_TIER: Record<string, 1 | 2 | 3> = {
  'game room': 1,
  'front desk': 2,
  shoes: 2,
  'lane service': 3,
  server: 3,
  bar: 3,
  bartender: 3,
};

// Splits CSV text into rows of cells. Handles quoted cells, commas inside quotes, "" escapes,
// and CRLF or LF line endings.
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

// Finds the column for each field by header name. Phone is deliberately not matched.
function findColumns(header: string[]) {
  const find = (re: RegExp) => header.findIndex((h) => re.test(h.trim()));
  return {
    name: find(/^(employee\s*)?name$|^staff\s*name$|^employee$/i),
    job: find(/job|position|role|title/i),
    date: find(/^date$|^shift\s*date$|^day$/i),
    start: find(/^(shift\s*)?start(\s*time)?$|^in$|clock\s*in/i),
    end: find(/^(shift\s*)?end(\s*time)?$|^out$|clock\s*out|^finish/i),
  };
}

// "9:00", "09:00", "9:00 AM", "9:00am", "12:30 PM" -> "HH:MM". Null when not a time.
export function parseClock(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})\s*([ap])?\.?\s*(m\.?)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (min > 59) return null;
  const ampm = m[3]?.toLowerCase();
  if (ampm) {
    if (h < 1 || h > 12) return null;
    if (ampm === 'a' && h === 12) h = 0;
    if (ampm === 'p' && h !== 12) h += 12;
  } else if (h > 23) {
    return null;
  }
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

// "2026-11-25" or "11/25/2026" or "11/25/26" -> "YYYY-MM-DD". Null when not a date.
export function parseDate(raw: string): string | null {
  const t = raw.trim();
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return validDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const us = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (us) {
    const year = us[3].length === 2 ? 2000 + Number(us[3]) : Number(us[3]);
    return validDate(year, Number(us[1]), Number(us[2]));
  }
  return null;
}

function validDate(y: number, mo: number, d: number): string | null {
  const dt = new Date(Date.UTC(y, mo - 1, d, 12));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// Monday of the week containing an ISO date (Monday = start of week, as in the app).
function mondayOf(iso: string): string {
  const dow = (new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7;
  return addDays(iso, -dow);
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export function parseRoster(text: string): RosterParse {
  const table = parseCsv(text);
  if (table.length === 0) return { ok: false, error: 'empty' };

  const [header, ...body] = table;
  const cols = findColumns(header);
  const missing = [
    cols.name < 0 ? 'Name' : null,
    cols.job < 0 ? 'Job' : null,
    cols.date < 0 ? 'Date' : null,
    cols.start < 0 ? 'Start' : null,
    cols.end < 0 ? 'End' : null,
  ].filter((x): x is string => x !== null);
  if (missing.length > 0) return { ok: false, error: 'missing_columns', missing };
  if (body.length > MAX_ROSTER_ROWS) return { ok: false, error: 'too_many_rows' };

  const rows: RosterRow[] = [];
  let skippedJobs = 0;
  let invalidRows = 0;

  for (const r of body) {
    const cell = (i: number) => (r[i] ?? '').trim();
    const tier = JOB_TIER[cell(cols.job).toLowerCase()];
    if (!tier) {
      skippedJobs++;
      continue;
    }
    const staffName = cell(cols.name).replace(/\s+/g, ' ');
    const date = parseDate(cell(cols.date));
    const start = parseClock(cell(cols.start));
    const end = parseClock(cell(cols.end));
    if (!staffName || !date || !start || !end || start === end) {
      invalidRows++;
      continue;
    }
    const endNextDay = toMin(end) < toMin(start);
    rows.push({ staffName, tier, date, start, end, endNextDay, weekStart: mondayOf(date) });
  }

  return { ok: true, rows, skippedJobs, invalidRows };
}
