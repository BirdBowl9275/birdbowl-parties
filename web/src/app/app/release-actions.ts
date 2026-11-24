'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { pickReplacement, type ReplacementCandidate } from '@/lib/release-rules';
import type { ShiftRow } from '@/lib/schedule-rules';
import { addDays } from '@/lib/parties';

const clock = (t: string) => String(t).slice(0, 5);

function back(message: string): never {
  redirect(`/app?msg=${encodeURIComponent(message)}`);
}

// Monday of the week containing an ISO date.
function mondayOf(iso: string): string {
  const dow = (new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
  return addDays(iso, -dow);
}

// The signed-in hostess releases one of her own parties. The database check (release_window_open)
// enforces ownership, the 48-hour window and the lock, using her own session. The reassignment
// reads other staff's data, so it runs with the admin key on the server only.
export async function releaseParty(formData: FormData) {
  const id = Number(formData.get('party_id'));
  if (!Number.isInteger(id) || id <= 0) back('Unknown party.');

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: open, error: openError } = await supabase.rpc('release_window_open', { p_party_id: id });
  if (openError) back('Could not release that party. Try again.');
  if (open !== true) {
    back('This party can no longer be released. Releases close 48 hours before arrival, and a locked party cannot be released.');
  }

  const admin = createSupabaseAdminClient();
  const { data: party } = await admin
    .from('parties')
    .select('id, party_date, start_time, end_time, assigned_host')
    .eq('id', id)
    .maybeSingle();
  if (!party || party.assigned_host !== user.id) back('That party is no longer yours.');

  const release = { id, date: party.party_date as string, start: clock(party.start_time as string), end: clock(party.end_time as string) };
  const monday = mondayOf(release.date);
  const sunday = addDays(monday, 6);

  const [hostsRes, shiftsRes, bookedRes, availRes] = await Promise.all([
    admin.from('profiles').select('id, full_name, daily_cap').eq('status', 'active').eq('tier', 1),
    admin
      .from('staff_shifts')
      .select('profile_id, tier, shift_date, start_time, end_time, end_next_day')
      .eq('week_start', monday),
    admin
      .from('parties')
      .select('id, assigned_host, party_date, start_time, end_time')
      .eq('status', 'active')
      .gte('party_date', monday)
      .lte('party_date', sunday)
      .not('assigned_host', 'is', null),
    admin
      .from('availability')
      .select('profile_id, day_of_week, start_time, end_time')
      .eq('week_start', monday),
  ]);

  const shiftsBy = new Map<string, ShiftRow[]>();
  for (const s of shiftsRes.data ?? []) {
    if (!s.profile_id) continue;
    const list = shiftsBy.get(s.profile_id as string) ?? [];
    list.push({
      tier: s.tier as 1 | 2 | 3,
      date: s.shift_date as string,
      start: clock(s.start_time as string),
      end: clock(s.end_time as string),
      endNextDay: Boolean(s.end_next_day),
    });
    shiftsBy.set(s.profile_id as string, list);
  }

  const bookedBy = new Map<string, { partyId: number; date: string; start: string; end: string }[]>();
  for (const b of bookedRes.data ?? []) {
    const host = b.assigned_host as string;
    const list = bookedBy.get(host) ?? [];
    list.push({ partyId: b.id as number, date: b.party_date as string, start: clock(b.start_time as string), end: clock(b.end_time as string) });
    bookedBy.set(host, list);
  }

  const availBy = new Map<string, { date: string; start: string; end: string }[]>();
  for (const a of availRes.data ?? []) {
    const list = availBy.get(a.profile_id as string) ?? [];
    list.push({
      date: addDays(monday, Number(a.day_of_week) - 1),
      start: clock(a.start_time as string),
      end: clock(a.end_time as string),
    });
    availBy.set(a.profile_id as string, list);
  }

  const candidates: ReplacementCandidate[] = (hostsRes.data ?? []).map((h) => ({
    id: h.id as string,
    name: (h.full_name as string) || 'Unnamed host',
    dailyCap: Number(h.daily_cap ?? 3),
    shifts: shiftsBy.get(h.id as string) ?? [],
    booked: bookedBy.get(h.id as string) ?? [],
    availability: availBy.get(h.id as string) ?? [],
  }));

  const chosen = pickReplacement(release, user.id, candidates);

  // Only change the party if it is still this hostess's. A double submit cannot reassign twice.
  const { data: updated, error: updateError } = await admin
    .from('parties')
    .update({ assigned_host: chosen?.hostId ?? null })
    .eq('id', id)
    .eq('assigned_host', user.id)
    .select('id');
  if (updateError || !updated || updated.length === 0) back('Could not release that party. Try again.');

  await admin.from('release_log').insert({
    party_id: id,
    released_by: user.id,
    outcome: chosen ? 'reassigned' : 'unassigned',
    new_host: chosen?.hostId ?? null,
  });

  // The replacement's name is not shown to the person who released the party.
  back(
    chosen
      ? 'Party released and given to another hostess.'
      : 'Party released. No one was available, so a manager will reassign it.',
  );
}
