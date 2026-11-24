// Reads what the engine needs for one week. Read-only: nothing is written here.
// Runs with the signed-in manager's session, so RLS limits what can be read.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { EngineSettings, Host, HistoryParty, Offer, Party, Tier } from './engine';
import { addDays } from './parties';

export type WeekInput = {
  parties: Party[];
  hosts: (Host & { fullName: string })[];
  history: HistoryParty[];
  offers: Offer[];
  settings: EngineSettings;
  revealTime: string;
};

type PartyDb = {
  id: number;
  party_date: string;
  start_time: string;
  end_time: string;
  kids_count: number;
  party_type: 'bowling' | 'other';
  assigned_host: string | null;
  assignment_locked: boolean;
};

const clock = (t: string) => t.slice(0, 5); // "14:00:00" -> "14:00"

export async function loadWeekInput(
  supabase: SupabaseClient,
  monday: string,
  today: string,
  nowClock: string,
): Promise<WeekInput> {
  const sunday = addDays(monday, 6);

  const settingsRes = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['fairness_window_days', 'hostess_avg_allowance_pct', 'bowling_server_only_after', 'reveal_time']);
  const s = new Map((settingsRes.data ?? []).map((r) => [r.key as string, r.value]));
  const windowDays = Number(s.get('fairness_window_days') ?? 30);
  const revealTime = String(s.get('reveal_time') ?? '08:00').replace(/"/g, '');
  const settings: EngineSettings = {
    windowDays,
    hostessAllowancePct: Number(s.get('hostess_avg_allowance_pct') ?? 25),
    bowlingServerAfter: String(s.get('bowling_server_only_after') ?? '18:00').replace(/"/g, ''),
  };

  const [partiesRes, hostsRes, availRes, histRes] = await Promise.all([
    supabase
      .from('parties')
      .select('id, party_date, start_time, end_time, kids_count, party_type, assigned_host, assignment_locked')
      .eq('status', 'active')
      .gte('party_date', monday)
      .lte('party_date', sunday),
    supabase.from('profiles').select('id, full_name, tier').eq('status', 'active').not('tier', 'is', null),
    // Availability for the target week and every earlier week that reaches into the fairness window.
    supabase
      .from('availability')
      .select('profile_id, week_start, day_of_week, start_time, end_time')
      .gte('week_start', addDays(monday, -(windowDays + 6)))
      .lte('week_start', monday),
    supabase
      .from('parties')
      .select('assigned_host, party_date, start_time, end_time, kids_count')
      .eq('status', 'active')
      .not('assigned_host', 'is', null)
      .gte('party_date', addDays(monday, -windowDays))
      .lt('party_date', monday),
  ]);

  const parties: Party[] = ((partiesRes.data ?? []) as PartyDb[]).map((p) => {
    const reveal = p.party_date < today || (p.party_date === today && nowClock >= revealTime);
    return {
      id: String(p.id),
      date: p.party_date,
      start: clock(p.start_time),
      end: clock(p.end_time),
      kids: p.kids_count,
      type: p.party_type,
      fixed: p.assignment_locked || reveal,
      assignedHost: p.assigned_host,
    };
  });

  const hosts = (hostsRes.data ?? []).map((h) => ({
    id: h.id as string,
    fullName: (h.full_name as string) || 'Unnamed host',
    name: (h.full_name as string) || (h.id as string),
    tier: h.tier as Tier,
    availability: [] as { date: string; start: string; end: string }[],
  }));
  const byId = new Map(hosts.map((h) => [h.id, h]));
  const offers: Offer[] = [];
  for (const a of availRes.data ?? []) {
    const weekStart = a.week_start as string;
    const date = addDays(weekStart, (a.day_of_week as number) - 1);
    const hostId = a.profile_id as string;
    if (!byId.has(hostId)) continue;
    offers.push({ hostId, date });
    if (weekStart === monday) {
      byId.get(hostId)?.availability.push({
        date,
        start: clock(a.start_time as string),
        end: clock(a.end_time as string),
      });
    }
  }

  const history: HistoryParty[] = ((histRes.data ?? []) as {
    assigned_host: string;
    party_date: string;
    start_time: string;
    end_time: string;
    kids_count: number;
  }[]).map((r) => ({
    hostId: r.assigned_host,
    date: r.party_date,
    start: clock(r.start_time),
    end: clock(r.end_time),
    kids: r.kids_count,
  }));

  return { parties, hosts, history, offers, settings, revealTime };
}
