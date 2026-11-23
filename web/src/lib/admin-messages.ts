// Banner messages for the Admin pages. The page address carries only a short code (`?msg=saved`),
// never the wording itself, so a crafted link cannot put made-up text on an admin's screen
// (security review WEB-BULK-03). Unknown codes show nothing.

import { BULK_MAX } from './admin';

export type Tone = 'success' | 'error';

export const ADMIN_MESSAGES = {
  // Results
  saved: { tone: 'success', text: 'Saved.' },
  // Users
  unknown_user: { tone: 'error', text: 'Unknown user.' },
  user_not_found: { tone: 'error', text: 'That user was not found.' },
  save_failed: { tone: 'error', text: 'Could not save that change.' },
  bad_role: { tone: 'error', text: 'Pick a valid role.' },
  bad_status: { tone: 'error', text: 'Pick a valid status.' },
  bad_tier: { tone: 'error', text: 'Tier must be 1, 2, 3 or not a host.' },
  viewer_tier: { tone: 'error', text: 'A viewer cannot be a host. Set the tier to not a host.' },
  bad_cap: { tone: 'error', text: 'Daily cap must be between 0 and 3.' },
  self_change: { tone: 'error', text: 'You cannot change your own role or status here.' },
  // Save all
  no_changes: { tone: 'error', text: 'There are no changes to save.' },
  too_many: { tone: 'error', text: `Save at most ${BULK_MAX} users at a time.` },
  bulk_removed: { tone: 'error', text: "To remove someone, use Save on that person's row." },
  bulk_retry: { tone: 'error', text: 'Something went wrong. Try again.' },
  // Settings
  bad_window: { tone: 'error', text: 'Window must be 1 to 365 days.' },
  bad_allowance: { tone: 'error', text: 'Allowance must be 0 to 100 percent.' },
  bad_dow: { tone: 'error', text: 'Cutoff day must be 1 (Mon) to 7 (Sun).' },
  bad_time: { tone: 'error', text: 'Time must look like 08:00 or 18:30.' },
  unknown_setting: { tone: 'error', text: 'Unknown setting.' },
  setting_missing: { tone: 'error', text: 'That setting does not exist.' },
  setting_failed: { tone: 'error', text: 'Could not save that setting.' },
} as const satisfies Record<string, { tone: Tone; text: string }>;

export type AdminMessageCode = keyof typeof ADMIN_MESSAGES;

const COUNT = /^\d{1,3}$/;

// Builds the banner from the query string. Only known codes and small whole numbers are used;
// everything else in the address is ignored.
export function adminBanner(params: {
  msg?: string;
  n?: string;
  of?: string;
  none?: string;
}): { tone: Tone; text: string } | null {
  const { msg, n, of, none } = params;
  if (!msg) return null;

  if (msg === 'saved_many' && n && COUNT.test(n)) {
    const count = Number(n);
    return { tone: 'success', text: `Saved ${count} ${count === 1 ? 'user' : 'users'}.` };
  }
  if (msg === 'partial' && n && of && COUNT.test(n) && COUNT.test(of) && Number(n) <= Number(of)) {
    return {
      tone: 'error',
      text: `Saved ${Number(n)} of ${Number(of)} users. The rows marked "Not saved" were not changed; check them and try again.`,
    };
  }
  if (!Object.hasOwn(ADMIN_MESSAGES, msg)) return null;
  const m = ADMIN_MESSAGES[msg as AdminMessageCode];
  // "Save all" checks every row first; if one is wrong, nothing is written.
  const text = none === '1' && m.tone === 'error' ? `Nothing was saved. ${m.text}` : m.text;
  return { tone: m.tone, text };
}

// Query values can arrive as an array when a key is repeated (?saved=a&saved=b). Use only a
// single string; anything else counts as missing (security review WEB-BULK-07).
export function one(v: string | string[] | undefined): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// A comma list of user ids from the address: lowercase UUIDs only, at most `max` of them.
export function parseIdList(v: string | string[] | undefined, max: number): Set<string> {
  const s = one(v);
  if (!s) return new Set();
  return new Set(
    s
      .split(',')
      .slice(0, max)
      .map((x) => x.toLowerCase())
      .filter((x) => UUID.test(x)),
  );
}
