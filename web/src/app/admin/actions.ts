'use server';

import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-guard';
import {
  BULK_MAX,
  validateBulkProfileChanges,
  validateProfileChange,
  validateSetting,
  type ValidProfileChange,
} from '@/lib/admin';
import type { AdminMessageCode } from '@/lib/admin-messages';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The banner text lives in lib/admin-messages.ts; the address only carries its code.
function back(path: string, code: AdminMessageCode, nothingSaved = false): never {
  redirect(`${path}?msg=${code}${nothingSaved ? '&none=1' : ''}`);
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

export async function updateProfile(formData: FormData) {
  const path = '/admin/users';
  const { supabase, user } = await requireAdmin();

  const targetId = field(formData, 'id').toLowerCase();
  if (!UUID.test(targetId)) back(path, 'unknown_user');

  const parsed = validateProfileChange({
    role: field(formData, 'role'),
    status: field(formData, 'status'),
    tier: field(formData, 'tier'),
    dailyCap: field(formData, 'daily_cap'),
    actorId: user.id,
    targetId,
  });
  if (!parsed.ok) back(path, parsed.error);
  const v = parsed.value;

  const result = await saveProfile(supabase, user.id, { id: targetId, ...v });
  if (result === 'error') back(path, 'save_failed');
  if (result === 'missing') back(path, 'user_not_found');

  // Say which row was saved, and jump back to it, so the row itself can confirm the save.
  // `at` makes the saved row start fresh, so its button shows "Saved" even after earlier edits.
  redirect(`${path}?msg=saved&saved=${targetId}&at=${Date.now()}#user-${targetId}`);
}

type Supabase = Awaited<ReturnType<typeof requireAdmin>>['supabase'];

async function saveProfile(
  supabase: Supabase,
  actorId: string,
  v: ValidProfileChange,
): Promise<'ok' | 'error' | 'missing'> {
  // RLS allows this only for admins. The guard trigger also checks it in the database.
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: v.role, status: v.status, tier: v.tier, daily_cap: v.dailyCap })
    .eq('id', v.id)
    .select('id');
  if (error) return 'error';
  if (!data || data.length === 0) return 'missing';

  if (v.status === 'active') {
    // Record the approval once, the first time the person becomes active.
    await supabase
      .from('profiles')
      .update({ approved_at: new Date().toISOString(), approved_by: actorId })
      .eq('id', v.id)
      .is('approved_at', null);
  }
  return 'ok';
}

// "Save all changes": every edited row in one go. All rows are validated first, so one bad row
// saves nothing. Rows are then written one by one with the same checks as a single Save.
export async function updateProfiles(formData: FormData) {
  const path = '/admin/users';
  const { supabase, user } = await requireAdmin();

  const ids = formData.getAll('id');
  const roles = formData.getAll('role');
  const statuses = formData.getAll('status');
  const tiers = formData.getAll('tier');
  const caps = formData.getAll('daily_cap');
  const n = ids.length;
  if ([roles, statuses, tiers, caps].some((list) => list.length !== n)) back(path, 'bulk_retry', true);
  if (n > BULK_MAX) back(path, 'too_many', true);

  const str = (x: FormDataEntryValue) => (typeof x === 'string' ? x : '');
  const parsed = validateBulkProfileChanges(
    ids.map((id, i) => ({
      id: str(id),
      role: str(roles[i]),
      status: str(statuses[i]),
      tier: str(tiers[i]),
      dailyCap: str(caps[i]),
    })),
    user.id,
  );
  if (!parsed.ok) back(path, parsed.error, true);

  const saved: string[] = [];
  const failed: string[] = [];
  for (const v of parsed.value) {
    if ((await saveProfile(supabase, user.id, v)) === 'ok') saved.push(v.id);
    else failed.push(v.id);
  }

  // Name the rows that did not save, so the page can mark them.
  const total = parsed.value.length;
  const result =
    failed.length === 0
      ? `msg=saved_many&n=${total}`
      : `msg=partial&n=${saved.length}&of=${total}&failed=${failed.join(',')}`;
  redirect(`${path}?${result}&saved=${saved.join(',')}&at=${Date.now()}`);
}

export async function updateSetting(formData: FormData) {
  const path = '/admin/settings';
  const { supabase } = await requireAdmin();

  const key = field(formData, 'key');
  const parsed = validateSetting(key, field(formData, 'value'));
  if (!parsed.ok) back(path, parsed.error);

  const { data, error } = await supabase
    .from('settings')
    .update({ value: parsed.value, updated_at: new Date().toISOString() })
    .eq('key', key)
    .select('key');
  if (error) back(path, 'setting_failed');
  if (!data || data.length === 0) back(path, 'setting_missing');

  back(path, 'saved');
}
