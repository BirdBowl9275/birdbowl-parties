import type { Metadata } from 'next';
import Link from 'next/link';
import { requireScheduleView } from '@/lib/manager-guard';
import { reassignParty, saveProposedAssignments } from '../actions';
import { fairnessSummary, formatClock } from '@/lib/fairness';
import { addDays, nowClockBusiness, todayBusiness, validWeekStart, weekDays } from '@/lib/parties';
import { assignWeek } from '@/lib/engine';
import { loadWeekInput } from '@/lib/engine-data';
import { PartyType } from '../../components/party-type';
import { MessageBanner } from '../../components/message-banner';
import { one } from '@/lib/admin-messages';
import { scheduleBanner } from '@/lib/page-messages';
import { Check, ChevronLeft, ChevronRight, CircleAlert, Info, Lock, LockOpen, TriangleAlert } from '../../components/icons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Weekly schedule' };

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

// "Saturday, Nov 28" from a YYYY-MM-DD key. UTC so the day never shifts with the server's zone.
function dayHeading(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

// "Nov 23 – 29, 2026" (or "Nov 28 – Dec 4, 2026") from the Monday and Sunday keys. Display only.
function weekLabel(first: string, last: string): string {
  const fmt = (d: string, o: Intl.DateTimeFormatOptions) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { ...o, timeZone: 'UTC' });
  const sameMonth = first.slice(0, 7) === last.slice(0, 7);
  const start = fmt(first, { month: 'short', day: 'numeric' });
  const end = sameMonth ? fmt(last, { day: 'numeric' }) : fmt(last, { month: 'short', day: 'numeric' });
  const year = fmt(last, { year: 'numeric' });
  return `${start} \u2013 ${end}, ${year}`;
}

type HostRow = { id: string; full_name: string; tier: number };

export default async function ManagerSchedulePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  // Single values only: a repeated key arrives as a list (security review WEB-BULK-07).
  const [weekParam, msg, previewParam, n] = [sp.week, sp.msg, sp.preview, sp.n].map(one);
  // Managers and admins can edit; viewers (read-only) see the same week without any controls.
  // Every write action still calls requireManager(), and RLS blocks viewer writes.
  const { supabase, readOnly } = await requireScheduleView();

  const today = todayBusiness();
  const monday = validWeekStart(weekParam, today);
  const days = weekDays(monday);

  // Preview only: runs the engine on the week and shows the proposed hosts. Nothing is saved.
  // Not offered to viewers: it reads staff availability, which viewers may not see.
  let previewInput: Awaited<ReturnType<typeof loadWeekInput>> | null = null;
  let preview: ReturnType<typeof assignWeek> | null = null;
  if (previewParam === '1' && !readOnly) {
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
    // Viewers cannot read the profiles table; schedule_hosts() returns only these four columns.
    readOnly
      ? supabase.rpc('schedule_hosts')
      : supabase
          .from('profiles')
          .select('id, full_name, tier')
          .eq('status', 'active')
          .not('tier', 'is', null)
          .order('full_name'),
    supabase.from('settings').select('key, value').in('key', ['fairness_window_days', 'reveal_time']),
  ]);

  const parties = (partiesRes.data ?? []) as PartyRow[];
  const hosts = (hostsRes.data ?? []) as HostRow[];
  const settingValues = new Map((settingRes.data ?? []).map((r) => [r.key as string, r.value]));
  const windowDays = Number(settingValues.get('fairness_window_days') ?? 30);
  // A party is revealed (and so fixed) from the reveal time on its day, the same rule as the engine.
  const revealTime = String(settingValues.get('reveal_time') ?? '08:00').replace(/"/g, '');
  const nowClock = nowClockBusiness();
  const isLocked = (p: PartyRow) =>
    p.assignment_locked || p.party_date < today || (p.party_date === today && nowClock >= revealTime);
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

  const previewRows =
    previewInput && preview
      ? previewInput.parties.map((p) => {
          const a = preview!.assignments.find((x) => x.partyId === p.id);
          const host = a ? previewInput!.hosts.find((h) => h.id === a.hostId) : undefined;
          return { p, host };
        })
        // Display order only: by date, then start time. The engine data is untouched.
        .sort((a, b) => a.p.date.localeCompare(b.p.date) || a.p.start.localeCompare(b.p.start))
      : [];

  const hostPill = (host: { fullName: string } | undefined, fixed: boolean) => (
    <>
      {host ? (
        host.fullName
      ) : (
        <span className="pill pill-danger">
          <TriangleAlert />
          Find a hostess
        </span>
      )}
      {fixed ? (
        <>
          {' '}
          <span className="pill pill-neutral">
            <Lock />
            Fixed
          </span>
        </>
      ) : null}
    </>
  );

  // Time, customer, kids and type: the same in the editable and the read-only row.
  const infoCells = (p: PartyRow) => (
    <>
      <div role="cell" className="pcell pcell-time">
        <span className="plabel" aria-hidden="true">Time</span>
        {formatClock(p.start_time)}–{formatClock(p.end_time)}
      </div>
      <div role="cell" className="pcell pcell-customer">
        <span className="plabel" aria-hidden="true">Customer</span>
        <strong>{p.customer_name}</strong>
        <span className="pills">
          {p.assigned_host ? (
            <span className="pill pill-success">
              <Check />
              Covered
            </span>
          ) : (
            <span className="pill pill-warning">
              <CircleAlert />
              Find a hostess
            </span>
          )}
          {isLocked(p) ? (
            <span className="pill pill-neutral">
              <Lock />
              Locked
            </span>
          ) : null}
        </span>
      </div>
      <div role="cell" className="pcell pcell-kids">
        <span className="plabel" aria-hidden="true">Kids</span>
        {p.kids_count}
      </div>
      <div role="cell" className="pcell pcell-type">
        <span className="plabel" aria-hidden="true">Type</span>
        <PartyType type={p.party_type} />
      </div>
    </>
  );

  return (
    <section className="sched" aria-labelledby="schedule-title">
      <div className="sched-head">
        <h1 id="schedule-title">Weekly schedule</h1>
        <div className="sched-actions">
          <nav className="weeknav" aria-label="Week">
            <Link href={`/manager/schedule?week=${addDays(monday, -7)}`}>
              <ChevronLeft />
              <span className="vh-md">Previous week</span>
            </Link>
            <span className="week-label">Week of {weekLabel(monday, days[6])}</span>
            <Link href={`/manager/schedule?week=${addDays(monday, 7)}`}>
              <span className="vh-md">Next week</span>
              <ChevronRight />
            </Link>
          </nav>
          {readOnly ? (
            <span className="pill pill-neutral">View only</span>
          ) : (
            <>
              <Link className="btn btn-secondary" href="/invite">
                Invite someone
              </Link>
              <Link className="btn" href={`/manager/schedule?week=${monday}&preview=1`}>
                Preview the assignment for this week
              </Link>
            </>
          )}
        </div>
      </div>
      <MessageBanner banner={scheduleBanner(msg, n)} />
      {partiesRes.error ? (
        <div className="banner banner-danger" role="alert">
          <CircleAlert />
          <span>Could not load parties.</span>
        </div>
      ) : null}

      {previewInput && preview ? (
        <section className="panel" aria-labelledby="preview-title">
          <h2 id="preview-title">Assignment preview</h2>
          <p className="muted">
            <span className="pill pill-neutral">
              <Info />
              Preview, not saved
            </span>{' '}
            Preview only. Nothing is saved. Locked and revealed parties keep their host.
          </p>
          <div className="data-table-wrap only-table">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Time</th>
                  <th scope="col" className="r">Kids</th>
                  <th scope="col">Type</th>
                  <th scope="col">Proposed host</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map(({ p, host }) => (
                  <tr key={p.id}>
                    <td>{dayHeading(p.date)}</td>
                    <td>{formatClock(p.start)}–{formatClock(p.end)}</td>
                    <td className="r">{p.kids}</td>
                    <td><PartyType type={p.type} /></td>
                    <td>{hostPill(host, Boolean(p.fixed))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="cards only-cards" aria-label="Assignment preview">
            {previewRows.map(({ p, host }) => (
              <li key={p.id}>
                <p className="card-title">{dayHeading(p.date)}, {formatClock(p.start)}–{formatClock(p.end)}</p>
                <p className="muted num">{p.kids} kids · <PartyType type={p.type} /></p>
                <p>
                  <span className="muted">Proposed host: </span>
                  {hostPill(host, Boolean(p.fixed))}
                </p>
              </li>
            ))}
          </ul>
          <form action={saveProposedAssignments}>
            <input type="hidden" name="week" value={monday} />
            <label className="check">
              <input type="checkbox" name="confirm" /> I reviewed this preview. Save these assignments for the
              week. Locked and revealed parties are not changed.
            </label>
            <button type="submit">Save these assignments</button>
          </form>
        </section>
      ) : null}

      <div className="sched-layout">
        <div className="sched-main">
          <div className="phead" aria-hidden="true">
            <span>Time</span>
            <span>Customer</span>
            <span className="r">Kids</span>
            <span>Type</span>
            <span>Host</span>
            <span>Lock</span>
            <span />
          </div>
          {days.map((day) => {
            const dayParties = parties.filter((p) => p.party_date === day);
            return (
              <div key={day} className="day-group">
                <h2 id={`day-${day}`}>
                  {dayHeading(day)}
                  {dayParties.length > 0 ? <span className="day-count"><span className="vh">, </span>{dayParties.length} {dayParties.length === 1 ? 'party' : 'parties'}</span> : null}
                </h2>
                {dayParties.length === 0 ? <p className="empty">No parties.</p> : null}
                {dayParties.length > 0 ? (
                <div role="table" aria-labelledby={`day-${day}`} className="day-rows">
                <div role="row" className="vh">
                  {['Time', 'Customer', 'Kids', 'Type', 'Host', 'Lock', ...(readOnly ? [] : ['Save'])].map((c) => (
                    <span key={c} role="columnheader">{c}</span>
                  ))}
                </div>
                {dayParties.map((p) => readOnly ? (
                  <div key={p.id} role="row" className="prow" aria-label={p.customer_name}>
                    {infoCells(p)}
                    <div role="cell" className="pcell pcell-host">
                      <span className="plabel" aria-hidden="true">Host</span>
                      {p.assigned_host ? hostName.get(p.assigned_host) ?? 'Assigned host' : 'Find a hostess'}
                    </div>
                    <div role="cell" className="pcell pcell-lock">
                      <span className="plabel" aria-hidden="true">Lock</span>
                      {isLocked(p) ? 'Locked' : <span className="muted">Not locked</span>}
                    </div>
                  </div>
                ) : (
                  <form key={p.id} action={reassignParty} role="row" className="prow" aria-label={`Assign ${p.customer_name}`}>
                    <input type="hidden" name="party_id" value={p.id} />
                    <input type="hidden" name="week" value={monday} />
                    {infoCells(p)}
                    <label role="cell" className="pcell pcell-host">
                      <span className="plabel">Host</span>
                      <select name="host_id" defaultValue={p.assigned_host ?? ''}>
                        <option value="">Not assigned</option>
                        {hosts.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.full_name || 'Unnamed host'} (tier {h.tier})
                          </option>
                        ))}
                      </select>
                    </label>
                    <div role="cell" className="pcell pcell-lock">
                      <label className="lockchip">
                        <input type="checkbox" name="locked" defaultChecked={p.assignment_locked} />
                        <span className="ic-off" aria-hidden="true"><LockOpen /></span>
                        <span className="ic-on" aria-hidden="true"><Lock /></span>
                        <span className="txt">Lock<span className="hide-lg"> by hand</span></span>
                      </label>
                      <label className="lockchip">
                        <input type="checkbox" name="override_shift" />
                        <span className="txt">Override schedule conflict</span>
                      </label>
                    </div>
                    <div role="cell" className="pcell pcell-save">
                      <button type="submit" className="secondary btn-secondary">Save<span className="vh"> assignment</span></button>
                    </div>
                  </form>
                ))}
                </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <aside className="sched-rail" aria-labelledby="fairness-title">
          <h2 id="fairness-title">Fairness, last {windowDays} days</h2>
          {summary.length === 0 ? <p className="empty">No hosts yet.</p> : null}
          {summary.length > 0 ? (
            <>
              <div className="data-table-wrap only-table">
                <table className="data">
                  <thead>
                    <tr>
                      <th scope="col">Host</th>
                      <th scope="col" className="r">Parties</th>
                      <th scope="col" className="r">Total kids</th>
                      <th scope="col" className="r">Average kids</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((s) => (
                      <tr key={s.hostId}>
                        <th scope="row">{hostName.get(s.hostId)}</th>
                        <td className="r">{s.parties}</td>
                        <td className="r">{s.totalKids}</td>
                        <td className="r">{s.averageKids === null ? <><span aria-hidden="true">–</span><span className="vh">No parties</span></> : s.averageKids.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="cards only-cards" aria-label="Fairness by host">
                {summary.map((s) => (
                  <li key={s.hostId}>
                    <p className="card-title">{hostName.get(s.hostId)}</p>
                    <dl className="stats">
                      <div>
                        <dt>Parties</dt>
                        <dd>{s.parties}</dd>
                      </div>
                      <div>
                        <dt>Total kids</dt>
                        <dd>{s.totalKids}</dd>
                      </div>
                      <div>
                        <dt>Average kids</dt>
                        <dd>{s.averageKids === null ? <><span aria-hidden="true">–</span><span className="vh">No parties</span></> : s.averageKids.toFixed(1)}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
