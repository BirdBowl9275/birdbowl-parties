import type { Metadata } from 'next';
import Link from 'next/link';
import { DAY_NAMES } from '@/lib/availability';
import { isUuid } from '@/lib/availability-override';
import { addDays, todayBusiness, validWeekStart } from '@/lib/parties';
import { requireOverrideAccess } from '@/lib/override-guard';
import { saveOverride } from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Enter hostess availability' };

const clock = (t: string) => t.slice(0, 5);

function longDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

// Manager override: enter availability for an active hostess who did not submit it. Only people
// with the override flag see this page. Every change is logged.
export default async function ManagerAvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; hostess?: string; msg?: string }>;
}) {
  const { supabase } = await requireOverrideAccess();
  const sp = await searchParams;

  const today = todayBusiness();
  const monday = sp.week ? validWeekStart(sp.week, today) : addDays(validWeekStart(undefined, today), 7);

  const { data: hostessRows } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('status', 'active')
    .eq('role', 'staff')
    .not('tier', 'is', null)
    .order('full_name');
  const hostesses = hostessRows ?? [];

  const chosen = sp.hostess && isUuid(sp.hostess) ? sp.hostess.toLowerCase() : null;
  const hostess = chosen ? hostesses.find((h) => h.id === chosen) ?? null : null;

  let mine = new Map<number, { start: string; end: string }>();
  if (hostess) {
    const { data: rows } = await supabase
      .from('availability')
      .select('day_of_week, start_time, end_time')
      .eq('profile_id', hostess.id)
      .eq('week_start', monday);
    mine = new Map(
      (rows ?? []).map((r) => [
        Number(r.day_of_week),
        { start: clock(r.start_time as string), end: clock(r.end_time as string) },
      ]),
    );
  }

  let submittedOn: string | null = null;
  if (hostess) {
    const { data: marker } = await supabase
      .from('availability_submissions')
      .select('submitted_at')
      .eq('profile_id', hostess.id)
      .eq('week_start', monday)
      .maybeSingle();
    if (marker?.submitted_at) {
      submittedOn = new Date(marker.submitted_at as string).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/New_York',
      });
    }
  }

  return (
    <section className="card wide" aria-labelledby="override-title">
      <h1 id="override-title">Enter hostess availability</h1>
      <p>
        Use this only for an active hostess who did not submit her availability. This screen works after the
        cutoff too. Every change is logged with your name, the hostess, the week and the time.
      </p>

      <form method="get" className="week-nav">
        <input type="hidden" name="week" value={monday} />
        <label htmlFor="override-hostess">Hostess</label>
        <select id="override-hostess" name="hostess" defaultValue={hostess?.id ?? ''} required>
          <option value="" disabled>
            Choose a hostess
          </option>
          {hostesses.map((h) => (
            <option key={h.id} value={h.id}>
              {h.full_name ?? 'Unnamed hostess'}
            </option>
          ))}
        </select>
        <button type="submit">Show</button>
      </form>

      <nav className="week-nav" aria-label="Week">
        <Link href={`/manager/availability?week=${addDays(monday, -7)}${hostess ? `&hostess=${hostess.id}` : ''}`}>
          Previous week
        </Link>
        <span>Week of {monday}</span>
        <Link href={`/manager/availability?week=${addDays(monday, 7)}${hostess ? `&hostess=${hostess.id}` : ''}`}>
          Next week
        </Link>
      </nav>

      {sp.msg ? (
        <p role="status" className="muted">
          {sp.msg}
        </p>
      ) : null}

      {hostess ? (
        <form action={saveOverride}>
          <input type="hidden" name="week" value={monday} />
          <input type="hidden" name="hostess" value={hostess.id} />
          <p>
            Entering availability for <strong>{hostess.full_name ?? 'this hostess'}</strong>, week of {monday}.
          </p>
          <p className="muted">{submittedOn ? `Submitted ${submittedOn}.` : 'Not submitted yet.'}</p>
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const current = mine.get(day);
            const date = addDays(monday, day - 1);
            return (
              <fieldset key={day} className="day">
                <legend>
                  {DAY_NAMES[day - 1]}, {longDate(date)}
                </legend>
                <label className="check">
                  <input type="checkbox" name={`on-${day}`} defaultChecked={Boolean(current)} />
                  Available
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
          <button type="submit">Save availability for this hostess</button>
        </form>
      ) : (
        <p className="muted">Choose a hostess to see or enter her availability for the week.</p>
      )}
    </section>
  );
}
