'use client';

import { useState } from 'react';
import { Check, CircleAlert } from '../components/icons';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

// Lets a pending person add their name so an admin can recognise the request.
// RLS lets a user update only their own profile row, and only name and phone.
export function SetNameForm({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<'ok' | 'info' | 'error'>('ok');

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setTone('ok');
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setTone('error');
        setMessage('Your session ended. Sign in again.');
        return;
      }
      // RLS only lets an active user update their row, so a pending user's update matches no row.
      // Count the rows returned so the message never says "saved" when nothing was saved.
      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: name.trim().slice(0, 120) })
        .eq('id', user.id)
        .select('id');
      if (error) {
        setTone('error');
        setMessage('Could not save your name. Try again.');
      } else if (!data || data.length === 0) {
        setTone('info');
        setMessage('Your name was not saved yet. An admin will see your email on the request.');
      } else {
        setTone('ok');
        setMessage('Name saved.');
      }
    } catch {
      setTone('error');
      setMessage('Could not save your name. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} noValidate className="auth-form">
      <div className="auth-field">
        <label htmlFor="full-name">Your name</label>
        <input
          id="full-name"
          name="full-name"
          type="text"
          autoComplete="name"
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      {tone === 'error' && message ? (
        <p role="status" className="banner banner-danger">
          <CircleAlert />
          <span>{message}</span>
        </p>
      ) : (
        <p role="status" className={tone === 'ok' && message ? 'auth-status auth-status-ok' : 'auth-status'}>
          {tone === 'ok' && message ? <Check /> : null}
          {tone === 'ok' && message ? <span>{message}</span> : message}
        </p>
      )}
      <button type="submit" className="btn-secondary" disabled={busy || !name.trim()}>
        {busy ? 'Saving...' : 'Save name'}
      </button>
    </form>
  );
}
