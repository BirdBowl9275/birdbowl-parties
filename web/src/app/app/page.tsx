import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatClock } from '@/lib/fairness';
import { addDays, todayBusiness } from '@/lib/parties';

export const dynamic = 'force-dynamic';

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

  return (
    <section className="card wide" aria-labelledby="app-title">
      <h1 id="app-title">Your schedule</h1>
      <p>Your party time slots for the next two weeks. Details appear on the morning of each party.</p>
      {error ? <p className="notice" role="alert">Could not load your schedule.</p> : null}
      {!error && rows.length === 0 ? <p>No upcoming parties.</p> : null}

      {rows.map((r) => (
        <div key={r.party_id} className="user-row">
          <p className="user-name">
            <strong>
              Party, {weekdayLabel(r.party_date)} {formatClock(r.start_time)} to {formatClock(r.end_time)}
            </strong>
          </p>
          {r.revealed ? (
            <p className="muted">
              {r.customer_name} · {r.kids_count} kids · {r.party_type}
              {r.notes ? ` · ${r.notes}` : ''}
            </p>
          ) : (
            <p className="muted">Details shown on the morning of the party.</p>
          )}
        </div>
      ))}

      <form action="/auth/signout" method="post">
        <button type="submit" className="secondary">Sign out</button>
      </form>
    </section>
  );
}

function weekdayLabel(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
