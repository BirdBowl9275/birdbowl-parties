'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ROLES, STATUSES } from '@/lib/admin';
import { Ban, Check, Clock } from '../../components/icons';

export type UserRowData = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  role: string;
  tier: number | null;
  daily_cap: number;
  invited_by?: string | null;
  // Display only: the inviter's name, looked up on the page (security review WEB-INV-01).
  inviter_name?: string | null;
};

// One user's edit form. The form, its fields and the server action are exactly as before; this
// wrapper only adds the approved confirm step (decision 1) for "removed".
//
// Safety without JavaScript, or before hydration: the "removed" option is rendered disabled in the
// server HTML (unless the user is already removed), so a first press of Save can never remove
// anyone. Once the page is hydrated the option is enabled, and a Save that would set the status to
// removed is intercepted: it opens the confirm instead, and only "Yes, remove" submits.
export function UserRow({
  action,
  row,
  justSaved = false,
}: {
  action: (formData: FormData) => Promise<void>;
  row: UserRowData;
  // True right after this row was saved: the Save button shows a green "Saved" until edited again.
  justSaved?: boolean;
}) {
  // Pending rows lead with the email: approve on the address, never on the typed name, which the
  // inviter chose and the person can change (security verifier on WEB-INV-01).
  const pending = row.status === 'pending';
  const label = pending
    ? row.email || row.phone || row.full_name || 'No email'
    : row.full_name || row.email || row.phone || 'No name yet';
  const contact = pending ? row.full_name || '' : row.email ?? row.phone ?? '';
  const [hydrated, setHydrated] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [dirty, setDirty] = useState(false);
  const showSaved = justSaved && !dirty;
  const statusRef = useRef<HTMLSelectElement>(null);
  const yesRef = useRef<HTMLButtonElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const textId = useId();

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (confirming) keepRef.current?.focus();
  }, [confirming]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    if (submitter && submitter === yesRef.current) {
      // Deliberate second press. Close after the event so the form data is already captured.
      setTimeout(() => setConfirming(false), 0);
      return;
    }
    if (statusRef.current?.value === 'removed' && row.status !== 'removed') {
      e.preventDefault();
      setConfirming(true);
    }
  }

  function keep() {
    if (statusRef.current) statusRef.current.value = row.status;
    setConfirming(false);
    statusRef.current?.focus();
  }

  const pill =
    row.status === 'active' ? (
      <span className="pill pill-success">
        <Check />
        Active
      </span>
    ) : row.status === 'pending' ? (
      <span className="pill pill-warning">
        <Clock />
        Pending
      </span>
    ) : (
      <span className="pill pill-danger">
        <Ban />
        Removed
      </span>
    );

  return (
    <form
      action={action}
      className={row.status === 'removed' ? 'urow removed' : 'urow'}
      aria-label={`Edit ${label}`}
      onSubmit={onSubmit}
      onChange={() => setDirty(true)}
      id={`user-${row.id}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && confirming) keep();
      }}
    >
      <input type="hidden" name="id" value={row.id} />
      <div className="ucell-user">
        <p className="user-name">
          <strong>{label}</strong>
          {pill}
        </p>
        {contact && contact !== label ? <p className="user-contact">{contact}</p> : null}
        {row.status === 'pending' && row.inviter_name ? (
          <p className="user-contact">Invited by {row.inviter_name}</p>
        ) : null}
      </div>
      <div className="ucell ucell-status">
        <label htmlFor={`${textId}-status`}>Status</label>
        <select
          id={`${textId}-status`}
          ref={statusRef}
          name="status"
          defaultValue={row.status}
          onChange={() => setConfirming(false)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} disabled={s === 'removed' && row.status !== 'removed' && !hydrated}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="ucell ucell-role">
        <label htmlFor={`${textId}-role`}>Role</label>
        <select id={`${textId}-role`} name="role" defaultValue={row.role}>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div className="ucell ucell-tier">
        <label htmlFor={`${textId}-tier`}>Host tier</label>
        <select id={`${textId}-tier`} name="tier" defaultValue={row.tier === null ? '' : String(row.tier)}>
          <option value="">Not a host</option>
          <option value="1">1: Party hostess</option>
          <option value="2">2: Front desk</option>
          <option value="3">3: Server</option>
        </select>
      </div>
      <div className="ucell ucell-cap">
        <label htmlFor={`${textId}-cap`}>Daily cap</label>
        <select id={`${textId}-cap`} name="daily_cap" defaultValue={String(row.daily_cap)}>
          {[0, 1, 2, 3].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <div className="ucell-save">
        <button
          type="submit"
          className={showSaved ? 'btn-secondary btn-saved' : row.status === 'pending' ? undefined : 'btn-secondary'}
        >
          {showSaved ? (
            <>
              <Check />
              Saved<span className="vh"> {label}. Save again</span>
            </>
          ) : (
            <>
              Save<span className="vh"> {label}</span>
            </>
          )}
        </button>
      </div>
      {confirming ? (
        <div role="group" aria-labelledby={textId} className="confirm-box ucell-confirm">
          <p id={textId} className="confirm-text">
            Remove {label}? They lose access immediately.
          </p>
          <div className="confirm-actions">
            <button type="submit" ref={yesRef} className="btn-danger">
              Yes, remove
            </button>
            <button type="button" ref={keepRef} className="btn-secondary" onClick={keep}>
              Keep user
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
