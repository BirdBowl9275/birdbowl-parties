'use server';

import { redirect } from 'next/navigation';
import { requireManager } from '@/lib/manager-guard';
import { validWeekStart, todayBusiness, nowClockBusiness } from '@/lib/parties';
import { assignWeek } from '@/lib/engine';
import { loadWeekInput } from '@/lib/engine-data';
import { resolveHost } from '@/lib/host-resolution';
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
  back(week, 'assignment_saved');
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
  const eligible = new Set(input.hosts.map((h) => h.id));

  let saved = 0;
  for (const p of input.parties) {
    if (p.fixed) continue;
    // Keeps a current host the engine could not replace, so the run never uncovers a party.
    const target = resolveHost(proposed.get(p.id) ?? null, p.assignedHost, eligible);
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
