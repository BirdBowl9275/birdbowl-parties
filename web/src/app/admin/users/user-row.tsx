'use client';

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { ROLES, STATUSES } from '@/lib/admin';
import { useUsersEditor } from './users-editor';
import { Ban, Check, CircleAlert, Clock } from '../../components/icons';

export type UserRowData = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  role: string;
  tier: number | null;
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
  notSaved = false,
  scrollOnSave = true,
}: {
  action: (formData: FormData) => Promise<void>;
  row: UserRowData;
  // True right after this row was saved: the Save button shows a green "Saved" until edited again.
  justSaved?: boolean;
  // True when "Save all" could not write this row: it is outlined and says "Not saved".
  notSaved?: boolean;
  // Scroll the saved row into view (single-row saves only; "Save all" stays at the top).
  scrollOnSave?: boolean;
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

  // After a save the page reloads at the top; bring the saved row back into view.
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!justSaved || !scrollOnSave) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    formRef.current?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }, [justSaved, scrollOnSave]);

  // Tell the page-level "Save all changes" bar whether this row differs from what is saved.
  const editor = useUsersEditor();
  const original = useMemo(
    () => ({
      status: row.status,
      role: row.role,
      tier: row.tier === null ? '' : String(row.tier),
    }),
    [row.status, row.role, row.tier],
  );
  function checkDirty() {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const changed = (Object.keys(original) as (keyof typeof original)[]).some((k) => data.get(k) !== original[k]);
    setDirty(changed);
    editor?.setRowDirty(row.id, changed ? { form } : null);
  }

  // "Discard" on the bar puts every row back to its saved values.
  const discardToken = editor?.discardToken ?? 0;
  useEffect(() => {
    if (discardToken === 0) return;
    formRef.current?.reset();
    setConfirming(false);
    setDirty(false);
    editor?.setRowDirty(row.id, null);
  }, [discardToken]); // only when Discard is pressed

  // Forget this row's edits when it unmounts (for example after it was saved).
  const setRowDirty = editor?.setRowDirty;
  useEffect(() => () => setRowDirty?.(row.id, null), [setRowDirty, row.id]);

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
    checkDirty();
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
      ref={formRef}
      action={action}
      className={['urow', row.status === 'removed' ? 'removed' : '', notSaved ? 'not-saved' : ''].filter(Boolean).join(' ')}
      aria-label={`Edit ${label}`}
      onSubmit={onSubmit}
      onChange={checkDirty}
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
        {notSaved ? (
          <p className="user-not-saved">
            <CircleAlert />
            Not saved. Check this row and try again.
          </p>
        ) : null}
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
