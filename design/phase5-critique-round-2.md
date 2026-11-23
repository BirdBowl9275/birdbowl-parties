# Phase 5 critique, round 2: Login and Pending

Date: 2026-11-23. Critic: design critic (Opus 5.5). Scope: `/login` and `/pending` in the `redesign-pilot` worktree. I changed no application code. This report is the only file I wrote.

## Verdict: PASS

- **B1 is resolved.** The selected tab has a `--border-input` outline and weight 600, plus a forced-colors `Highlight` border. The parent measured the outline in a browser as rgb(138,138,147), which is `#8a8a93`. That gives 3.11:1 against the track in light and 3.26:1 in dark (`#6b6e76` on `#1d1e22`).
- **All applied M and P items are resolved in code:** M1 to M7, P2, P3, P4 and P5. P1 is recorded in `decisions.md`. P6, P7 and P8 were skipped on purpose, and I am not re-raising them.
- **Parity: 5 of 5 items verified in code** (1, 2, 3, 10, 12). Every Supabase call, option, string, redirect, the set-name update and the sign-out POST is byte-identical to HEAD. Items 2, 10 and 12 have now also been seen in a real browser with a pending user.
- **WCAG 2.2 AA:** no failures found in code or in the parent's captures.
- **Open issues:** Critical 0, High 0, Medium 1, Polish 5. None of them block.

### Evidence used

- **Code:** `git diff HEAD` for `globals.css`, `login/page.tsx`, `login/login-form.tsx`, `pending/page.tsx` and `pending/set-name-form.tsx`. I also read all of `components/auth-card.tsx`, `components/theme-toggle.tsx` and the `.theme-*`, `.banner`, `.page` and `.vh-md` rules.
- **Parent's real-browser results:** `phase5-manual-checks-round-2.md`.
  - Pending before, 375: `...-x79uh9.jpg`
  - Pending after, 375 light: `...-6kbo5s.jpg`
  - Pending after, 1280 dark: `...-1e5vq5.jpg`
  - Login after, 1280 light: `...-6eemsq.jpg`
  - Keyboard: manual tab activation tested
  - Redirects for a pending user checked on both servers
- **Checks I ran:**
  - `tsc --noEmit`: clean.
  - `vitest run`: 73 of 73 passed.
  - Grep of the added CSS: no hex, `rgb(` or `hsl(` values. The only px values are the shared 639.98/640 breakpoints.
  - No remaining uses of `.notice`, `.auth-alert` or `className="secondary"` under `src/app`.
- **Could not run:** my Playwright and axe script. The sandbox still blocks Chromium (`bootstrap_check_in ... MachPortRendezvousServer: Permission denied`). Because of that I have no axe results and no captures of my own.

## Round 1 items

| Item | Status | Evidence |
|---|---|---|
| B1 selected tab 3:1 | Resolved | `globals.css` `.auth-seg button[aria-selected='true']`: `border-color: var(--border-input)`, `font-weight: 600`, forced-colors `Highlight`. Visible in `...-6eemsq.jpg`, and the parent measured it. |
| M1 focus between steps | Resolved (code) | A `useEffect` on `step` focuses `#code`. "Use a different..." uses `requestAnimationFrame` to focus `contactRef`. `#code` has `aria-describedby="code-status"`, plus `auth-error` while an error shows. Focus is not moved when the tab switches. |
| M2 manual activation | Resolved (code and keyboard) | `focusedTab` drives the roving `tabIndex`. Arrow keys, Home and End only move focus, and Enter/Space go through the native `onClick`. The tablist's `onBlur` (with a `relatedTarget` check) resets the roving stop. Parent test: ArrowRight moves focus to Phone while Email stays selected, and Enter then selects Phone. |
| M3 pending status tone | Resolved | Error renders `banner banner-danger` with `CircleAlert`, ok renders the success `Check`, info is plain text. All keep `role="status"`. Both branches are a `<p>` in the same child slot, so React reuses the node and the live region persists. `.auth-status:empty` cancels the flex gap, and `...-6kbo5s.jpg` shows no stray space. |
| M4 banner fork | Resolved | `.auth-alert` is deleted. One rule, `.auth-form .banner { margin: 0 }`. |
| M5 describedby | Resolved | `#contact` and `#code` both reference `auth-error` while an error shows. There is no `aria-invalid`, as advised. |
| M6 theme toggle | Resolved | `ThemeToggle` sits in the `AuthCard` brand row. See N1 for the resulting wrap. |
| M7 pending roles | Resolved | Save name is `btn-secondary`. Sign out is `btn-ghost`, full width (`...-6kbo5s.jpg`). |
| P1 disabled fork | Recorded | `decisions.md`, "Disabled buttons in the auth card". |
| P2, P3 | Resolved | The 3px value and the duplicate h1 margin are gone. |
| P4 spec 4.1 | Resolved, with two deviations | 48px logo, 28px heading, 400px card, phone layout edge-to-edge (`...-6kbo5s.jpg`). Two deviations remain: the card is placed at `12vh` rather than "30% from the top", and the footer is not built. See N3. |
| P5 code field | Resolved (code) | 20px, `0.2em`, tabular figures. Not seen in a browser yet. |

## Parity (items 1 to 3, 10, 12)

| # | Item | Code | Browser |
|---|---|---|---|
| 1 | Email and phone code sign-in, with the 6 error and status strings | Unchanged:<br>- `signInWithOtp` (`shouldCreateUser: false`, plus `channel: 'sms'` for phone)<br>- `verifyOtp` (`type: 'email'`/`'sms'`, `code.trim()`, `target`)<br>- the 429 branch, `normalizePhone`, `window.location.assign('/')` and `noValidate`<br>- the disabled-until-non-empty rule<br>- `name`/`type`/`inputMode`/`autoComplete`<br>- all strings verbatim | Contact step, both tabs, and the phone error (round 1). The code step, verify error and busy state are still not seen. |
| 2 | Pending users see only pending and can set a name | Unchanged:<br>- the `getUser` and redirect to `/login`<br>- the `profiles` select with `status === 'active'` → `/app`<br>- the update `.slice(0,120)` with `.eq('id')` and `.select('id')`<br>- all 4 messages verbatim<br>- the field attributes (`maxLength={120}`, `autoComplete="name"`) | Seen at 375 light and 1280 dark with a real pending user. `/app` and other routes redirect to `/pending`. The form was not submitted, which is correct. |
| 3 | Removed notice | Same trigger, text and `role="alert"`. Only the class changed. | Seen in round 1. |
| 10 | Sign out from pending | `<form action="/auth/signout" method="post">` is unchanged. Only the class changed. | Rendered (`...-6kbo5s.jpg`). Not pressed, which is fine. |
| 12 | Pending text, form, sign out, redirect | Heading and body verbatim, redirect unchanged. | Seen. |

**Result: 5 of 5 verified, nothing missing or unreachable.**

## Accessibility

- **1.4.11:** passes on the tabs (B1). The success check icon reaches 5.8:1 or more on the surface in light and dark.
- **Tabs (APG manual activation):**
  - Roles, ids, `aria-selected`, `aria-controls` (only on the selected tab), and the one `tabpanel` with `aria-labelledby` are all correct.
  - Arrow keys wrap, Home and End work, `preventDefault` is called, and roving focus resets on leaving the tablist.
- **2.4.3 and 4.1.3:**
  - Focus now lands in the code field, and the field's description carries the status line, so a screen reader hears the step change.
  - Errors use `role="alert"`. The pending live region exists before its text arrives.
- **2.5.8:** tabs, inputs and buttons are 44px. Theme options are 44px on phone and 32px at 640px and above, which passes the 24px AA minimum.
- **Reflow:** at 375 the brand row fits on one line (`...-6kbo5s.jpg`). At 320 the code allows the name to wrap (`min-width: 0`), which leaves about 280 of 288px used. That is tight but fits. Not seen in a browser.
- **Not verified, so not claimed:**
  - axe results
  - the 320px width
  - 200% zoom
  - forced-colors
  - the code step, busy state and verify error captures
  - where focus ends up after a send or verify error (see N5)

## Issues

### Critical
None.

### High
None.

### Medium

**N1. "Bird Bowl Parties" wraps onto two lines in the laptop card (answers the parent's question: fix, Medium).**
- **Screen:** `/login` and `/pending` at 640px and above, both themes. Screenshots `...-6eemsq.jpg` and `...-1e5vq5.jpg`.
- **What's wrong:**
  - The card has 336px of content width.
  - From 640px up, `.vh-md` stops hiding the toggle's labels, so the toggle shows "Light / Dark / System" and takes roughly 210px.
  - That squeezes the product name into a two-line stack beside a 48px logo. The brand lockup, which is the main identity element on a screen with no header, breaks.
  - A Linear or Stripe sign-in would never let its wordmark wrap.
- **Breaks:** spec 4.1 (brand row: logo plus name, then the theme toggle), and the type rhythm of the lockup.
- **Fix (CSS only, `globals.css` Auth block):** show the toggle icon-only inside the auth card at every width. The phone already shows it this way (`...-6kbo5s.jpg`). The accessible names stay, because the label spans are only visually hidden.

```css
.auth-brand .theme-opt .vh-md {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

@media (min-width: 640px) {
  .auth-brand .theme-opt {
    min-width: var(--control-sm);
    padding: 0 var(--space-2);
  }
}
```

  - The toggle drops to about 110px, which leaves about 160px for the roughly 130px name. One line.
  - Do not add `white-space: nowrap` to the name. At 320px it has to be able to wrap.

### Polish

**N2. Enter or Space on the already-selected tab wipes the form.**
- **Where:** `login-form.tsx`, tab `onClick={() => switchChannel(c)}`.
- **What's wrong:**
  - A keyboard user on the code step who presses Shift+Tab lands on the selected tab, because the roving stop resets to `channel`.
  - Pressing Space there resets the form to the contact step and clears the code.
  - A click on the selected tab did the same before the redesign, so this is not a regression. But manual activation makes Enter or Space on the focused tab the normal gesture.
- **Fix:** `onClick={() => { if (c !== channel) switchChannel(c); }}`. This changes what a click on the already-selected tab does (it would no longer reset), so it needs Jeff's OK under section 3. Otherwise leave it as it is.

**N3. Record the P4 deviations from spec 4.1 in `decisions.md`.**
- **What's wrong:**
  - The card is placed at `margin-top: 12vh` (`globals.css`, `@media (min-width: 640px) .auth-card`) rather than "30% from top".
  - The 4.1 footer line "Bird Bowl" is not built.
  - Neither deviation is recorded.
- **Fix:** add one line to the design-lead decisions in `decisions.md`, so a later pass doesn't "correct" it.

**N4. Promote the scoped values, and update spec 3.8.**
- **What's wrong:**
  - `--auth-display: 1.75rem` and `--auth-code: 1.25rem` live on `.auth-card`, not in the token block.
  - `letter-spacing: 0.2em` and `-0.005em` are one-off values.
  - Spec 3.8 still says "selected segment `--surface` with `--shadow-sm`", the wording that produced B1. Neither the builder nor I can edit design-system.md in this phase.
- **Fix:**
  - When the token block is next touched, add `--text-display: 1.75rem` and `--text-code: 1.25rem` to `:root`, then point the auth rules at them.
  - The design lead should add "and a `--border-input` outline, weight 600 (1.4.11)" to spec 3.8.

**N5. Check where focus lands after a send or verify error (unverified).**
- **What's wrong:**
  - While `busy` is true, the focused submit button becomes `disabled`. Current Chromium may move focus to `<body>` when that happens.
  - When the 429, verify or "not set up" error then appears, `role="alert"` announces it. But a keyboard user may have to Tab in from the top of the page.
  - The behaviour is the same as before the redesign. I could not test it.
- **Fix, only if a browser check confirms focus goes to `<body>`:** after `setError(...)` in the two error branches of each handler, focus the input that is showing: `requestAnimationFrame(() => (step === 'code' ? codeRef : contactRef).current?.focus())`. That input is already `aria-describedby="auth-error"`. This is markup and focus only.

**N6. Two browser captures are still missing.**
- **What's wrong:** the code step (with the 20px tracked code field), the "Sending..." busy state and the verify error have never been seen. The parent cannot reach them without a real code.
- **Fix:** run `scratchpad/pw/shoot.mjs` outside the sandbox. It answers `/auth/v1/*` locally, so no message is sent. Alternatively, in a browser, use DevTools request blocking on `*/auth/v1/otp*` to get the "not set up" path, which renders the error banner on the contact step without sending anything. Not blocking: the code paths are simple and their parity is verified in the diff.

## Regressions
None found.
- The tab switch keeps focus on the tab.
- `.page:has(.auth-card)` only affects the auth routes.
- The empty status `<p>` adds no space.
- Retired classes have no remaining users.
- The disabled Save name button stays readable in dark (`...-1e5vq5.jpg`).

## What's genuinely excellent (keep it)

- **A proper APG tabs widget with manual activation.** It uses roving focus with reset on blur and native Enter/Space activation. This is the destructive-switch case manual activation exists for, and it is done right.
- **Focus follows the flow.** The code field takes focus and carries the status line as its description, so a screen reader user hears "One-time code, If that email can sign in, a code is on its way."
- **Pending is a calm waiting room.** The hierarchy is secondary then ghost, with no red promise the RLS can't keep. The phone layout is edge-to-edge with a clean brand row (`...-6kbo5s.jpg`). It is a big step up from the before screen (`...-x79uh9.jpg`).
- **The status tone is done without changing a single string.** The live region persists across tones.
- **Parity discipline is intact again.** No Supabase line, string or attribute was touched.

## Scores (1 to 5)

| Area | Before | After R1 | After R2 |
|---|---|---|---|
| Brand identity | 1 | 4 | 4 (5 once N1 stops the wordmark wrapping) |
| Visual hierarchy | 3 | 4 | 5 |
| Consistency / tokens | 2 | 3 | 4 (N4 scoped tokens) |
| Density and scanability | 3 | 4 | 4 |
| Responsive: phone | 3 | 4 | 5 |
| Responsive: ultrawide | 2 | 4 | 4 |
| Accessibility | 2 | 3 | 5 (from code; axe not run) |
| States (empty, error, status) | 2 | 3 | 4 (N6 unseen) |
| Theming (light/dark) | 1 | 3 | 4 |
| Craft vs Linear/Stripe | 2 | 4 | 4 (N1) |

## Recommended before Jeff's sign-off
1. Apply N1, which is CSS only.
2. Record N3.
3. Get the N6 captures if possible.

N2 needs Jeff's call. N4 and N5 can wait.
