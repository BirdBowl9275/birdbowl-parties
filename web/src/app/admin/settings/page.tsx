import { requireAdmin } from '@/lib/admin-guard';
import { updateSetting } from '../actions';
import { AdminNav } from '../nav';

export const dynamic = 'force-dynamic';

const LABELS: Record<string, string> = {
  fairness_window_days: 'Fairness window (days)',
  hostess_avg_allowance_pct: 'Hostess average allowance (%)',
  availability_cutoff_dow: 'Availability cutoff day (1 = Mon, 7 = Sun)',
  availability_cutoff_time: 'Availability cutoff time',
  reveal_time: 'Morning reveal time',
  bowling_server_only_after: 'Bowling parties after this time go to servers',
};

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const { msg } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data } = await supabase.from('settings').select('key, value').order('key');
  const rows = (data ?? []).filter((r) => r.key in LABELS);

  return (
    <section className="card wide" aria-labelledby="settings-title">
      <AdminNav current="settings" />
      <h1 id="settings-title">Settings</h1>
      {msg ? <p role="status">{msg}</p> : null}
      {rows.map((r) => (
        <form key={r.key} action={updateSetting} className="user-row">
          <input type="hidden" name="key" value={r.key} />
          <label>
            {LABELS[r.key]}
            <input name="value" type="text" defaultValue={String(r.value)} required />
          </label>
          <button type="submit">Save</button>
        </form>
      ))}
    </section>
  );
}
