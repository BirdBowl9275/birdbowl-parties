'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { normalizePhone } from '@/lib/phone';

type Channel = 'email' | 'phone';
type Step = 'contact' | 'code';

export function LoginForm() {
  const [channel, setChannel] = useState<Channel>('email');
  const [step, setStep] = useState<Step>('contact');
  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The normalized address or number the code was sent to.
  const [target, setTarget] = useState<string>('');

  function switchChannel(next: Channel) {
    setChannel(next);
    setStep('contact');
    setContact('');
    setCode('');
    setError(null);
  }

  async function sendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      if (channel === 'email') {
        const email = contact.trim();
        // Invitation only: shouldCreateUser is false, so an admin must create the account first.
        // The server setting "allow new users to sign up" is the real control; this is the UI side.
        const { error: sendError } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
        // Unknown or not-yet-invited addresses see the same next screen as known ones, so the
        // form does not reveal who has access. Only a rate limit gets its own message.
        if (sendError?.status === 429) {
          setError('We could not send a code right now. Wait a minute and try again.');
          return;
        }
        setTarget(email);
      } else {
        const phone = normalizePhone(contact);
        if (!phone) {
          setError('Enter a valid phone number, with the area code.');
          return;
        }
        const { error: sendError } = await supabase.auth.signInWithOtp({
          phone,
          options: { shouldCreateUser: false, channel: 'sms' },
        });
        if (sendError) {
          setError('We could not text a code right now. Wait a minute and try again.');
          return;
        }
        setTarget(phone);
      }
      setStep('code');
    } catch {
      setError('Sign-in is not set up yet. Ask an admin to check the configuration.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: verifyError } =
        channel === 'email'
          ? await supabase.auth.verifyOtp({ email: target, token: code.trim(), type: 'email' })
          : await supabase.auth.verifyOtp({ phone: target, token: code.trim(), type: 'sms' });
      if (verifyError) {
        setError('That code is not right or has expired. Check it or request a new one.');
        return;
      }
      // A full page load, not a client-side route change. The /login page stays mounted during a
      // client-side redirect back to /login, which kept the code step on screen. The full load
      // sends the new session cookie, and the middleware sends the person to the right screen.
      window.location.assign('/');
      return;
    } catch {
      setError('Sign-in is not set up yet. Ask an admin to check the configuration.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div role="tablist" aria-label="Sign in with" className="tabs">
        <button
          type="button"
          role="tab"
          aria-selected={channel === 'email'}
          className={channel === 'email' ? 'tab tab-active' : 'tab'}
          onClick={() => switchChannel('email')}
        >
          Email
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={channel === 'phone'}
          className={channel === 'phone' ? 'tab tab-active' : 'tab'}
          onClick={() => switchChannel('phone')}
        >
          Phone
        </button>
      </div>

      {step === 'contact' ? (
        <form onSubmit={sendCode} noValidate>
          {channel === 'email' ? (
            <>
              <label htmlFor="contact">Work email</label>
              <input
                id="contact"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </>
          ) : (
            <>
              <label htmlFor="contact">Mobile number</label>
              <input
                id="contact"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </>
          )}
          {error ? <p className="notice" role="alert">{error}</p> : null}
          <button type="submit" disabled={busy || !contact.trim()}>
            {busy ? 'Sending...' : channel === 'email' ? 'Email me a code' : 'Text me a code'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} noValidate>
          <p role="status">If that {channel === 'email' ? 'email' : 'number'} can sign in, a code is on its way.</p>
          <label htmlFor="code">One-time code</label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          {error ? <p className="notice" role="alert">{error}</p> : null}
          <button type="submit" disabled={busy || !code.trim()}>
            {busy ? 'Checking...' : 'Sign in'}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setStep('contact');
              setCode('');
              setError(null);
            }}
          >
            Use a different {channel === 'email' ? 'email' : 'number'}
          </button>
        </form>
      )}
    </>
  );
}
