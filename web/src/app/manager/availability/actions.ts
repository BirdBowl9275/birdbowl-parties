'use server';

import { redirect } from 'next/navigation';
import { daysFromForm, parseAvailability } from '@/lib/availability';
import { isOverrideTarget, isUuid } from '@/lib/availability-override';
import { todayBusiness, validWeekStart } from '@/lib/parties';
import { requireOverrideAccess } from '@/lib/override-guard';

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

function back(week: string, hostess: string, message: string): never {
  const h = hostess ? `&hostess=${encodeURIComponent(hostess)}` : '';
  redirect(`/manager/availability?week=${encodeURIComponent(week)}${h}&msg=${encodeURIComponent(message)}`);
}

// Enters or replaces one hostess's availability for one week, on her behalf. Only a manager or
// admin with the override flag can do this, and only for an active tier-1 hostess. The database
// enforces both (migration 0020) and logs every change. The cutoff does not apply to overrides.
export async function saveOverride(formData: FormData) {
  const { supabase } = await requireOverrideAccess();
  const week = validWeekStart(field(formData, 'week'), todayBusiness());
  const hostess = field(formData, 'hostess').toLowerCase();
  if (!isUuid(hostess)) back(week, '', 'Choose a hostess first.');

  const parsed = parseAvailability(daysFromForm((name) => field(formData, name)));
  if (!parsed.ok) back(week, hostess, parsed.error);

  const { data: target, error: targetError } = await supabase
    .from('profiles')
    .select('status, role, tier')
    .eq('id', hostess)
    .maybeSingle();
  if (targetError) back(week, hostess, 'Could not save. Try again.');
  if (!isOverrideTarget(target as { status: string | null; role: string | null; tier: number | null } | null)) {
    back(week, hostess, 'That person is not an active staff member, so availability cannot be entered for them here.');
  }

  const { data: existing, error: readError } = await supabase
    .from('availability')
    .select('id')
    .eq('profile_id', hostess)
    .eq('week_start', week);
  if (readError) back(week, hostess, 'Could not save. Try again.');

  // Same order as the hostess's own save: insert the new windows first, then remove the old ones.
  if (parsed.windows.length > 0) {
    const { error: insertError } = await supabase.from('availability').insert(
      parsed.windows.map((w) => ({
        profile_id: hostess,
        week_start: week,
        day_of_week: w.day,
        start_time: w.start,
        end_time: w.end,
      })),
    );
    if (insertError) {
      if (insertError.code === '42501') back(week, hostess, 'You do not have permission to enter availability for this person.');
      back(week, hostess, 'Could not save. Try again.');
    }
  }

  const oldIds = (existing ?? []).map((r) => r.id as number);
  if (oldIds.length > 0) {
    const { error: deleteError } = await supabase.from('availability').delete().in('id', oldIds);
    if (deleteError) back(week, hostess, 'Saved, but some earlier entries could not be removed. Refresh and check.');
  }

  back(week, hostess, 'Saved. This change is logged.');
}
