'use client';

import { useEffect, useRef, useState } from 'react';
import { CircleAlert } from '../components/icons';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { normalizePhone } from '@/lib/phone';

type Channel = 'email' | 'phone';
type Step = 'contact' | 'code';

// `notice` (the removed-access banner) is rendered below the intro, where the page used to put it.
export function LoginForm({ notice }: { notice?: React.ReactNode }) {
  const [channel, setChannel] = useState<Channel>('email');
  const [step, setStep] = useState<Step>('contact');
  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [focusedTab, setFocusedTab] = useState<Channel>('email');
  const codeRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const tabRefs = useRef<Record<Channel, HTMLButtonElement | null>>({ email: null, phone: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The normalized address or number the code was sent to.
  const [target, setTarget] = useState<string>('');

  // Move focus into the code field when the code step opens (the contact form unmounts).
  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  function switchChannel(next: Channel) {
    setChannel(next);
    setFocusedTab(next);
    setStep('contact');
    setContact('');
    setCode('');
    setError(null);
  }

  // Manual activation (APG): arrows, Home and End move focus only. Enter or Space selects.
  function onTabKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    let next: Channel | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') next = focusedTab === 'email' ? 'phone' : 'email';
    else if (e.key === 'Home') next = 'email';
    else if (e.key === 'End') next = 'phone';
    if (!next) return;
    e.preventDefault();
    setFocusedTab(next);
    tabRefs.current[next]?.focus();
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

  const errorNote = error ? (
    <p id="auth-error" className="banner banner-danger" role="alert">
      <CircleAlert />
      <span>{error}</span>
    </p>
  ) : null;

  return (
    <>
      {/* The intro follows the chosen channel (Email or Phone). */}
      <p className="auth-lede">
        {channel === 'email'
          ? 'Enter your email. We will send you a one-time code. No password needed.'
          : 'Enter your mobile number. We will text you a one-time code. No password needed.'}
      </p>
      {notice}
      <div
        role="tablist"
        aria-label="Sign in with"
        className="auth-seg"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setFocusedTab(channel);
        }}
      >
        {(['email', 'phone'] as const).map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            id={`tab-${c}`}
            ref={(el) => {
              tabRefs.current[c] = el;
            }}
            aria-selected={channel === c}
            aria-controls={channel === c ? 'auth-panel' : undefined}
            tabIndex={focusedTab === c ? 0 : -1}
            onClick={() => switchChannel(c)}
            onKeyDown={onTabKeyDown}
          >
            {c === 'email' ? 'Email' : 'Phone'}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="auth-panel" aria-labelledby={`tab-${channel}`}>
        {step === 'contact' ? (
          <form onSubmit={sendCode} noValidate className="auth-form">
            <div className="auth-field">
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
                    ref={contactRef}
                    aria-describedby={error ? 'auth-error' : undefined}
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
                    ref={contactRef}
                    aria-describedby={error ? 'auth-error' : undefined}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                  />
                </>
              )}
            </div>
            {errorNote}
            <button type="submit" disabled={busy || !contact.trim()} aria-busy={busy || undefined}>
              {busy ? 'Sending...' : channel === 'email' ? 'Email me a code' : 'Text me a code'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} noValidate className="auth-form">
            <p id="code-status" role="status" className="auth-status">
              If that {channel === 'email' ? 'email' : 'number'} can sign in, a code is on its way.
            </p>
            <div className="auth-field">
              <label htmlFor="code">One-time code</label>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                ref={codeRef}
                aria-describedby={error ? 'code-status auth-error' : 'code-status'}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            {errorNote}
            <button type="submit" disabled={busy || !code.trim()} aria-busy={busy || undefined}>
              {busy ? 'Checking...' : 'Sign in'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setStep('contact');
                setCode('');
                setError(null);
                requestAnimationFrame(() => contactRef.current?.focus());
              }}
            >
              Use a different {channel === 'email' ? 'email' : 'number'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
