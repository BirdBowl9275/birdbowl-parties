import Link from 'next/link';
import { requireSalesAccess } from '@/lib/sales-guard';
import { createParty, cancelParty, updateParty } from '../actions';
import { addDays, PARTY_TYPES, todayBusiness, validWeekStart, weekDays } from '@/lib/parties';

export const dynamic = 'force-dynamic';

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
  searchParams: Promise<{ week?: string; msg?: string }>;
}) {
  const { week: weekParam, msg } = await searchParams;
  const { supabase } = await requireSalesAccess();

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
    <section className="card wide" aria-labelledby="parties-title">
      <h1 id="parties-title">Parties</h1>
      <nav className="week-nav" aria-label="Week">
        <Link href={`/sales/parties?week=${addDays(monday, -7)}`}>Previous week</Link>
        <span>Week of {monday}</span>
        <Link href={`/sales/parties?week=${addDays(monday, 7)}`}>Next week</Link>
      </nav>
      {msg ? <p role="status">{msg}</p> : null}
      {error ? <p className="notice" role="alert">Could not load parties.</p> : null}

      <h2>Add a party</h2>
      <PartyForm action={createParty} week={monday} />

      {days.map((day) => {
        const dayRows = rows.filter((r) => r.party_date === day);
        return (
          <div key={day} className="day">
            <h2>{day}</h2>
            {dayRows.length === 0 ? <p className="muted">No parties.</p> : null}
            {dayRows.map((r) => (
              <div key={r.id} className={r.status === 'cancelled' ? 'user-row cancelled' : 'user-row'}>
                <p className="user-name">
                  <strong>{r.customer_name}</strong>{' '}
                  <span className="muted">
                    {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)} · {r.kids_count} kids · {r.party_type}
                    {r.assigned_host ? ' · host assigned' : ' · not assigned'}
                    {r.status === 'cancelled' ? ' · cancelled' : ''}
                  </span>
                </p>
                {r.status === 'cancelled' ? null : (
                  <>
                    <PartyForm action={updateParty} week={monday} party={r} />
                    <form action={cancelParty} className="inline">
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="week" value={monday} />
                      <button type="submit" className="secondary">Cancel party</button>
                    </form>
                  </>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </section>
  );
}

function PartyForm({
  action,
  week,
  party,
}: {
  action: (formData: FormData) => Promise<void>;
  week: string;
  party?: Row;
}) {
  return (
    <form action={action} className="party-form" aria-label={party ? `Edit ${party.customer_name}` : 'New party'}>
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
              <option key={t} value={t}>{t}</option>
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
      <button type="submit">{party ? 'Save party' : 'Add party'}</button>
    </form>
  );
}
