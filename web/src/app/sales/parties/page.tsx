import type { Metadata } from 'next';
import Link from 'next/link';
import { requirePartiesView } from '@/lib/sales-guard';
import { createParty, cancelParty, updateParty } from '../actions';
import { addDays, PARTY_TYPES, todayBusiness, validWeekStart, weekDays } from '@/lib/parties';
import { formatClock } from '@/lib/fairness';
import { Ban, Check, ChevronLeft, ChevronRight, CircleAlert } from '../../components/icons';
import { PartyType, PARTY_TYPE_LABEL } from '../../components/party-type';
import { CancelParty } from './cancel-party';
import { MessageBanner } from '../../components/message-banner';
import { one } from '@/lib/admin-messages';
import { salesBanner } from '@/lib/page-messages';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Parties list' };

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
  return `${start} – ${end}, ${year}`;
}

type Row = {
  id: number;
  party_date: string;
  start_time: string;
  end_time: string;
  kids_count: number;
  party_type: string;
  customer_name: string;
  notes: string;
  status: string;
  assigned_host: string | null;
};

export default async function SalesPartiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  // Single values only: a repeated key arrives as a list (security review WEB-BULK-07).
  const weekParam = one(sp.week);
  const msg = one(sp.msg);
  // Viewers see the list without any controls. Every write action still calls
  // requireSalesAccess(), and RLS blocks viewer writes.
  const { supabase, readOnly } = await requirePartiesView();

  const monday = validWeekStart(weekParam, todayBusiness());
  const days = weekDays(monday);
  const sunday = days[6];

  const { data, error } = await supabase
    .from('parties')
    .select('id, party_date, start_time, end_time, kids_count, party_type, customer_name, notes, status, assigned_host')
    .gte('party_date', monday)
    .lte('party_date', sunday)
    .order('party_date', { ascending: true })
    .order('start_time', { ascending: true });

  const rows = (data ?? []) as Row[];

  return (
    <section className="sched sales" aria-labelledby="parties-title">
      <div className="sched-head">
        <h1 id="parties-title">Parties</h1>
        <div className="sched-actions">
          <nav className="weeknav" aria-label="Week">
            <Link href={`/sales/parties?week=${addDays(monday, -7)}`}>
              <ChevronLeft />
              <span className="vh-md">Previous week</span>
            </Link>
            <span className="week-label">Week of {weekLabel(monday, sunday)}</span>
            <Link href={`/sales/parties?week=${addDays(monday, 7)}`}>
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
              <a className="btn add-jump" href="#add-party">
                Add a party
              </a>
            </>
          )}
        </div>
      </div>
      <MessageBanner banner={salesBanner(msg)} />
      {error ? (
        <div className="banner banner-danger" role="alert">
          <CircleAlert />
          <span>Could not load parties.</span>
        </div>
      ) : null}

      <div className={readOnly ? 'sched-layout sales-layout sales-layout-readonly' : 'sched-layout sales-layout'}>
        <div className="sched-main">
          {days.map((day) => {
            const dayRows = rows.filter((r) => r.party_date === day);
            return (
              <div key={day} className="day-group">
                <h2 id={`day-${day}`}>
                  {dayHeading(day)}
                  {dayRows.length > 0 ? (
                    <span className="day-count">
                      <span className="vh">, </span>
                      {dayRows.length} {dayRows.length === 1 ? 'party' : 'parties'}
                    </span>
                  ) : null}
                </h2>
                {dayRows.length === 0 ? <p className="empty">No parties.</p> : null}
                {dayRows.length > 0 ? (
                  <ul className="party-list" aria-labelledby={`day-${day}`}>
                    {dayRows.map((r) => {
                      const cancelled = r.status === 'cancelled';
                      return (
                        <li key={r.id} className={cancelled ? 'party-item cancelled' : 'party-item'}>
                          <div className="party-main">
                            <p className="party-time num">
                              {formatClock(r.start_time.slice(0, 5))}–{formatClock(r.end_time.slice(0, 5))}
                            </p>
                            <div className="party-who">
                              <strong>{r.customer_name}</strong>
                              <span className="pills">
                                {r.assigned_host ? (
                                  <span className="pill pill-success">
                                    <Check />
                                    Covered
                                  </span>
                                ) : (
                                  <span className="pill pill-warning">
                                    <CircleAlert />
                                    Not assigned
                                  </span>
                                )}
                                {cancelled ? (
                                  <span className="pill pill-neutral">
                                    <Ban />
                                    Cancelled
                                  </span>
                                ) : null}
                              </span>
                            </div>
                            <p className="party-kids num">{r.kids_count} kids</p>
                            <p className="party-type"><PartyType type={r.party_type} /></p>
                            <div className="party-cancel">
                              {cancelled || readOnly ? null : (
                                <CancelParty action={cancelParty} id={r.id} week={monday} customer={r.customer_name} />
                              )}
                            </div>
                          </div>
                          {cancelled || readOnly ? null : (
                            <details className="edit-fold">
                              <summary>
                                <ChevronRight />
                                <span>
                                  Edit<span className="vh"> {r.customer_name}</span>
                                </span>
                              </summary>
                              <PartyForm action={updateParty} week={monday} party={r} />
                            </details>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>

        {readOnly ? null : (
          <aside id="add-party" className="sched-rail panel add-panel" aria-labelledby="add-title" tabIndex={-1}>
            <h2 id="add-title">Add a party</h2>
            <PartyForm action={createParty} week={monday} labelledBy="add-title" />
          </aside>
        )}
      </div>
    </section>
  );
}

function PartyForm({
  action,
  week,
  party,
  labelledBy,
}: {
  action: (formData: FormData) => Promise<void>;
  week: string;
  party?: Row;
  labelledBy?: string;
}) {
  return (
    <form action={action} className="party-form" aria-labelledby={labelledBy}>
      {party ? <input type="hidden" name="id" value={party.id} /> : null}
      <input type="hidden" name="week" value={week} />
      <div className="fields">
        <label>
          Date
          <input name="date" type="date" required defaultValue={party?.party_date ?? week} />
        </label>
        <label>
          Start
          <input name="start_time" type="time" required defaultValue={party?.start_time.slice(0, 5) ?? '17:00'} />
        </label>
        <label>
          End
          <input name="end_time" type="time" required defaultValue={party?.end_time.slice(0, 5) ?? '19:00'} />
        </label>
        <label>
          Kids
          <input name="kids" type="number" min={0} max={200} required defaultValue={party?.kids_count ?? 0} />
        </label>
        <label>
          Type
          <select name="party_type" defaultValue={party?.party_type ?? 'bowling'}>
            {PARTY_TYPES.map((t) => (
              <option key={t} value={t}>{PARTY_TYPE_LABEL[t] ?? t}</option>
            ))}
          </select>
        </label>
        <label>
          Customer
          <input name="customer_name" type="text" maxLength={120} required defaultValue={party?.customer_name ?? ''} />
        </label>
      </div>
      <label>
        Notes
        <input name="notes" type="text" maxLength={500} defaultValue={party?.notes ?? ''} />
      </label>
      <button type="submit" className={party ? 'btn-secondary' : undefined}>{party ? 'Save party' : 'Add party'}</button>
    </form>
  );
}
