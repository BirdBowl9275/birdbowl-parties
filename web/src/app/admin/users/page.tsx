import { requireAdmin } from '@/lib/admin-guard';
import { updateProfile } from '../actions';
import { AdminNav } from '../nav';
import { ROLES, STATUSES } from '@/lib/admin';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  role: string;
  tier: number | null;
  daily_cap: number;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const { msg } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, status, role, tier, daily_cap')
    .order('created_at', { ascending: true });

  const rows = (data ?? []) as Row[];
  const pending = rows.filter((r) => r.status === 'pending');
  const others = rows.filter((r) => r.status !== 'pending');

  return (
    <section className="card wide" aria-labelledby="users-title">
      <AdminNav current="users" />
      <h1 id="users-title">Users</h1>
      {msg ? <p role="status">{msg}</p> : null}
      {error ? <p className="notice" role="alert">Could not load users.</p> : null}

      <h2>Pending approval ({pending.length})</h2>
      {pending.length === 0 ? <p>No requests waiting.</p> : null}
      {pending.map((r) => (
        <UserForm key={r.id} row={r} />
      ))}

      <h2>Everyone else ({others.length})</h2>
      {others.map((r) => (
        <UserForm key={r.id} row={r} />
      ))}
    </section>
  );
}

function UserForm({ row }: { row: Row }) {
  const label = row.full_name || row.email || row.phone || 'No name yet';
  return (
    <form action={updateProfile} className="user-row" aria-label={`Edit ${label}`}>
      <input type="hidden" name="id" value={row.id} />
      <p className="user-name">
        <strong>{label}</strong>
        <span className="muted"> {row.email ?? row.phone ?? ''}</span>
      </p>
      <div className="fields">
        <label>
          Status
          <select name="status" defaultValue={row.status}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Role
          <select name="role" defaultValue={row.role}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          Host tier
          <select name="tier" defaultValue={row.tier === null ? '' : String(row.tier)}>
            <option value="">Not a host</option>
            <option value="1">1: Party hostess</option>
            <option value="2">2: Front desk</option>
            <option value="3">3: Server</option>
          </select>
        </label>
        <label>
          Daily cap
          <select name="daily_cap" defaultValue={String(row.daily_cap)}>
            {[0, 1, 2, 3].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      <button type="submit">Save</button>
    </form>
  );
}
