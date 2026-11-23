# Phase 5 critique, round 1: Login and Pending

Date: 2026-11-23. Critic: design critic (Opus 5.5). Scope: `/login` and `/pending` in the `redesign-pilot` worktree. I did not change any application code. The only file I wrote is this report.

## Verdict: FAIL

There is one blocking issue: **B1**, a WCAG 2.2 SC 1.4.11 failure on the selected Email/Phone tab, in both themes. It is the same defect critique-round-1 H1 found and fixed on the theme toggle, and the fix is the same one-rule change. Everything else is non-blocking.

- Parity: 5 of 5 audit items (1, 2, 3, 10, 12) are preserved in code. Every Supabase call, option, string, autocomplete/inputmode value, redirect and the sign-out POST is byte-identical in the diff.
  - Checked in a browser (parent session): the contact step, tabs, the phone validation error and the removed notice.
  - Not checked in a browser: the code step, the verify error, the busy states and all of /pending.
- WCAG 2.2 AA: 1 failure (B1).
- Open issues: Critical 0, High 1 (B1, blocking), Medium 7, Polish 8.

### Evidence used

- **Code:** `git diff HEAD` covers `globals.css`, `login/page.tsx`, `login/login-form.tsx`, `pending/page.tsx` and `pending/set-name-form.tsx`. I also read the new `components/auth-card.tsx` in full, plus `site-header.tsx`, `layout.tsx`, `lib/phone.ts` and `components/icons.tsx`.
- **Screenshots:** the parent's real-browser captures, listed in `phase5-manual-checks.md` and `phase5-before.md`:
  - before 375: `...-8kaicl.jpg`
  - after 375 light with the removed notice: `...-8o8un3.jpg`
  - after 375 with the phone error: `...-l0odgc.jpg`
  - after 1280 dark: `...-nd2nat.jpg`
  - after 2560 light: `...-ql5yoq.jpg`
- **Checks I ran:**
  - `tsc --noEmit`: clean.
  - `vitest run`: 6 files, 73 of 73 passed.
  - Grep of the added CSS: no hex, `rgb(` or `hsl(` values. One magic value: `margin-top: 3px` (P2).
  - Contrast ratios computed from the token hex values with the WCAG 2.x luminance formula (table below).
- **Could not run:** my own Playwright and axe pass. The sandbox blocks Chromium from starting (`bootstrap_check_in ... MachPortRendezvousServer: Permission denied`). Because of that I have no screenshots of my own and no axe results. The script is ready to run outside the sandbox: `/private/tmp/claude-501/-Users-jeffgeb--claude-spares-spare-Q3RrTR/e867c792-d422-4c9e-b46b-1a344787786e/scratchpad/pw/shoot.mjs`.
  - It answers every Supabase `/auth/v1/*` call locally with `page.route` and aborts `/rest/v1/*`, so no email or text is ever sent.
  - That covers the code step, the verify error and the busy state, which are the gaps in the parent's checks.
  - The parent can run it, or reproduce the same mocked routes in their browser.

### Contrast (computed)

| Pair | Light | Dark | Needs |
|---|---|---|---|
| Selected tab border (`--border`) vs track (`--surface-sunken`) | 1.24 | 1.28 | 3 (B1) |
| Selected tab fill (`--surface`) vs track | 1.10 | 1.08 | 3 (B1) |
| Selected text (`--text`) vs unselected text (`--text-muted`) | 2.29 | 2.19 | 3 (B1) |
| `--border-input` vs track (proposed fix, same as the theme toggle) | 3.11 | 3.26 | 3 |
| Unselected tab text on track | 7.03 | 6.50 | 4.5 |
| Disabled button text on its fill (auth override) | 6.61 | 5.45 | exempt |
| Banner text (`--danger-fg` on `--danger-bg`) | 5.97 | 7.25 | 4.5 |
| White on brand red (enabled primary) | 5.35 | 5.35 | 4.5 |
| Status line (`--text-muted` on `--surface`) | 7.73 | 6.99 | 4.5 |
| Focus ring on surface / on track | 5.17 / 4.70 | 7.05 | 3 |

## Blocking

### B1 (High). The selected Email/Phone tab has no 3:1 state indicator, in either theme (WCAG 2.2 SC 1.4.11)

- **Where:** `/login`, every width and both themes. Evidence: `globals.css` `.auth-seg button[aria-selected='true']` (the last rule in the Auth block), screenshots `...-8o8un3.jpg` (light) and `...-nd2nat.jpg` (dark).
- **What's wrong:** none of the cues that mark the selected tab reaches 3:1.
  - Light: the white fill against the `#F4F4F5` track is 1.10:1, and the `--border` outline is 1.24:1.
  - Light: `--shadow-sm` is a 6% shadow. Text colour changes from `--text-muted` to `--text`, which is 2.29:1 between the two states. Weight does not change (550 for both).
  - Dark: `--shadow-sm` is `none`, and `--surface` (#16171A) is darker than the track (#1D1E22). The selected segment reads as a hole rather than a raised chip, and its only signals are a 1.28:1 border and a 2.19:1 text shift.
  - In the 1280 dark capture you cannot reliably tell which tab is on.
  - It is also a regression. The before screen marked the selected tab with a 2px underline (`...-8kaicl.jpg`), which passed.
- **Breaks:** WCAG 2.2 SC 1.4.11, and spec principle 1.2 ("state is never colour alone"). The precedent is critique-round-1 H1, the theme toggle, where the same tokens failed the same way. That fix was the `--border-input` outline plus weight 600, and `.theme-opt:has(input:checked)` (`globals.css` around line 843) still uses it.
- **Fix:** in `web/src/app/globals.css`, make the selected tab match the theme toggle.

```css
.auth-seg button[aria-selected='true'] {
  background: var(--surface);
  color: var(--text);
  border-color: var(--border-input);   /* 3.11 light / 3.26 dark against the track */
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}

@media (forced-colors: active) {
  .auth-seg button[aria-selected='true'] {
    border: var(--border-width-strong) solid Highlight;
  }
}
```

  - This adds no layout shift, because the 1px border already exists and is transparent.
  - Optional, for dark mode only: `--surface-overlay` (#24262B) would make the selected chip read as raised instead of recessed. It is not needed to pass, because the border carries the 3:1.
  - Spec 3.8 says "selected segment `--surface` with `--shadow-sm`". Add "and a `--border-input` outline, weight 600 (1.4.11)" to it, so the spec stops producing this bug.

## Non-blocking

### Medium

**M1. Focus is lost to `<body>` when the step changes (WCAG 2.4.3 risk; screen reader users get no cue).**
- **Where:** `login-form.tsx`.
  - After "Email me a code" succeeds, the contact form and its focused submit button unmount, and the code form mounts with nothing focused.
  - "Use a different email/number" (`login-form.tsx`, the `btn-secondary` onClick) also removes itself while it has focus.
  - The `<p role="status">` line arrives inside a newly mounted node. VoiceOver often does not announce a live region that is inserted already holding its text, so a screen reader user may hear nothing at all.
  - This existed before the redesign, but this phase owns this markup now.
- **Fix (markup and focus only; no logic change):**
  - Add `const codeRef = useRef<HTMLInputElement>(null)` and `const contactRef = useRef<HTMLInputElement>(null)`.
  - Add `useEffect(() => { if (step === 'code') codeRef.current?.focus(); }, [step]);`
  - In the "Use a different..." onClick, after the existing three setters, queue `requestAnimationFrame(() => contactRef.current?.focus())`, or use a `focusContact` flag in an effect.
  - Give the status line `id="code-status"`, and put `aria-describedby="code-status"` on `#code`. When focus lands on the code field, the reader then says "One-time code, If that email can sign in, a code is on its way."
  - Do NOT move focus when a tab switches. Focus staying on the tab is correct under the APG pattern.

**M2. Arrow keys on the tabs wipe what the person has typed (APG automatic activation used on a destructive switch).**
- **Where:** `login-form.tsx` `onTabKeyDown` calls `switchChannel`, which clears `contact`, `code` and `error` and returns the person to the contact step.
- **What's wrong:**
  - Before this phase only a click did that, and a click is deliberate. Now any Left/Right/Home/End on a tab does it.
  - A keyboard user who Shift+Tabs back from the code step and presses an arrow loses the code step. They then have to request a new code.
  - The rest of the APG implementation is correct:
    - `tablist` with a label
    - `tab` ids
    - `aria-selected`
    - roving `tabIndex`
    - `aria-controls` only on the selected tab, which is right because there is one shared panel
    - a `tabpanel` with `aria-labelledby`
    - wrap-around with two tabs
    - Home/End
    - `preventDefault`
    - the panel starts with focusable content, so it needs no `tabIndex`
- **Fix:** switch to APG manual activation.
  - Keep a `focusedTab` state for the roving `tabIndex`.
  - Arrows/Home/End move focus only: `setFocusedTab(next); tabRefs.current[next]?.focus()`.
  - Enter/Space already trigger the native button `onClick`, which calls `switchChannel`.
  - Set `tabIndex={c === focusedTab ? 0 : -1}`, and reset `focusedTab` to `channel` on blur of the tablist.
  - If the builder prefers to keep automatic activation, add a note to `decisions.md` explaining why. In that case at least skip the reset when `next === channel`, which the code already does.

**M3. The pending status line looks the same for "Name saved." and for the errors.**
- **Where:** `pending/set-name-form.tsx:58`, `.auth-status`.
- **What's wrong:**
  - "Could not save your name. Try again." and "Your session ended. Sign in again." render in the same muted grey as "Name saved.".
  - The text alone identifies the error, so SC 3.3.1 passes and this is not a WCAG failure.
  - It does break spec 3.14 (error lines use the danger banner style), and it is inconsistent with the login form on the same card, which uses a red banner.
- **Fix:**
  - Add `const [tone, setTone] = useState<'ok' | 'info' | 'error'>('ok')`, set next to each existing `setMessage`, with no string changes:
    - `'error'` for the two failures
    - `'info'` for "Your name was not saved yet..."
    - `'ok'` for "Name saved."
  - Render:
    - error: `<p role="status" className="banner banner-danger"><CircleAlert /><span>{message}</span></p>`
    - ok: `.auth-status` plus a `Check` icon in `--success-fg`
    - info: plain `.auth-status`
  - Keep `role="status"` on all three so nothing is announced twice and the existing behaviour stays.
  - Also render the status `<p>` all the time (empty when `message` is null), so the live region exists before its text changes. This also covers part of M1.

**M4. `.auth-alert` duplicates the existing banner component and drifts from it.**
- **Where:** `globals.css` Auth block, `.auth-alert`, compared with `.banner` / `.banner-danger` (`globals.css:914-939`).
- **What's wrong:** same anatomy, different numbers:
  - radius: `--radius-sm` vs spec 3.14's `--radius-md`
  - padding: 12px vs 12px 14px
  - icon offset: `3px` vs `--space-0-5`
- **Fix:**
  - Use `className="banner banner-danger"` in `login/page.tsx` (removed notice) and `login-form.tsx` (`errorNote`).
  - Keep one rule, `.auth-form .banner { margin: 0; }`.
  - Delete `.auth-alert` and `.auth-alert .ic`.

**M5. The inputs are not tied to their errors (spec 3.5).**
- **Where:** `#contact` and `#code` in `login-form.tsx`. They get neither `aria-describedby` nor `aria-invalid` when the error banner shows.
- **What's wrong:** SC 3.3.1 passes because there is one field and the message names it. But spec 3.5 requires both attributes, and a screen reader user who tabs back to the field does not hear the error.
- **Fix:** give the banner `id="auth-error"`, and set `aria-describedby={error ? 'auth-error' : undefined}` on whichever input is rendered. Leave out `aria-invalid`, so the 429 and "not set up" messages do not mark a valid field invalid. If spec 3.5's 2px danger border is wanted, it needs an error kind, so note that as a follow-up rather than parsing the strings.

**M6. There is no theme toggle on login or pending (spec 3.1).**
- **Where:** `site-header.tsx:38-49` returns `null` for these routes, and `auth-card.tsx` has no toggle.
- **What's wrong:** spec 3.1 says login and pending get a minimal header with the logo and the theme toggle. Signed-out people currently cannot choose a theme; they get the system setting or a stored choice. This is not a parity loss, because the before screens had no toggle either.
- **Fix:** render `<ThemeToggle />` (`components/theme-toggle.tsx`, already built and already passed in critique-round-2) in `AuthCard`, top-right of the `.auth-brand` row: `.auth-brand { justify-content: space-between }`, with the logo and name wrapped in a span. If the design lead prefers no toggle here, record that in `decisions.md`.

**M7. Pending button roles differ from spec 4.1b, and nobody has recorded the choice.**
- **Where:** `set-name-form.tsx:59` makes "Save name" the brand-red primary; `pending/page.tsx:30` makes "Sign out" `btn-secondary`. Spec 4.1b says "Save name (secondary)" and "Sign out (ghost)".
- **Why the spec is right here:**
  - The pending screen is a waiting room with no primary task.
  - The code comment at `set-name-form.tsx:26` says a pending user's update matches no row under RLS, so the most likely outcome of the red button is "Your name was not saved yet...".
  - A red primary promises an action that, by the code's own account, does not complete. (Line 7 of the same file says the opposite. Jeff should confirm which comment is true. That is a data/RLS question, so do not change anything about it in this phase.)
- **Fix:**
  - Add `className="btn-secondary"` to the Save name button.
  - Change Sign out to `className="btn-ghost"` and keep it full width: `.auth-signout .btn-ghost { width: 100%; }`.
  - Or record the deviation in `decisions.md`.

### Polish

- **P1.** The disabled-button override (`.auth-card button:disabled`: `--surface-selected` / `--text-muted` / `--border`) is a deliberate, readable improvement on the before screen. However, it departs from spec 3.4 (`--surface-sunken` / `--text-disabled` / `--border-subtle`), so disabled buttons on login look different from disabled buttons everywhere else. Record it in `decisions.md`. Either promote it to the global `button:disabled` in a later pass or keep it scoped deliberately. Don't leave it as an undocumented fork.
- **P2.** In the `.auth-alert .ic` rule (`margin-top: 3px`), the 3px is a magic number. It disappears with M4 (`--space-0-5`).
- **P3.** `.auth-card h1 { margin-bottom: var(--space-2) }` repeats the global `h1` margin (`globals.css:310`). Delete it.
- **P4.** Spec 4.1 calls for:
  - a 48px logo (built: 40)
  - a `display` 28px heading (built: title-1 22px; the `display` token was never added to the CSS)
  - a 400px card (built: 420)
  - a phone layout that is edge-to-edge with no border and 16px padding (built: a bordered card with 40px of inset on each side at 375, `...-8o8un3.jpg`)
  - vertical position at 30% from the top (built: centred)

  None of these hurt use. The phone one costs 48px of field width. Either apply them (`@media (max-width: 639.98px) { .auth-card { border: 0; box-shadow: none; background: transparent; padding: var(--space-4) 0; } }`) or note in `decisions.md` that the built values supersede 4.1.
- **P5.** The code field has no special treatment, although spec 4.1 asks for "Code field 20px with wide letter spacing". Add `#code { font-size: 1.25rem; letter-spacing: 0.2em; font-variant-numeric: tabular-nums; }` scoped as `.auth-form #code`. There is no token for 20px. Either add `--text-code: 1.25rem` to the token block or reuse `--text-title-1` (22px).
- **P6.** The lede says "Enter your email..." even on the Phone tab (`...-l0odgc.jpg`). The copy is verbatim and existed before, so this is content for Jeff to approve, not something to change now. A suggestion: "Enter your email or mobile number. We will send you a one-time code. No password needed."
- **P7.** The document title is "Party Hostess Scheduler" on every route (`layout.tsx:7`), while the card says "Bird Bowl Parties". This applies to the whole app and existed before. Per-page titles would help SC 2.4.2: `export const metadata = { title: 'Sign in' }` / `'Request received'`, with a `title.template` in the layout. Jeff should pick the product name.
- **P8.** The tabs stay live while a send is in flight. Switching mid-request can land the person on a code step for the other channel. This race existed before. Disabling the tabs while `busy` is not a parity change; if you do it, the `.auth-card button:disabled` style already covers them.

## Parity checklist

| # | Item | Code | Browser |
|---|---|---|---|
| 1 | Email and phone code sign-in. Errors: wrong/expired code, 429, unconfigured | Verified. `signInWithOtp` / `verifyOtp` calls and options (`shouldCreateUser: false`, `channel: 'sms'`, `type: 'email'`/`'sms'`) are unchanged. All 6 strings are verbatim. `name`, `type`, `inputMode` and `autoComplete` (`email`, `tel`, `one-time-code`) are unchanged. `window.location.assign('/')` is unchanged. `noValidate` and the disabled-until-non-empty rule are unchanged. | Contact step, both tabs and the phone validation error verified by the parent. The code step, verify error, 429 and unconfigured paths were not seen. |
| 2 | Pending users see only pending and can set a name | Verified. The page query and redirect are unchanged. `SetNameForm` fields (`full-name`, `autoComplete="name"`, `maxLength={120}`), the `.slice(0,120)` update and all 4 messages are verbatim. | Not seen. |
| 3 | Removed notice on login | Verified. Same `reason === 'removed'` trigger, same text, `role="alert"`. | Verified (`...-8o8un3.jpg`). |
| 10 | Sign out from pending | Verified. `<form action="/auth/signout" method="post">` is unchanged; only the class changed. | Not seen. |
| 12 | Pending text, form, sign out, redirect to /app | Verified. The heading and body are verbatim, and the redirect at `profile?.status === 'active'` is unchanged. | Not seen. |

Result: **5 of 5 verified in code**, 2 of 5 partly verified in a browser. Nothing is missing or unreachable.

Retired classes: `.card`, `.notice`, `.tabs`, `.tab` and `.tab-active` have no remaining use in any `.tsx` (manager, sales, staff, admin, app) or in `globals.css`. `card-title` (manager schedule) and `.secondary` (manager schedule:326) are still defined. Verified by grep.

Live regions:
- Errors use `role="alert"` and are mounted fresh each time, because `setError(null)` runs before each request. A repeated error is therefore announced again, which is correct.
- The removed notice and a form error can both be present, but only the newly inserted one announces.
- The code step's `role="status"` text never changes while an alert appears, so nothing is announced twice.
- The weak point is the insertion timing in M1 and M3.

Target size and reflow, from code:
- Tabs, inputs and buttons are all at least 44px (`--control-lg`).
- At 320px the card content is 240px wide, and both tab labels and the brand row fit. The parent confirmed there is no horizontal scroll at 375.
- Reduced motion is covered by the global rule at `globals.css:2166`.
- Label-in-name passes: the visible text is the accessible name everywhere. The logo is `alt=""` next to the visible "Bird Bowl Parties".
- Focus ring: `--focus` 2px with a 2px offset, visible on the tabs (4.70 against the track) and on the inputs (`...-l0odgc.jpg`).

## What's genuinely excellent (keep it)

- **The tabs are a real ARIA tabs widget.** It has roving tabindex, Home/End, `aria-controls` only where a panel exists, and a single shared `tabpanel` with a live `aria-labelledby`. This closes audit finding 14 properly instead of swapping to buttons.
- **The parity discipline.** Every Supabase line, string and attribute is untouched. The diff of `login-form.tsx` is structural only. This is what makes the phase safe to ship once B1 is fixed.
- **The disabled button is readable without opacity** (6.6:1 / 5.5:1) and clearly reads as unavailable. It fixes the before screen's washed-out blue. Keep it, but record it (P1).
- **Brand on the card.** The logo plus "Bird Bowl Parties", the `--radius-lg` card and `--shadow-md` make the sign-in look like the same product as the redesigned header. It is a big step up from the anonymous before card.
- **The error and removed banners have an icon plus text,** so the danger state is not colour alone.
- **`AuthCard` is a small shared shell,** so pending and login cannot drift apart.

## Scores (1 to 5)

| Area | Before | After R1 |
|---|---|---|
| Brand identity | 1 | 4 |
| Visual hierarchy | 3 | 4 (M7: pending has a red primary) |
| Consistency / tokens | 2 | 3 (M4 banner fork, P1 disabled fork, M6 no toggle) |
| Density and scanability | 3 | 4 |
| Responsive: phone | 3 | 4 (P4 edge-to-edge not applied) |
| Responsive: ultrawide | 2 | 4 (fixed-width card, as the spec says) |
| Accessibility | 2 (finding 14) | 3 (B1; 4 once fixed, 5 with M1/M2/M5) |
| States (empty, error, status) | 2 | 3 (M3 pending status tone) |
| Theming (light/dark) | 1 | 3 (B1 dark chip reads recessed; M6) |
| Craft vs Linear/Stripe | 2 | 4 |

## Round 2 requests

1. Apply B1 (required). M1 to M5 are recommended in this phase because they touch the same markup. Record M6, M7, P1 and P4 as either fixed or decided in `decisions.md`.
2. Capture outside the sandbox, using mocked `/auth/v1/*` routes (no real sends):
   - `/login` at 375 / 1280 / 2560, light and dark, showing the selected tab after B1
   - the code step and the verify error at 375 light and dark
   - the busy state ("Sending...")
   - keyboard focus on each tab
   - an axe run on each of these
3. `/pending` still needs Jeff's approval for a temporary pending account. Until then, it is verified from code only.
