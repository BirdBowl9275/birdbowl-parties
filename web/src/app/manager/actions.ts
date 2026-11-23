'use server';

import { redirect } from 'next/navigation';
import { requireManager } from '@/lib/manager-guard';
import { validWeekStart, todayBusiness, nowClockBusiness } from '@/lib/parties';
import { assignWeek } from '@/lib/engine';
import { loadWeekInput } from '@/lib/engine-data';

const PARTY_ID = /^\d+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function back(week: string, message: string): never {
  redirect(`/manager/schedule?week=${encodeURIComponent(week)}&msg=${encodeURIComponent(message)}`);
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
  if (!PARTY_ID.test(partyId)) back(week, 'Unknown party.');

  const hostId = field(formData, 'host_id');
  const locked = field(formData, 'locked') === 'on';
  if (hostId !== '' && !UUID.test(hostId)) back(week, 'Pick a valid host.');
  if (locked && hostId === '') back(week, 'Pick a host before locking a party.');

  const { data, error } = await supabase
    .from('parties')
    .update({
      assigned_host: hostId === '' ? null : hostId,
      assignment_locked: locked,
    })
    .eq('id', Number(partyId))
    .select('id');
  if (error) back(week, 'Could not save that assignment.');
  if (!data || data.length === 0) back(week, 'That party was not found.');
  back(week, 'Assignment saved.');
}

// Saves what the engine proposes for the week, after a manager has reviewed the preview.
// The server recalculates the proposal itself, so no host ids come from the browser.
// Fixed parties (manager-locked or already revealed) are never changed.
export async function saveProposedAssignments(formData: FormData) {
  const week = validWeekStart(field(formData, 'week'), todayBusiness());
  if (field(formData, 'confirm') !== 'on') {
    back(week, 'Tick the box to confirm you reviewed the preview.');
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
    if (error) back(week, `Stopped after saving ${saved} assignment(s). Check the preview and try again.`);
    saved += 1;
  }
  back(week, `Saved ${saved} assignment(s).`);
}
