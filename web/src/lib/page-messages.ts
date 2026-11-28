// Banner messages for Parties (sales) and Schedule (manager). As on the Admin pages
// (lib/admin-messages.ts), the address carries only a short code, never the wording, so a crafted
// link cannot put made-up text on someone's screen (security review WEB-BULK-03, verifier note).

import type { Tone } from './admin-messages';

type Table = Record<string, { tone: Tone; text: string }>;

export const SALES_MESSAGES = {
  party_added: { tone: 'success', text: 'Party added.' },
  party_saved: { tone: 'success', text: 'Party saved.' },
  party_cancelled: { tone: 'success', text: 'Party cancelled.' },
  unknown_party: { tone: 'error', text: 'Unknown party.' },
  party_not_found: { tone: 'error', text: 'That party was not found.' },
  save_party_failed: { tone: 'error', text: 'Could not save that party.' },
  save_change_failed: { tone: 'error', text: 'Could not save that change.' },
  cancel_failed: { tone: 'error', text: 'Could not cancel that party.' },
  assigned_locked: {
    tone: 'error',
    text: 'This party already has a host, so only a manager can change its date or time. Ask a manager to move it.',
  },
  // Form checks (lib/parties.ts validateParty).
  bad_date: { tone: 'error', text: 'Pick a valid date.' },
  bad_times: { tone: 'error', text: 'Pick a start and end time, like 2:00 p.m.' },
  end_before_start: { tone: 'error', text: 'End time must be after the start time.' },
  bad_kids: { tone: 'error', text: 'Kids must be a whole number from 0 to 200.' },
  bad_type: { tone: 'error', text: 'Pick Bowling or Arcade.' },
  bad_customer: { tone: 'error', text: 'Customer name is required (up to 120 characters).' },
  long_notes: { tone: 'error', text: 'Notes must be 500 characters or fewer.' },
} as const satisfies Table;

export const SCHEDULE_MESSAGES = {
  assignment_saved: { tone: 'success', text: 'Assignment saved.' },
  unknown_party: { tone: 'error', text: 'Unknown party.' },
  party_not_found: { tone: 'error', text: 'That party was not found.' },
  bad_host: { tone: 'error', text: 'Pick a valid host.' },
  lock_needs_host: { tone: 'error', text: 'Pick a host before locking a party.' },
  assignment_failed: { tone: 'error', text: 'Could not save that assignment.' },
  confirm_preview: { tone: 'error', text: 'Tick the box to confirm you reviewed the preview.' },
  shift_conflict: {
    tone: 'error',
    text: 'This hostess is on the uploaded schedule at that time. Tick "Override schedule conflict" to assign her anyway.',
  },
  assignment_saved_shift_override: {
    tone: 'success',
    text: 'Assignment saved. The schedule conflict was overridden on purpose.',
  },
  assignment_saved_unavailable: {
    tone: 'error',
    text: 'Assignment saved, but she has no availability marked for that time. Check with her before the party.',
  },
  // One Save for the whole week.
  week_saved: { tone: 'success', text: 'Schedule saved.' },
  week_saved_unavailable: {
    tone: 'error',
    text: 'Schedule saved, but some hostesses have no availability marked for their party. Check with them before the party.',
  },
  week_partial: {
    tone: 'error',
    text: 'Some changes were not saved. A hostess overlaps a shift without the override box, or a locked party has no host. Fix those rows and save again.',
  },
} as const satisfies Table;

export type SalesCode = keyof typeof SALES_MESSAGES;
export type ScheduleCode = keyof typeof SCHEDULE_MESSAGES;

// Validators return readable text; find its code. Unknown text falls back to a generic error,
// so new validator wording can never reach the address.
export function salesCodeFor(text: string, fallback: SalesCode = 'save_change_failed'): SalesCode {
  for (const [code, m] of Object.entries(SALES_MESSAGES)) if (m.text === text) return code as SalesCode;
  return fallback;
}

const COUNT = /^\d{1,4}$/;

function fromTable(table: Table, msg: string | undefined) {
  if (!msg || !Object.hasOwn(table, msg)) return null;
  return table[msg];
}

export function salesBanner(msg: string | undefined) {
  return fromTable(SALES_MESSAGES, msg);
}

// Schedule also reports how many proposed assignments were saved.
export function scheduleBanner(msg: string | undefined, n: string | undefined) {
  if ((msg === 'assignments_saved' || msg === 'assignments_stopped') && n && COUNT.test(n)) {
    const count = Number(n);
    const what = `${count} ${count === 1 ? 'assignment' : 'assignments'}`;
    return msg === 'assignments_saved'
      ? { tone: 'success' as const, text: `Saved ${what}.` }
      : { tone: 'error' as const, text: `Stopped after saving ${what}. Check the preview and try again.` };
  }
  return fromTable(SCHEDULE_MESSAGES, msg);
}
