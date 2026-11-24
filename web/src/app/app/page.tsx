import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatClock } from '@/lib/fairness';
import { addDays, todayBusiness } from '@/lib/parties';
import { PartyType } from '../components/party-type';
import { CircleAlert, Lock, LockOpen } from '../components/icons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'My schedule' };

type ScheduleRow = {
  party_id: number;
  party_date: string;
  start_time: string;
  end_time: string;
  revealed: boolean;
  party_type: string | null;
  customer_name: string | null;
  kids_count: number | null;
  notes: string | null;
};

// Staff see their own time slots. Party details appear only after the morning reveal.
// The my_schedule function enforces both rules in the database.
export default async function AppHomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = todayBusiness();
  const { data, error } = await supabase.rpc('my_schedule', {
    p_from: today,
    p_to: addDays(today, 14),
  });
  const rows = (data ?? []) as ScheduleRow[];

  // Group by day, keeping the order the database returned. Display only.
  const days: { date: string; rows: ScheduleRow[] }[] = [];
  for (const r of rows) {
    const last = days[days.length - 1];
    if (last && last.date === r.party_date) last.rows.push(r);
    else days.push({ date: r.party_date, rows: [r] });
  }
  const tomorrow = addDays(today, 1);

  return (
    <section className="staff" aria-labelledby="app-title">
      <div className="staff-head">
        <h1 id="app-title">Your schedule</h1>
        <p className="muted">Your party time slots for the next two weeks. Party details appear at 8:00 a.m. on the day of each party, or right away once a manager locks the assignment.</p>
        <p>
          <Link href="/app/availability">Set my availability</Link>
        </p>
      </div>
      {error ? (
        <div className="banner banner-danger" role="alert">
          <CircleAlert />
          <span>Could not load your schedule.</span>
        </div>
      ) : null}
      {!error && rows.length === 0 ? <p className="empty">No upcoming parties.</p> : null}

      {days.map((day) => (
        <div key={day.date} className="day-group staff-day">
          <h2 id={`day-${day.date}`}>
            {day.date === today ? <><span className="staff-when">Today</span><span className="vh">, </span></> : null}
            {day.date === tomorrow ? <><span className="staff-when">Tomorrow</span><span className="vh">, </span></> : null}
            <span className="staff-date">{weekdayLabel(day.date)}</span>
          </h2>
          <ul className="staff-list" aria-labelledby={`day-${day.date}`}>
            {day.rows.map((r) => (
              <li key={r.party_id} className="staff-item">
                <p className="staff-time num">
                  <span className="vh">
                    Party, {weekdayLabel(r.party_date)} {formatClock(r.start_time)} to {formatClock(r.end_time)}
                  </span>
                  <span aria-hidden="true">
                    {formatClock(r.start_time)} to {formatClock(r.end_time)}
                  </span>
                </p>
                {r.revealed ? (
                  <div className="staff-body">
                    <p className="staff-who">
                      <strong>{r.customer_name}</strong>
                      <span className="pill pill-success">
                        <LockOpen />
                        Details shown
                      </span>
                    </p>
                    <p className="staff-meta">
                      <span className="num">{r.kids_count} kids</span> · <PartyType type={r.party_type} />
                    </p>
                    {r.notes ? <p className="staff-notes">{r.notes}</p> : null}
                  </div>
                ) : (
                  <div className="staff-body">
                    <p className="staff-who">
                      <span className="pill pill-neutral">
                        <Lock />
                        Details hidden
                      </span>
                    </p>
                    <p className="staff-meta">Details shown at 8:00 a.m. on the day of the party.</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <form action="/auth/signout" method="post" className="staff-signout">
        <button type="submit" className="btn btn-secondary">
          Sign out
        </button>
      </form>
    </section>
  );
}

// "Saturday, Nov 28". UTC so the day never shifts with the server's zone.
function weekdayLabel(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
