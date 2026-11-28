'use server';

import { redirect } from 'next/navigation';
import { requireManager } from '@/lib/manager-guard';
import { addDays, validWeekStart, todayBusiness, nowClockBusiness, weekStart } from '@/lib/parties';
import { assignWeek } from '@/lib/engine';
import { loadWeekInput } from '@/lib/engine-data';
import { dayOfWeek, overlapsShift, sameName, windowCovers, withArrival, type Span } from '@/lib/host-schedule';
import type { ScheduleCode } from '@/lib/page-messages';
import { changedPartyIds, type PostedRow } from '@/lib/assignment-changes';

const PARTY_ID = /^\d+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The banner text lives in lib/page-messages.ts; the address only carries its code (and a count).
function back(week: string, code: ScheduleCode): never {
  redirect(`/manager/schedule?week=${encodeURIComponent(week)}&msg=${code}`);
}

// After a row is saved, the page gets the party id so that row's Save button turns green.
function backSaved(week: string, code: ScheduleCode, partyId: string): never {
  redirect(`/manager/schedule?week=${encodeURIComponent(week)}&msg=${code}&saved=${encodeURIComponent(partyId)}`);
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
    const partyStart = String(party.start_time);

    // Her name, for shifts uploaded before she was linked to a profile.
    const { data: hostRow, error: hostError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', hostId)
      .maybeSingle();
    if (hostError) back(week, 'assignment_failed');

    // Her first party of the day starts an hour early (she arrives before it), so the checks use that.
    const { data: others, error: othersError } = await supabase
      .from('parties')
      .select('start_time')
      .eq('assigned_host', hostId)
      .eq('party_date', date)
      .eq('status', 'active')
      .neq('id', Number(partyId));
    if (othersError) back(week, 'assignment_failed');
    const isFirstOfDay = !(others ?? []).some((o) => String(o.start_time) < partyStart);
    const span: Span = { start: withArrival(partyStart, isFirstOfDay), end: String(party.end_time).slice(0, 5) };

    // A clash with the uploaded schedule needs the manager to tick the override.
    const shifts = await shiftsOn(supabase, hostId, (hostRow?.full_name as string | null) ?? null, date);
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
  if (overridingShift) backSaved(week, 'assignment_saved_shift_override', partyId);
  if (unavailable) backSaved(week, 'assignment_saved_unavailable', partyId);
  backSaved(week, 'assignment_saved', partyId);
}

type Db = Awaited<ReturnType<typeof requireManager>>['supabase'];

// Her uploaded shifts on one date: linked to her profile, or unlinked with her name (same rule as
// the roster import). Null when the read fails, so the save stops.
async function shiftsOn(db: Db, hostId: string, hostName: string | null, date: string): Promise<Span[] | null> {
  const { data, error } = await db
    .from('staff_shifts')
    .select('profile_id, staff_name, start_time, end_time, end_next_day')
    .eq('shift_date', date)
    .or(`profile_id.eq.${hostId},profile_id.is.null`);
  if (error) return null;
  return (data ?? [])
    .filter(
      (s) =>
        s.profile_id === hostId ||
        (s.profile_id === null && hostName !== null && sameName(String(s.staff_name), hostName)),
    )
    .map((s) => ({
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

type DbRow = {
  id: number;
  party_date: string;
  start_time: string;
  end_time: string;
  assigned_host: string | null;
  assignment_locked: boolean;
};

// The same checks as a single manual assignment, without redirecting. 'blocked' means the host
// overlaps an uploaded shift without the override box (or the read failed). 'unavailable' means
// she is not marked free for the party's time, which saves but is reported.
async function checkManualHost(
  db: Db,
  party: DbRow,
  hostId: string,
  override: boolean,
): Promise<'blocked' | 'ok' | 'unavailable'> {
  const { data: others, error: othersError } = await db
    .from('parties')
    .select('start_time')
    .eq('assigned_host', hostId)
    .eq('party_date', party.party_date)
    .eq('status', 'active')
    .neq('id', party.id);
  if (othersError) return 'blocked';
  const isFirstOfDay = !(others ?? []).some((o) => String(o.start_time) < party.start_time);
  const span: Span = { start: withArrival(party.start_time, isFirstOfDay), end: party.end_time.slice(0, 5) };

  const { data: hostRow, error: hostError } = await db.from('profiles').select('full_name').eq('id', hostId).maybeSingle();
  if (hostError) return 'blocked';
  const shifts = await shiftsOn(db, hostId, (hostRow?.full_name as string | null) ?? null, party.party_date);
  if (shifts === null) return 'blocked';
  if (shifts.some((s) => overlapsShift(span, s)) && !override) return 'blocked';

  const windows = await availabilityOn(db, hostId, party.party_date);
  return windows === null || !windowCovers(windows, span) ? 'unavailable' : 'ok';
}

// Saves every host and lock change on the week's schedule with one Save. Only changed rows are
// checked. A row that fails its check is left as it was and reported; the other rows still save.
export async function saveWeekAssignments(formData: FormData) {
  const week = validWeekStart(field(formData, 'week'), todayBusiness());
  const { supabase } = await requireManager();

  const { data: rows, error } = await supabase
    .from('parties')
    .select('id, party_date, start_time, end_time, assigned_host, assignment_locked')
    .gte('party_date', week)
    .lte('party_date', addDays(week, 6))
    .eq('status', 'active');
  if (error) back(week, 'assignment_failed');

  const dbRows: DbRow[] = (rows ?? []).map((r) => ({
    id: Number(r.id),
    party_date: String(r.party_date),
    start_time: String(r.start_time),
    end_time: String(r.end_time),
    assigned_host: (r.assigned_host as string | null) ?? null,
    assignment_locked: Boolean(r.assignment_locked),
  }));

  // The values posted for each row. A host id that is not a UUID leaves that row alone.
  const posted = new Map<number, PostedRow>();
  for (const p of dbRows) {
    const raw = formData.get(`host_${p.id}`);
    if (typeof raw !== 'string') continue;
    const host = raw === '' ? null : UUID.test(raw) ? raw : undefined;
    if (host === undefined) continue;
    posted.set(p.id, { host, locked: formData.get(`locked_${p.id}`) === 'on' });
  }

  const changed = new Set(changedPartyIds(dbRows, posted));
  let blocked = 0;
  let unavailable = 0;
  for (const p of dbRows) {
    if (!changed.has(p.id)) continue;
    const row = posted.get(p.id);
    if (!row) continue;
    if (row.locked && row.host === null) {
      blocked += 1;
      continue;
    }
    const verdict =
      row.host === null
        ? 'ok'
        : await checkManualHost(supabase, p, row.host, formData.get(`override_${p.id}`) === 'on');
    if (verdict === 'blocked') {
      blocked += 1;
      continue;
    }
    if (verdict === 'unavailable') unavailable += 1;
    const { error: updateError } = await supabase
      .from('parties')
      .update({ assigned_host: row.host, assignment_locked: row.locked })
      .eq('id', p.id);
    if (updateError) blocked += 1;
  }

  if (blocked > 0) back(week, 'week_partial');
  if (unavailable > 0) back(week, 'week_saved_unavailable');
  back(week, 'week_saved');
}
