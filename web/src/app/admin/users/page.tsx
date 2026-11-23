import Link from 'next/link';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin-guard';
import { updateProfile } from '../actions';
import { CircleAlert, Info } from '../../components/icons';
import { UserRow, type UserRowData } from './user-row';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Users' };

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
  searchParams: Promise<{ msg?: string; saved?: string }>;
}) {
  const { msg, saved } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, status, role, tier, daily_cap, invited_by')
    .order('created_at', { ascending: true });

  const raw = (data ?? []) as UserRowData[];
  // Show who invited each pending person, so a familiar-looking name can't hide an unknown inviter.
  // The inviter is shown by name AND email: email cannot be changed by the user (profile guard),
  // so a renamed account cannot pass itself off as someone else (security verifier M1).
  const nameById = new Map(
    raw.map((r) => [r.id, r.email ? (r.full_name ? `${r.full_name} (${r.email})` : r.email) : r.full_name || 'Unknown']),
  );
  const rows = raw.map((r) => ({ ...r, inviter_name: r.invited_by ? nameById.get(r.invited_by) ?? 'Unknown' : null }));
  const pending = rows.filter((r) => r.status === 'pending');
  const others = rows.filter((r) => r.status !== 'pending');

  return (
    <section className="sched admin" aria-labelledby="users-title">
      <div className="sched-head">
        <h1 id="users-title">Users</h1>
        <Link className="btn btn-secondary" href="/invite">
          Invite someone
        </Link>
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
                  <UserRow action={updateProfile} row={r} justSaved={r.id === saved} />
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
                  <UserRow action={updateProfile} row={r} justSaved={r.id === saved} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </section>
  );
}
