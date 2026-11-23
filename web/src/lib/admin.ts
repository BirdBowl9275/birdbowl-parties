// Validation for admin changes. Pure functions, so they can be unit tested.
// The database still enforces who may make each change (RLS and the guard trigger).

export const ROLES = ['staff', 'sales', 'viewer', 'manager', 'admin'] as const;
export const STATUSES = ['pending', 'active', 'removed'] as const;
export type Role = (typeof ROLES)[number];
export type Status = (typeof STATUSES)[number];

export type ProfileChange = {
  role: string;
  status: string;
  tier: string; // '' means not a host
  dailyCap: string;
  actorId: string;
  targetId: string;
};

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateProfileChange(input: ProfileChange): ValidationResult<{
  role: Role;
  status: Status;
  tier: number | null;
  dailyCap: number;
}> {
  if (!(ROLES as readonly string[]).includes(input.role)) {
    return { ok: false, error: 'Pick a valid role.' };
  }
  if (!(STATUSES as readonly string[]).includes(input.status)) {
    return { ok: false, error: 'Pick a valid status.' };
  }

  let tier: number | null = null;
  if (input.tier !== '') {
    const parsed = Number(input.tier);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 3) {
      return { ok: false, error: 'Tier must be 1, 2, 3 or not a host.' };
    }
    tier = parsed;
  }
  // Viewers are read-only and never hosts; a tier would make them assignable.
  if (input.role === 'viewer' && tier !== null) {
    return { ok: false, error: 'A viewer cannot be a host. Set the tier to not a host.' };
  }

  const cap = Number(input.dailyCap);
  if (!Number.isInteger(cap) || cap < 0 || cap > 3) {
    return { ok: false, error: 'Daily cap must be between 0 and 3.' };
  }

  // Admins cannot remove or demote themselves, so they can't lock out the last admin by accident.
  // Compare case-insensitively: Postgres matches a UUID in any case (security verifier WEB-BULK-06).
  if (input.actorId.toLowerCase() === input.targetId.toLowerCase()) {
    if (input.status !== 'active' || input.role !== 'admin') {
      return { ok: false, error: 'You cannot change your own role or status here.' };
    }
  }

  return {
    ok: true,
    value: { role: input.role as Role, status: input.status as Status, tier, dailyCap: cap },
  };
}

// "Save all changes" on Admin → Users: several rows at once. Every row is checked before anything
// is written, so a bad row saves nothing. Removing someone is never done in bulk: it keeps its own
// confirm step on the row's Save.
export const BULK_MAX = 100;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type BulkEntry = { id: string; role: string; status: string; tier: string; dailyCap: string };
export type ValidProfileChange = { id: string; role: Role; status: Status; tier: number | null; dailyCap: number };

export function validateBulkProfileChanges(
  entries: BulkEntry[],
  actorId: string,
): ValidationResult<ValidProfileChange[]> {
  if (entries.length === 0) return { ok: false, error: 'There are no changes to save.' };
  if (entries.length > BULK_MAX) return { ok: false, error: `Save at most ${BULK_MAX} users at a time.` };

  const seen = new Set<string>();
  const out: ValidProfileChange[] = [];
  for (const raw of entries) {
    const e = { ...raw, id: raw.id.toLowerCase() };
    if (!UUID.test(e.id) || seen.has(e.id)) return { ok: false, error: 'Unknown user. Nothing was saved.' };
    seen.add(e.id);
    if (e.status === 'removed') {
      return { ok: false, error: "Nothing was saved. To remove someone, use Save on that person's row." };
    }
    const r = validateProfileChange({ ...e, actorId, targetId: e.id });
    if (!r.ok) return { ok: false, error: `Nothing was saved. ${r.error}` };
    out.push({ id: e.id, ...r.value });
  }
  return { ok: true, value: out };
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type SettingKey =
  | 'fairness_window_days'
  | 'hostess_avg_allowance_pct'
  | 'availability_cutoff_dow'
  | 'availability_cutoff_time'
  | 'reveal_time'
  | 'bowling_server_only_after';

export function validateSetting(key: string, raw: string): ValidationResult<string | number> {
  const value = raw.trim();
  switch (key as SettingKey) {
    case 'fairness_window_days': {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > 365) return { ok: false, error: 'Window must be 1 to 365 days.' };
      return { ok: true, value: n };
    }
    case 'hostess_avg_allowance_pct': {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 0 || n > 100) return { ok: false, error: 'Allowance must be 0 to 100 percent.' };
      return { ok: true, value: n };
    }
    case 'availability_cutoff_dow': {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > 7) return { ok: false, error: 'Cutoff day must be 1 (Mon) to 7 (Sun).' };
      return { ok: true, value: n };
    }
    case 'availability_cutoff_time':
    case 'reveal_time':
    case 'bowling_server_only_after':
      if (!TIME.test(value)) return { ok: false, error: 'Time must look like 08:00 or 18:30.' };
      return { ok: true, value };
    default:
      return { ok: false, error: 'Unknown setting.' };
  }
}
