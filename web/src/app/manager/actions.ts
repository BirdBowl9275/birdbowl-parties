'use server';

import { redirect } from 'next/navigation';
import { requireManager } from '@/lib/manager-guard';
import { validWeekStart, todayBusiness, nowClockBusiness, weekStart } from '@/lib/parties';
import { assignWeek } from '@/lib/engine';
import { loadWeekInput } from '@/lib/engine-data';
import { dayOfWeek, overlapsShift, windowCovers, type Span } from '@/lib/host-schedule';
import type { ScheduleCode } from '@/lib/page-messages';

const PARTY_ID = /^\d+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The banner text lives in lib/page-messages.ts; the address only carries its code (and a count).
function back(week: string, code: ScheduleCode): never {
  redirect(`/manager/schedule?week=${encodeURIComponent(week)}&msg=${code}`);
}

// Count messages always carry their number.
function backCount(week: string, code: 'assignments_saved' | 'assignments_stopped', n: number): never {
  redirect(`/manager/schedule?week=${encodeURIComponent(week)}&msg=${code}&n=${n}`);
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

// Manual reassign and lock. The database trigger also checks that the host is active and
// host-eligible, so a bad host id is rejected even if this check were skipped.
export async function reassignParty(formData: FormData) {
  const week = validWeekStart(field(formData, 'week'), todayBusiness());
  const { supabase } = await requireManager();

  const partyId = field(formData, 'party_id');
  if (!PARTY_ID.test(partyId)) back(week, 'unknown_party');

  const hostId = field(formData, 'host_id');
  const locked = field(formData, 'locked') === 'on';
  if (hostId !== '' && !UUID.test(hostId)) back(week, 'bad_host');
  if (locked && hostId === '') back(week, 'lock_needs_host');

  // The party's date and time, for the schedule and availability checks.
  const { data: party, error: partyError } = await supabase
    .from('parties')
    .select('party_date, start_time, end_time')
    .eq('id', Number(partyId))
    .maybeSingle();
  if (partyError) back(week, 'assignment_failed');
  if (!party) back(week, 'party_not_found');

  let overridingShift = false;
  let unavailable = false;
  if (hostId !== '') {
    const date = String(party.party_date);
    const span: Span = { start: String(party.start_time), end: String(party.end_time) };

    // A clash with the uploaded schedule needs the manager to tick the override.
    const shifts = await shiftsOn(supabase, hostId, date);
    if (shifts === null) back(week, 'assignment_failed');
    if (shifts.some((s) => overlapsShift(span, s))) {
      if (field(formData, 'override_shift') !== 'on') back(week, 'shift_conflict');
      overridingShift = true;
    }

    // Availability never blocks; the save goes through and the manager is told.
    const windows = await availabilityOn(supabase, hostId, date);
    unavailable = windows === null || !windowCovers(windows, span);
  }

  const { data, error } = await supabase
    .from('parties')
    .update({
      assigned_host: hostId === '' ? null : hostId,
      assignment_locked: locked,
    })
    .eq('id', Number(partyId))
    .select('id');
  if (error) back(week, 'assignment_failed');
  if (!data || data.length === 0) back(week, 'party_not_found');
  if (overridingShift) back(week, 'assignment_saved_shift_override');
  if (unavailable) back(week, 'assignment_saved_unavailable');
  back(week, 'assignment_saved');
}

type Db = Awaited<ReturnType<typeof requireManager>>['supabase'];

// The hostess's uploaded shifts on one date. Null when the read fails, so the save stops.
async function shiftsOn(db: Db, hostId: string, date: string): Promise<Span[] | null> {
  const { data, error } = await db
    .from('staff_shifts')
    .select('start_time, end_time, end_next_day')
    .eq('profile_id', hostId)
    .eq('shift_date', date);
  if (error) return null;
  return (data ?? []).map((s) => ({
    start: String(s.start_time),
    end: String(s.end_time),
    endNextDay: Boolean(s.end_next_day),
  }));
}

// Her availability windows for the party's day. Null when the read fails, which counts as unavailable.
async function availabilityOn(db: Db, hostId: string, date: string): Promise<Span[] | null> {
  const { data, error } = await db
    .from('availability')
    .select('start_time, end_time')
    .eq('profile_id', hostId)
    .eq('week_start', weekStart(date))
    .eq('day_of_week', dayOfWeek(date));
  if (error) return null;
  return (data ?? []).map((r) => ({ start: String(r.start_time), end: String(r.end_time) }));
}

// Saves what the engine proposes for the week, after a manager has reviewed the preview.
// The server recalculates the proposal itself, so no host ids come from the browser.
// Fixed parties (manager-locked or already revealed) are never changed.
export async function saveProposedAssignments(formData: FormData) {
  const week = validWeekStart(field(formData, 'week'), todayBusiness());
  if (field(formData, 'confirm') !== 'on') {
    back(week, 'confirm_preview');
  }

  const { supabase } = await requireManager();
  const input = await loadWeekInput(supabase, week, todayBusiness(), nowClockBusiness());
  const result = assignWeek(input.parties, input.hosts, input.history, input.settings, input.offers);
  const proposed = new Map(result.assignments.map((a) => [a.partyId, a.hostId]));
  let saved = 0;
  for (const p of input.parties) {
    if (p.fixed) continue;
    const target = proposed.get(p.id) ?? null;
    if (target === p.assignedHost) continue;

    const { error } = await supabase
      .from('parties')
      .update({ assigned_host: target })
      .eq('id', Number(p.id))
      .select('id');
    if (error) backCount(week, 'assignments_stopped', saved);
    saved += 1;
  }
  backCount(week, 'assignments_saved', saved);
}
