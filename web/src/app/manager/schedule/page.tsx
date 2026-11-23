import Link from 'next/link';
import { requireManager } from '@/lib/manager-guard';
import { reassignParty, saveProposedAssignments } from '../actions';
import { fairnessSummary, formatClock } from '@/lib/fairness';
import { addDays, nowClockBusiness, todayBusiness, validWeekStart, weekDays } from '@/lib/parties';
import { assignWeek } from '@/lib/engine';
import { loadWeekInput } from '@/lib/engine-data';

export const dynamic = 'force-dynamic';

type PartyRow = {
  id: number;
  party_date: string;
  start_time: string;
  end_time: string;
  kids_count: number;
  party_type: string;
  customer_name: string;
  status: string;
  assigned_host: string | null;
  assignment_locked: boolean;
};

type HostRow = { id: string; full_name: string; tier: number; daily_cap: number };

export default async function ManagerSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; msg?: string; preview?: string }>;
}) {
  const { week: weekParam, msg, preview: previewParam } = await searchParams;
  const { supabase } = await requireManager();

  const today = todayBusiness();
  const monday = validWeekStart(weekParam, today);
  const days = weekDays(monday);

  // Preview only: runs the engine on the week and shows the proposed hosts. Nothing is saved.
  let previewInput: Awaited<ReturnType<typeof loadWeekInput>> | null = null;
  let preview: ReturnType<typeof assignWeek> | null = null;
  if (previewParam === '1') {
    previewInput = await loadWeekInput(supabase, monday, today, nowClockBusiness());
    preview = assignWeek(
      previewInput.parties,
      previewInput.hosts,
      previewInput.history,
      previewInput.settings,
      previewInput.offers,
    );
  }

  const [partiesRes, hostsRes, settingRes] = await Promise.all([
    supabase
      .from('parties')
      .select('id, party_date, start_time, end_time, kids_count, party_type, customer_name, status, assigned_host, assignment_locked')
      .gte('party_date', monday)
      .lte('party_date', days[6])
      .eq('status', 'active')
      .order('party_date')
      .order('start_time'),
    supabase
      .from('profiles')
      .select('id, full_name, tier, daily_cap')
      .eq('status', 'active')
      .not('tier', 'is', null)
      .order('full_name'),
    supabase.from('settings').select('value').eq('key', 'fairness_window_days').maybeSingle(),
  ]);

  const parties = (partiesRes.data ?? []) as PartyRow[];
  const hosts = (hostsRes.data ?? []) as HostRow[];
  const windowDays = Number(settingRes.data?.value ?? 30);
  const hostName = new Map(hosts.map((h) => [h.id, h.full_name || 'Unnamed host']));

  // Fairness summary: parties and kids per host over the window ending today.
  const { data: windowParties } = await supabase
    .from('parties')
    .select('assigned_host, party_date, kids_count')
    .eq('status', 'active')
    .not('assigned_host', 'is', null)
    .gte('party_date', addDays(today, -windowDays))
    .lte('party_date', today);
  const summary = fairnessSummary(
    (windowParties ?? []).map((p) => ({
      hostId: p.assigned_host as string,
      date: p.party_date as string,
      kids: p.kids_count as number,
    })),
    hosts.map((h) => h.id),
    today,
    windowDays,
  );

  return (
    <section className="card wide" aria-labelledby="schedule-title">
      <nav className="week-nav" aria-label="Week">
        <Link href={`/manager/schedule?week=${addDays(monday, -7)}`}>Previous week</Link>
        <span>Week of {monday}</span>
        <Link href={`/manager/schedule?week=${addDays(monday, 7)}`}>Next week</Link>
      </nav>
      <h1 id="schedule-title">Weekly schedule</h1>
      <p>
        <Link href={`/manager/schedule?week=${monday}&preview=1`}>Preview the assignment for this week</Link>
      </p>
      {msg ? <p role="status">{msg}</p> : null}

      {previewInput && preview ? (
        <>
          <h2>Assignment preview</h2>
          <p className="muted">Preview only. Nothing is saved. Locked and revealed parties keep their host.</p>
          <div className="table-wrap">
            <table className="fairness">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Time</th>
                  <th scope="col">Kids</th>
                  <th scope="col">Type</th>
                  <th scope="col">Proposed host</th>
                </tr>
              </thead>
              <tbody>
                {previewInput.parties.map((p) => {
                  const a = preview!.assignments.find((x) => x.partyId === p.id);
                  const host = a ? previewInput!.hosts.find((h) => h.id === a.hostId) : undefined;
                  return (
                    <tr key={p.id}>
                      <td>{p.date}</td>
                      <td>{formatClock(p.start)} to {formatClock(p.end)}</td>
                      <td>{p.kids}</td>
                      <td>{p.type}</td>
                      <td>
                        {host ? host.fullName : 'No eligible host'}
                        {p.fixed ? <span className="muted"> (fixed)</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <form action={saveProposedAssignments} className="user-row">
            <input type="hidden" name="week" value={monday} />
            <label className="check">
              <input type="checkbox" name="confirm" /> I reviewed this preview. Save these assignments for the
              week. Locked and revealed parties are not changed.
            </label>
            <button type="submit">Save these assignments</button>
          </form>
        </>
      ) : null}
      {partiesRes.error ? <p className="notice" role="alert">Could not load parties.</p> : null}

      <h2>Fairness, last {windowDays} days</h2>
      <div className="table-wrap">
        <table className="fairness">
          <thead>
            <tr>
              <th scope="col">Host</th>
              <th scope="col">Parties</th>
              <th scope="col">Total kids</th>
              <th scope="col">Average kids</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((s) => (
              <tr key={s.hostId}>
                <td>{hostName.get(s.hostId)}</td>
                <td>{s.parties}</td>
                <td>{s.totalKids}</td>
                <td>{s.averageKids === null ? '–' : s.averageKids.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {days.map((day) => {
        const dayParties = parties.filter((p) => p.party_date === day);
        return (
          <div key={day} className="day">
            <h2>{day}</h2>
            {dayParties.length === 0 ? <p className="muted">No parties.</p> : null}
            {dayParties.map((p) => (
              <form key={p.id} action={reassignParty} className="user-row" aria-label={`Assign ${p.customer_name}`}>
                <input type="hidden" name="party_id" value={p.id} />
                <input type="hidden" name="week" value={monday} />
                <p className="user-name">
                  <strong>{p.customer_name}</strong>{' '}
                  <span className="muted">
                    {formatClock(p.start_time)}–{formatClock(p.end_time)} · {p.kids_count} kids · {p.party_type}
                  </span>
                </p>
                <div className="fields">
                  <label>
                    Host
                    <select name="host_id" defaultValue={p.assigned_host ?? ''}>
                      <option value="">Not assigned</option>
                      {hosts.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.full_name || 'Unnamed host'} (tier {h.tier})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="check">
                    <input type="checkbox" name="locked" defaultChecked={p.assignment_locked} /> Lock by hand
                  </label>
                </div>
                <button type="submit">Save assignment</button>
              </form>
            ))}
          </div>
        );
      })}
    </section>
  );
}
