import { requireAdmin } from '@/lib/admin-guard';
import { updateProfile } from '../actions';
import { CircleAlert, Info } from '../../components/icons';
import { UserRow, type UserRowData } from './user-row';

export const dynamic = 'force-dynamic';

function UsersHead() {
  return (
    <div className="ulist-head" aria-hidden="true">
      <span>User</span>
      <span>Status</span>
      <span>Role</span>
      <span>Host tier</span>
      <span>Daily cap</span>
      <span />
    </div>
  );
}

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

  const rows = (data ?? []) as UserRowData[];
  const pending = rows.filter((r) => r.status === 'pending');
  const others = rows.filter((r) => r.status !== 'pending');

  return (
    <section className="sched admin" aria-labelledby="users-title">
      <div className="sched-head">
        <h1 id="users-title">Users</h1>
      </div>
      {msg ? (
        <div className="banner banner-info" role="status">
          <Info />
          <span>{msg}</span>
        </div>
      ) : null}
      {error ? (
        <div className="banner banner-danger" role="alert">
          <CircleAlert />
          <span>Could not load users.</span>
        </div>
      ) : null}

      <div className={pending.length > 0 ? 'admin-section admin-pending' : 'admin-section'}>
        <h2 id="pending-title">Pending approval ({pending.length})</h2>
        {pending.length === 0 ? <p className="empty">No requests waiting.</p> : null}
        {pending.length > 0 ? (
          <>
            <UsersHead />
            <ul className="ulist" aria-labelledby="pending-title">
              {pending.map((r) => (
                <li key={r.id}>
                  <UserRow action={updateProfile} row={r} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      <div className="admin-section">
        <h2 id="others-title">Everyone else ({others.length})</h2>
        {others.length > 0 ? (
          <>
            <UsersHead />
            <ul className="ulist" aria-labelledby="others-title">
              {others.map((r) => (
                <li key={r.id}>
                  <UserRow action={updateProfile} row={r} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </section>
  );
}
