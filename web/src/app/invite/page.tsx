import type { Metadata } from 'next';
import { requirePartiesView } from '@/lib/sales-guard';
import { notFound } from 'next/navigation';
import { Info } from '../components/icons';
import { INVITE_MESSAGES } from '@/lib/invite';
import { inviteUser } from './actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Invite someone' };

export default async function InvitePage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  // Unknown codes show nothing, so a crafted link cannot put its own text in the banner.
  const message = msg && Object.hasOwn(INVITE_MESSAGES, msg) ? INVITE_MESSAGES[msg] : undefined;
  // Admins, managers and sales may invite. Viewers can open the guard but have no edit rights,
  // so they get "not found" here; inviteUser() re-checks with requireSalesAccess().
  const { readOnly } = await requirePartiesView();
  if (readOnly) notFound();

  return (
    <section className="sched invite" aria-labelledby="invite-title">
      <div className="sched-head">
        <h1 id="invite-title">Invite someone</h1>
      </div>
      {message ? (
        <div className="banner banner-info" role="status">
          <Info />
          <span>{message}</span>
        </div>
      ) : null}
      <div className="panel invite-panel">
        <p className="muted">
          Adds their email so they can sign in. They wait in Pending approval until an admin approves them and
          sets their role.
        </p>
        <form action={inviteUser} className="party-form" aria-labelledby="invite-title">
          <label>
            Their name
            <input name="full_name" type="text" maxLength={100} required autoComplete="off" />
          </label>
          <label>
            Their email
            <input name="email" type="email" maxLength={254} required autoComplete="off" />
          </label>
          <button type="submit">Add person</button>
        </form>
      </div>
    </section>
  );
}
