import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin-guard';
import { updateSetting } from '../actions';
import { AdminBanner } from '../admin-banner';
import { one } from '@/lib/admin-messages';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Settings' };

const INTEGER_KEYS = new Set(['fairness_window_days', 'hostess_avg_allowance_pct', 'availability_cutoff_dow']);

type Def = { key: string; label: string; unit: string; help: string };
type Group = { id: string; title: string; blurb: string; items: Def[] };

// Same six keys as before. Grouping, units and help text are display only.
const GROUPS: Group[] = [
  {
    id: 'fairness',
    title: 'Fair host assignment',
    blurb: 'How the schedule shares parties out between hosts.',
    items: [
      {
        key: 'fairness_window_days',
        label: 'Fairness window',
        unit: 'days',
        help: 'How many days back to count the parties each host has had. A whole number from 1 to 365.',
      },
      {
        key: 'hostess_avg_allowance_pct',
        label: 'Hostess average allowance',
        unit: '%',
        help: "How much higher a party hostess's average kids per party may be than the team average, in percent. A whole number from 0 to 100.",
      },
    ],
  },
  {
    id: 'availability',
    title: 'Availability deadline',
    blurb: 'When staff must have their availability in, the week before each schedule.',
    items: [
      {
        key: 'availability_cutoff_dow',
        label: 'Availability cutoff day',
        unit: '1 to 7',
        help: 'The day in the week before each schedule week: 1 is Monday, 2 is Tuesday, up to 7 for Sunday.',
      },
      {
        key: 'availability_cutoff_time',
        label: 'Availability cutoff time',
        unit: '24-hour',
        help: 'Time of day on the cutoff day, 24-hour, like 08:00 or 18:30.',
      },
    ],
  },
  {
    id: 'daily',
    title: 'Day-of timing',
    blurb: 'When party details open up and when bowling parties switch to servers.',
    items: [
      {
        key: 'reveal_time',
        label: 'Morning reveal time',
        unit: '24-hour',
        help: 'Staff see party details from this time on the day of the party, like 08:00.',
      },
      {
        key: 'bowling_server_only_after',
        label: 'Bowling parties after this time go to servers',
        unit: '24-hour',
        help: 'Bowling parties that start after this time go to servers only. 24-hour, like 18:00.',
      },
    ],
  },
];

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const msg = one((await searchParams).msg);
  const { supabase } = await requireAdmin();

  const { data } = await supabase.from('settings').select('key, value').order('key');
  const values = new Map((data ?? []).map((r) => [r.key as string, r.value]));

  return (
    <section className="sched admin admin-settings" aria-labelledby="settings-title">
      <div className="sched-head">
        <h1 id="settings-title">Settings</h1>
      </div>
      <AdminBanner msg={msg} />

      {GROUPS.map((g) => {
        const items = g.items.filter((d) => values.has(d.key));
        if (items.length === 0) return null;
        return (
          <section key={g.id} className="panel admin-group" aria-labelledby={`g-${g.id}`}>
            <h2 id={`g-${g.id}`}>{g.title}</h2>
            <p className="group-blurb">{g.blurb}</p>
            {items.map((d) => (
              <form key={d.key} action={updateSetting} className="setting">
                <input type="hidden" name="key" value={d.key} />
                <div className="setting-text">
                  <label htmlFor={`s-${d.key}`}>{d.label}</label>
                  <p className="setting-help" id={`h-${d.key}`}>{d.help}</p>
                </div>
                <div className="setting-control">
                  <input
                    id={`s-${d.key}`}
                    name="value"
                    type="text"
                    defaultValue={String(values.get(d.key))}
                    required
                    inputMode={INTEGER_KEYS.has(d.key) ? 'numeric' : undefined}
                    aria-describedby={`h-${d.key} u-${d.key}`}
                  />
                  <span className="setting-unit" id={`u-${d.key}`}>{d.unit}</span>
                  <button type="submit" className="btn-secondary">
                    Save<span className="vh"> {d.label}</span>
                  </button>
                </div>
              </form>
            ))}
          </section>
        );
      })}
    </section>
  );
}
