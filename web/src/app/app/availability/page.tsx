import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DAY_NAMES } from '@/lib/availability';
import { addDays, todayBusiness, validWeekStart } from '@/lib/parties';
import { formatClock } from '@/lib/fairness';
import { saveAvailability } from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'My availability' };

const clock = (t: string) => t.slice(0, 5);

function longDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; msg?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = todayBusiness();
  // Default to next week, the one people are usually setting up.
  const monday = sp.week
    ? validWeekStart(sp.week, today)
    : addDays(validWeekStart(undefined, today), 7);

  const [settingsRes, lockRes, mineRes] = await Promise.all([
    supabase.from('settings').select('key, value').in('key', ['availability_cutoff_dow', 'availability_cutoff_time']),
    supabase.rpc('availability_locked', { p_week_start: monday }),
    supabase.from('availability').select('day_of_week, start_time, end_time').eq('profile_id', user.id).eq('week_start', monday),
  ]);

  const settings = new Map((settingsRes.data ?? []).map((r) => [r.key as string, r.value]));
  const cutoffDow = Number(settings.get('availability_cutoff_dow') ?? 3);
  const cutoffTime = String(settings.get('availability_cutoff_time') ?? '20:00').replace(/"/g, '');
  // Same rule as the database: the cutoff day falls in the week before this one.
  const cutoffDay = addDays(monday, cutoffDow - 1 - 7);
  const cutoffLabel = `${longDate(cutoffDay)} at ${formatClock(cutoffTime)} Eastern`;

  const locked = lockRes.error ? false : lockRes.data === true;
  const mine = new Map(
    (mineRes.data ?? []).map((r) => [Number(r.day_of_week), { start: clock(r.start_time as string), end: clock(r.end_time as string) }]),
  );

  const msg = sp.msg;

  return (
    <section className="card wide" aria-labelledby="availability-title">
      <h1 id="availability-title">My availability</h1>
      <p>
        Mark the times you can work for the week. Changes lock at {cutoffLabel}. After that, ask a manager to change it.
      </p>

      <nav className="week-nav" aria-label="Week">
        <Link href={`/app/availability?week=${addDays(monday, -7)}`}>Previous week</Link>
        <span>Week of {monday}</span>
        <Link href={`/app/availability?week=${addDays(monday, 7)}`}>Next week</Link>
      </nav>

      {msg ? (
        <p role="status" className="muted">
          {msg}
        </p>
      ) : null}
      {locked ? (
        <p className="notice" role="alert">
          This week is locked. Ask a manager to change your availability.
        </p>
      ) : null}

      <form action={saveAvailability}>
        <input type="hidden" name="week" value={monday} />
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          const current = mine.get(day);
          const date = addDays(monday, day - 1);
          return (
            <fieldset key={day} className="day" disabled={locked}>
              <legend>
                {DAY_NAMES[day - 1]}, {longDate(date)}
              </legend>
              <label className="check">
                <input type="checkbox" name={`on-${day}`} defaultChecked={Boolean(current)} />
                Available
              </label>
              <label className="check">
                <input type="checkbox" name={`allday-${day}`} />
                All day (opening to 11:59 p.m.)
              </label>
              <div className="fields">
                <div>
                  <label htmlFor={`start-${day}`}>From</label>
                  <input id={`start-${day}`} name={`start-${day}`} type="time" defaultValue={current?.start ?? '17:00'} />
                </div>
                <div>
                  <label htmlFor={`end-${day}`}>Until</label>
                  <input id={`end-${day}`} name={`end-${day}`} type="time" defaultValue={current?.end ?? '21:00'} />
                </div>
              </div>
            </fieldset>
          );
        })}
        <button type="submit" disabled={locked}>
          Save availability
        </button>
      </form>
    </section>
  );
}
