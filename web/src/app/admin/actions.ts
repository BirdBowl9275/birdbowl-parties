'use server';

import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-guard';
import { validateProfileChange, validateSetting } from '@/lib/admin';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function back(path: string, message: string): never {
  redirect(`${path}?msg=${encodeURIComponent(message)}`);
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

export async function updateProfile(formData: FormData) {
  const path = '/admin/users';
  const { supabase, user } = await requireAdmin();

  const targetId = field(formData, 'id');
  if (!UUID.test(targetId)) back(path, 'Unknown user.');

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

  // RLS allows this only for admins. The guard trigger also checks it in the database.
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: v.role, status: v.status, tier: v.tier, daily_cap: v.dailyCap })
    .eq('id', targetId)
    .select('id');
  if (error) back(path, 'Could not save that change.');
  if (!data || data.length === 0) back(path, 'That user was not found.');

  if (v.status === 'active') {
    // Record the approval once, the first time the person becomes active.
    await supabase
      .from('profiles')
      .update({ approved_at: new Date().toISOString(), approved_by: user.id })
      .eq('id', targetId)
      .is('approved_at', null);
  }

  back(path, 'Saved.');
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
  if (error) back(path, 'Could not save that setting.');
  if (!data || data.length === 0) back(path, 'That setting does not exist.');

  back(path, 'Saved.');
}
