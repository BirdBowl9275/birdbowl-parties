import Link from 'next/link';
import { requireManager } from '@/lib/manager-guard';
import { addDays, todayBusiness, validWeekStart } from '@/lib/parties';
import { buildConflictReport, type ReportShift } from '@/lib/conflict-report';
import { formatClock } from '@/lib/fairness';

export const dynamic = 'force-dynamic';

// Read-only. Shows each hostess's weekly hours, conflicts and the 30-minute gap for every party
// this week. It never assigns anyone and never writes to any table.

const clock = (t: string) => t.slice(0, 5);
const hours = (n: number) => `${n.toFixed(1)} h`;

export default async function ConflictReportPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const sp = await searchParams;
  const { supabase } = await requireManager();

  const today = todayBusiness();
  const monday = validWeekStart(sp.week, today);
  const sunday = addDays(monday, 6);

  const [partiesRes, hostsRes, shiftsRes] = await Promise.all([
    supabase
      .from('parties')
      .select('id, party_date, start_time, end_time, assigned_host')
      .eq('status', 'active')
      .gte('party_date', monday)
      .lte('party_date', sunday)
      .order('party_date')
      .order('start_time'),
    supabase.from('profiles').select('id, full_name').eq('status', 'active').eq('tier', 1).order('full_name'),
    supabase
      .from('staff_shifts')
      .select('profile_id, staff_name, tier, shift_date, start_time, end_time, end_next_day')
      .eq('week_start', monday),
  ]);

  const parties = (partiesRes.data ?? []).map((p) => ({
    id: p.id as number,
    date: p.party_date as string,
    start: clock(p.start_time as string),
    end: clock(p.end_time as string),
    assigned: (p.assigned_host as string | null) ?? null,
  }));
  const hosts = (hostsRes.data ?? []).map((h) => ({ id: h.id as string, name: (h.full_name as string) || 'Unnamed host' }));
  const shifts: ReportShift[] = (shiftsRes.data ?? []).map((s) => ({
    profileId: (s.profile_id as string | null) ?? null,
    staffName: s.staff_name as string,
    tier: s.tier as 1 | 2 | 3,
    date: s.shift_date as string,
    start: clock(s.start_time as string),
    end: clock(s.end_time as string),
    endNextDay: Boolean(s.end_next_day),
  }));

  const report = buildConflictReport({
    parties: parties.map(({ id, date, start, end }) => ({ id, date, start, end })),
    hosts,
    shifts,
    assignments: parties
      .filter((p) => p.assigned)
      .map((p) => ({ partyId: p.id, hostId: p.assigned as string })),
  });

  return (
    <section className="card wide" aria-labelledby="conflicts-title">
      <h1 id="conflicts-title">Conflict report</h1>
      <p>
        Read-only. Shows each hostess&apos;s hours, conflicts and the 30-minute gap for every party this
        week. Nothing on this page changes an assignment.
      </p>

      <nav className="week-nav" aria-label="Week">
        <Link href={`/manager/conflicts?week=${addDays(monday, -7)}`}>Previous week</Link>
        <span>Week of {monday}</span>
        <Link href={`/manager/conflicts?week=${addDays(monday, 7)}`}>Next week</Link>
      </nav>

      <h2>Hours this week</h2>
      <p className="muted">Lowest first. The cap is 38 hours; staff under 32 are offered first.</p>
      <div className="table-wrap">
        <table className="fairness">
          <thead>
            <tr>
              <th scope="col">Hostess</th>
              <th scope="col">Scheduled hours</th>
            </tr>
          </thead>
          <tbody>
            {report.hostHours.length === 0 ? (
              <tr>
                <td colSpan={2}>No hostesses found.</td>
              </tr>
            ) : (
              report.hostHours.map((h) => (
                <tr key={h.hostId}>
                  <td>{h.name}</td>
                  <td>{hours(h.hours)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {report.unmatchedShiftNames.length > 0 ? (
        <>
          <h2>Shifts not matched to an app account</h2>
          <p className="muted">These HotSchedules names do not match a hostess account, so their hours are not counted.</p>
          <ul>
            {report.unmatchedShiftNames.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </>
      ) : null}

      {report.parties.length === 0 ? (
        <p>No active parties this week.</p>
      ) : (
        report.parties.map(({ party, candidates }) => (
          <div key={party.id}>
            <h2>
              {party.date} · {formatClock(party.start)}–{formatClock(party.end)}
            </h2>
            <div className="table-wrap">
              <table className="fairness">
                <thead>
                  <tr>
                    <th scope="col">Hostess</th>
                    <th scope="col">Hours now</th>
                    <th scope="col">Arrive</th>
                    <th scope="col">Eligible</th>
                    <th scope="col">Why not</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr key={c.hostId}>
                      <td>{c.name}</td>
                      <td>{hours(c.hours)}</td>
                      <td>{c.arrival}</td>
                      <td>{c.eligible ? 'Yes' : 'No'}</td>
                      <td>{c.reasons.join(' ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
