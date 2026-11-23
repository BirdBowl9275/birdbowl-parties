'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

// Lets a pending person add their name so an admin can recognise the request.
// RLS lets a user update only their own profile row, and only name and phone.
export function SetNameForm({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
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
      if (error) setMessage('Could not save your name. Try again.');
      else if (!data || data.length === 0)
        setMessage('Your name was not saved yet. An admin will see your email on the request.');
      else setMessage('Name saved.');
    } catch {
      setMessage('Could not save your name. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} noValidate>
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
      {message ? <p role="status">{message}</p> : null}
      <button type="submit" disabled={busy || !name.trim()}>
        {busy ? 'Saving...' : 'Save name'}
      </button>
    </form>
  );
}
