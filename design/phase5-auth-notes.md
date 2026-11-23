# Phase 5: login and pending

## Changes
- New `web/src/app/components/auth-card.tsx`: shared card shell (40px logo via static import of `brand-logo-128.png`, "Bird Bowl Parties", then the h1). Logo is decorative (alt="") because the name is beside it.
- `login/page.tsx`, `pending/page.tsx`: use AuthCard. Heading and body text verbatim. Removed notice now has an icon plus the same text, role="alert".
- `login/login-form.tsx`: markup and classes only. Supabase calls, validation, messages, autocomplete/inputmode and `window.location.assign('/')` untouched. Added `aria-busy` on the submit while busy, and an icon on the error banner.
- `pending/set-name-form.tsx`: classes and a field wrapper only. Same fields and messages. Sign out form posts to /auth/signout as a `btn-secondary`.
- `globals.css`: scoped "Auth" block. Retired `.notice`, `.card`, `.tabs`, `.tab`, `.tab-active` (grep: used only by these two screens). Kept `.secondary` (still used in manager/schedule) and `.card-title`/`.cards` (other screens).

## Tabs decision
The tabs already claimed role=tab, so they were completed as real ARIA tabs (the smallest correct option that keeps spec 3.8): tablist, tab, tabpanel wrapping both steps, aria-controls on the selected tab (pointing at the one panel), aria-labelledby on the panel, roving tabindex, Left/Right/Home/End select and focus. Selection resets the form exactly as a click did before. An aria-pressed control would not have needed a panel, but would depart from the spec and audit finding 14.

## Disabled button
Scoped to the card: grey `--surface-selected` fill, `--text-muted` text, `--border` border, not-allowed cursor, no opacity. Muted text on that fill is about 5.5:1 light and about 5.7:1 dark (estimated from token values, not measured in a browser). Enabled is brand red with `--on-brand` text.

## Parity (audit items)
1 Sign in by email/phone code, same errors (wrong/expired code, 429, unconfigured): logic unchanged.
2 Pending users see only pending and can set a name: unchanged.
3 Removed notice: same text, same `?reason=removed` trigger.
10 Sign out from pending: POST /auth/signout, unchanged.
12 Pending text, set-name form, sign out, redirect to /app when active: unchanged.
Finding 14 (tabs ARIA): fixed.

## States
- Contact: tabs, labelled input, primary disabled until non-empty, then brand red.
- Code: status line, code input, "Sign in", secondary "Use a different email/number".
- Busy: "Sending..." / "Checking..." / "Saving...", disabled, aria-busy.
- Error: bordered banner with icon, role=alert, above the button.
- Removed: banner on the login page above the tabs.
- Pending: card with text, name form, Sign out.
- Set-name saved/error: the existing message in a muted role=status line (unchanged strings, no colour change by outcome).

## Checks
- `./node_modules/.bin/tsc --noEmit`: clean.
- `./node_modules/.bin/vitest run`: 73/73 passed.
- No `\u` escapes in the changed files (grep). `next build` not run. No screenshots taken (not requested), so visual check is still needed in light, dark, 390px and ultrawide.

## Round 2 (critic round 1 fixes)
Applied: B1, M1, M2, M3, M4, M5, M6, M7, P2, P3, P4, P5. P1 recorded in decisions.md. Skipped: P6 (wording needs Jeff), P7, P8.
- B1: selected tab gets `--border-input` outline (3.11 light / 3.26 dark), weight 600, plus a `Highlight` 2px border under forced-colors.
- M1: focus moves to #code when the code step opens; "Use a different..." returns focus to the contact input (requestAnimationFrame). `#code` has `aria-describedby="code-status"` (plus `auth-error` while an error shows). Focus is not moved on tab switch.
- M2: tabs now use manual activation. Arrows/Home/End move focus only (`focusedTab` state drives the roving tabindex, reset to the selected tab when focus leaves the tablist). Enter/Space/click select via the existing onClick.
- M3: pending status has a tone (ok/info/error). Error uses `banner banner-danger` with CircleAlert, ok uses a success Check, info is plain. All keep `role="status"`; the `<p>` is always rendered so the live region exists before its text. Strings unchanged.
- M4: `.auth-alert` removed; login uses `banner banner-danger`; one rule `.auth-form .banner { margin: 0 }`.
- M5: `aria-describedby="auth-error"` on #contact while an error shows. No `aria-invalid` (as the critic advised).
- M6: ThemeToggle added to the AuthCard brand row (logo and name wrapped in `.auth-brand-id`).
- M7: Save name is `btn-secondary`, Sign out is `btn-ghost` (full width). Styling only. Open question for Jeff still stands: the two comments in set-name-form.tsx disagree about whether RLS lets a pending user update their name.
- P2/P3: magic 3px and the duplicate h1 margin are gone.
- P4 (spec 4.1): 48px logo, 28px heading (scoped `--auth-display: 1.75rem` on `.auth-card`, no global display token yet), 400px card, phone is edge-to-edge (no border, shadow or fill, page's 16px padding), laptop card sits lower via `margin-top: 12vh` with `.page:has(.auth-card)` top-aligned (approximation of "30% from top"; the 4.1 footer line "Bird Bowl" was not added).
- P5: `.auth-form #code` is 20px (`--auth-code: 1.25rem`), 0.2em letter spacing, tabular numbers.
- Spec 3.8 update suggestion (design-system.md not edited): add "and a `--border-input` outline, weight 600 (1.4.11)" to the selected segment.
- Checks: tsc clean, vitest 73/73 (see run below). `next build` not run. No screenshots; needs a visual pass, especially the phone edge-to-edge layout, the 12vh offset, and the toggle in the brand row at 320 to 390px.
