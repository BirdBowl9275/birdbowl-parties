'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { daysFromForm, parseAvailability } from '@/lib/availability';
import { todayBusiness, validWeekStart } from '@/lib/parties';
import { DUPLICATE_KEY } from '@/lib/availability-submission';

function back(week: string, message: string): never {
  redirect(`/app/availability?week=${encodeURIComponent(week)}&msg=${encodeURIComponent(message)}`);
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

// Saves the signed-in person's own availability for one week. The database rejects the write
// after the cutoff (availability_locked), and RLS limits every row to the signed-in person.
// Order: insert the new windows, then remove the old ones. A failed insert leaves the old
// windows in place.
export async function saveAvailability(formData: FormData) {
  const week = validWeekStart(field(formData, 'week'), todayBusiness());
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const parsed = parseAvailability(daysFromForm((name) => field(formData, name)));
  if (!parsed.ok) back(week, parsed.error);

  const { data: locked, error: lockError } = await supabase.rpc('availability_locked', { p_week_start: week });
  if (!lockError && locked === true) back(week, 'This week is locked. Ask a manager to change it.');

  const { data: existing, error: readError } = await supabase
    .from('availability')
    .select('id')
    .eq('profile_id', user.id)
    .eq('week_start', week);
  if (readError) back(week, 'Could not save your availability. Try again.');

  if (parsed.windows.length > 0) {
    const { error: insertError } = await supabase.from('availability').insert(
      parsed.windows.map((w) => ({
        profile_id: user.id,
        week_start: week,
        day_of_week: w.day,
        start_time: w.start,
        end_time: w.end,
      })),
    );
    if (insertError) {
      if (insertError.code === '42501') back(week, 'This week is locked. Ask a manager to change it.');
      back(week, 'Could not save your availability. Try again.');
    }
  }

  const oldIds = (existing ?? []).map((r) => r.id as number);
  if (oldIds.length > 0) {
    const { error: deleteError } = await supabase.from('availability').delete().in('id', oldIds);
    if (deleteError) back(week, 'Saved, but some earlier entries could not be removed. Refresh and check.');
  }

  // Record the submission, so an empty week is not treated as unanswered. A repeat save is fine.
  const { error: markError } = await supabase
    .from('availability_submissions')
    .insert({ profile_id: user.id, week_start: week, submitted_by: user.id });
  if (markError && markError.code !== DUPLICATE_KEY) {
    back(week, 'Saved, but the submission could not be recorded. Try again.');
  }

  // Saved: staff go on to their schedule.
  redirect('/app');
}
