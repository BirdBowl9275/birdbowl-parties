'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from './icons';

type Choice = 'light' | 'dark' | 'system';

const OPTIONS: { value: Choice; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun /> },
  { value: 'dark', label: 'Dark', icon: <Moon /> },
  { value: 'system', label: 'System', icon: <Monitor /> },
];

// Light / dark / system. The choice lives on this device only (localStorage, key "theme").
// An inline script in the document head applies a stored choice before first paint.
export function ThemeToggle() {
  const [choice, setChoice] = useState<Choice>('system');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') setChoice(stored);
    } catch {
      // Storage blocked: stay on the system theme.
    }
  }, []);

  function select(next: Choice) {
    setChoice(next);
    const root = document.documentElement;
    if (next === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', next);
    try {
      if (next === 'system') window.localStorage.removeItem('theme');
      else window.localStorage.setItem('theme', next);
    } catch {
      // Storage blocked: the choice still applies until the page is closed.
    }
  }

  return (
    <fieldset className="theme-toggle">
      <legend className="vh">Theme</legend>
      {OPTIONS.map((o) => (
        <label key={o.value} className="theme-opt">
          <input
            type="radio"
            name="theme"
            value={o.value}
            checked={choice === o.value}
            onChange={() => select(o.value)}
          />
          {o.icon}
          <span className="vh-md">{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
