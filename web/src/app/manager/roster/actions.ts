'use server';

import { redirect } from 'next/navigation';
import { requireManager } from '@/lib/manager-guard';
import { parseDate, parseRoster, type RosterRow } from '@/lib/roster';

// Largest roster file accepted. A week of shifts is far smaller than this.
const MAX_BYTES = 1_000_000;
const CHUNK = 500;

// Lower-case, single-spaced name. Used to match a roster name to an app account.
const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

function back(msg: string, counts?: { imported: number; skipped: number; invalid: number; discarded: number }): never {
  const extra = counts
    ? `&imported=${counts.imported}&skipped=${counts.skipped}&invalid=${counts.invalid}&discarded=${counts.discarded}`
    : '';
  redirect(`/manager/roster?msg=${encodeURIComponent(msg)}${extra}`);
}

// Manager only. Reads the HotSchedules weekly roster and stores each row as a shift, for conflict
// checks and hour totals. It never assigns anyone. Each row is written with the manager's own
// session, so the database's row rules apply. Importing the same week again is safe: an existing
// row is updated, not duplicated. Rows that are no longer in the file are not removed.
export async function importRoster(formData: FormData) {
  const { supabase, user } = await requireManager();

  const file = formData.get('roster');
  if (!(file instanceof File) || file.size === 0) back('choose_file');
  if (file.size > MAX_BYTES) back('file_too_large');

  // The week start is needed for the wide HotSchedules export, which has no dates. It must be a Monday.
  const weekRaw = String(formData.get('week_start') ?? '').trim();
  const weekStart = weekRaw ? parseDate(weekRaw) : null;
  if (weekRaw && !weekStart) back('week_not_valid');
  if (weekStart && new Date(`${weekStart}T12:00:00Z`).getUTCDay() !== 1) back('week_not_monday');

  const parsed = parseRoster(await file.text(), weekStart ?? undefined);
  if (!parsed.ok) {
    if (parsed.error === 'missing_columns') back('missing_columns');
    if (parsed.error === 'missing_week_start') back('missing_week_start');
    back(parsed.error === 'too_many_rows' ? 'too_many_rows' : 'empty_file');
  }

  // Keep a row only when its name matches an active app account exactly (ignoring case and extra
  // spaces). Every other row is discarded and counted. Nothing is linked by guessing. A person who
  // has no account is not a hostess, so their shifts are not needed for hour or conflict checks.
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('status', 'active');
  if (profilesError) back('import_failed');
  const idByName = new Map<string, string>();
  for (const p of profiles ?? []) {
    if (p.full_name) idByName.set(norm(p.full_name as string), p.id as string);
  }

  let discarded = 0;
  const records = parsed.rows.flatMap((r: RosterRow) => {
    const profileId = idByName.get(norm(r.staffName));
    if (!profileId) {
      discarded++;
      return [];
    }
    return [
      {
        source: 'hotschedules',
        staff_name: r.staffName,
        profile_id: profileId,
        tier: r.tier,
        shift_date: r.date,
        start_time: r.start,
        end_time: r.end,
        end_next_day: r.endNextDay,
        week_start: r.weekStart,
        imported_by: user.id,
      },
    ];
  });

  for (let i = 0; i < records.length; i += CHUNK) {
    const { error } = await supabase
      .from('staff_shifts')
      .upsert(records.slice(i, i + CHUNK), { onConflict: 'source,staff_name,tier,shift_date,start_time,end_time' });
    if (error) {
      // Earlier chunks may already be saved. Running the import again is safe. The error code (for
      // example 42501 for a permission problem) carries no row data, so it is safe to show.
      redirect(`/manager/roster?msg=import_stopped&code=${encodeURIComponent(String(error.code ?? 'unknown'))}`);
    }
  }

  back('import_saved', {
    imported: records.length,
    skipped: parsed.skippedJobs,
    invalid: parsed.invalidRows,
    discarded,
  });
}
