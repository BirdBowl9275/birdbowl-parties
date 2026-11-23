# Phase 4 critique, round 1: Admin users and settings

Date: 2026-11-23. Critic: design critic (Opus 5.5). Scope: `/admin`, `/admin/users`, `/admin/settings` in the `redesign-pilot` worktree. I made no changes to application code.

## Verdict: FAIL

The verdict is FAIL because of one blocking issue (B1). From 1024px up, the pending-approval row shows four selects with no visible labels. This fails WCAG 2.2 SC 3.3.2. Everything else is in good shape:
- Parity holds (12 of 12).
- The remove confirm is safe, and it cannot be bypassed from the UI.
- Contrast passes in both themes.

The other items below are non-blocking. Most are small fixes to bring the screen in line with the spec. Fix B1 and M1 to M6, and round 2 should pass.

### Evidence used

- **Code:** `git diff HEAD` (4 files: `nav.tsx` deleted; `settings/page.tsx`, `users/page.tsx` and `globals.css` modified), plus the new untracked `users/user-row.tsx`. I also read `actions.ts`, `admin/page.tsx`, `lib/admin.ts`, `lib/engine.ts`, `lib/engine-data.ts`, `middleware.ts`, `site-header.tsx` and `supabase/migrations/0001_init.sql`.
- **Screenshots:** the parent session's real-browser captures with an admin login (listed in `phase4-manual-checks.md`):
  - users 1280 light (`...-470i5t.jpg`)
  - confirm open (`...-hrb88d.jpg`)
  - users 375 (`...-wd1w1m.jpg`)
  - users 2560 (`...-y0y2xh.jpg`)
  - settings 1280 dark (`...-rnffbq.jpg`)
  - before set: `phase4-before.md`
- **Checks I ran:**
  - `tsc --noEmit`: clean.
  - `vitest run`: 6 files, 73 of 73 passed.
  - grep of the added CSS: no hex, `rgb(` or `hsl(` values. The pixel values are only column widths declared as local custom properties on `.admin`, plus the standard visually-hidden clip.
  - Contrast was computed from the token values (see the accessibility section).
- **Not verified by me:** I have no admin session, so I did not run Playwright or axe on these screens. Missing captures:
  - users in dark theme
  - settings at 375
  - exactly 1024px
  - the empty pending state
  - 200% zoom

  These are listed under "Round 2 requests".

## Parity: 12 of 12 verified

| # | Item | Result | Evidence |
|---|---|---|---|
| 8 | Status, role per user; approve | Pass | `user-row.tsx:97-120`. `name="status"` and `name="role"`, options from the unchanged `STATUSES`/`ROLES`, `defaultValue` as before. The pending section is still first (`users/page.tsx:43-55`). |
| 9 (audit numbering: tier/cap) | Tier "Not a host" ''/1/2/3 with the same option text; cap 0 to 3 | Pass | `user-row.tsx:121-137`. Values and labels are byte-identical to the deleted `UserForm`. |
| Hidden `id` | Pass | `user-row.tsx:89` |
| Action | `updateProfile` from `../actions`, unchanged; passed as a prop | Pass | `users/page.tsx:2,49,70` |
| 10 (audit: settings) | Six settings, each with its own form and Save; hidden `key`; `value` text input, `required`; `updateSetting` | Pass | `settings/page.tsx:101-122`. Only keys present in the table render (`:95`), as before (`r.key in LABELS`). |
| Messages | `?msg=` shown in `role="status"`; load error in `role="alert"` with the same text "Could not load users." | Pass | `users/page.tsx:30-41`, `settings/page.tsx:87-92`. Same banner pattern as sales and manager. |
| Redirects | All come from the untouched `actions.ts` | Pass | `git diff --stat` does not include `actions.ts` |
| `/admin` | Still redirects to `/admin/users` | Pass | `admin/page.tsx` is unchanged; the parent verified it |
| Sign out (audit 10) | Still reachable for admins | Pass | `site-header.tsx:67` is a form POST to `/auth/signout` on every admin page. On phones it is icon-only with a `.vh-md` text name. Users and Settings links are at `site-header.tsx:18-19`. |
| 14 / finding 2 | "No requests waiting." | Pass | `users/page.tsx:45`, same text, now in `.empty` style |
| Self-change guard | Unchanged | Pass | `lib/admin.ts:48-52`. The parent's note is correct: the confirm shows first, then the server error appears. |
| Nothing else imported `nav.tsx` | Pass | grep shows no remaining reference |

Settings display order changed from alphabetical-by-key to grouped. That is display only, it is allowed by spec 4.6, and it is not a parity issue.

## Remove confirm (decision 1)

**Safe before hydration: yes.** The server HTML and the first client render both have `disabled` on the "removed" option, so hydration matches. Only the effect that runs after hydration enables it (`user-row.tsx:34-36, 107`). Users who are already removed keep the option enabled and selected. That is correct, because re-saving them is not a new removal.

**Cannot be bypassed from the UI: confirmed.**
- **Keyboard Enter.** The form has no text inputs, so implicit submission cannot happen. Even if a browser did submit on Enter in a select, every submission path runs through `onSubmit`:
  - a click
  - Enter or Space on Save
  - `requestSubmit()` with a null submitter
  
  `onSubmit` checks the live select value against the saved status (`:49-52`). Only the `yesRef` submitter skips the check (`:44`).
- **Re-ordering.** Two cases are covered:
  - Rows are keyed by `r.id` (`users/page.tsx:47,68`), so when tied `created_at` values reorder rows after a save, confirm state stays with the right user.
  - In DOM order, "Yes, remove" comes after Save, so it is never the form's default button.
- **Changing status while the confirm is open** closes it (`:104`). Pressing Save again with "removed" still selected re-opens it.

**Keep, Escape and focus: correct.** Focus moves to "Keep user", which is the safe default (`:38-40`). Keep and Escape reset the select to the saved value and return focus to it (`:55-59, 85-87`). The group is named by the question text, so screen readers announce it when focus lands on Keep. The parent confirmed this in a real browser.

**No-JS trade-off: recommendation is to accept it.** Do not build a `details` fold.
- The only person who loses anything is an admin whose JavaScript has failed, and that admin can still approve, change role, tier and cap.
- The failure direction is safe: nobody is removed by accident.
- The app already needs JS for its theme control and the confirm patterns on other screens.
- A second, no-JS removal path would add a second UI for the most dangerous action on the screen, on the screen's densest row.

Record this in `design/decisions.md` as a design-lead decision, so nobody "fixes" the disabled option later. See N5.

**The confirm copy is accurate.** "They lose access immediately" matches `middleware.ts:35-44`, which ends the session for a removed status on the next request. For pending users see P3.

## Accessibility (WCAG 2.2 AA)

| Check | Result |
|---|---|
| 3.3.2 Labels or instructions | **Fails on the pending row at 1024px and up (B1).** The "Everyone else" rows pass: the visual column header names each column, and each select has a real `<label>`. |
| 1.3.1 Info and relationships | Pass. Each select has `<label htmlFor>` (`user-row.tsx:98-132`). The header is `aria-hidden` and the labels are visually hidden at laptop width, so screen reader users get each name once per control. A list of named forms is a valid structure, and it is the same pattern sales parties uses. It differs from spec 3.10's table roles; see M5. |
| 2.5.3 Label in name | Pass. Save is named "Save Test Sales" (`:140`) and settings Save is named "Save Fairness window" (`settings/page.tsx:116`). The visible "Save" starts each name. The select names ("Status", and so on) match the column header text. |
| 1.4.3 Contrast, light | Pending h2 `--warning-fg` on `--warning-bg` 5.43:1. Success pill 5.28:1. Neutral pill and removed-row muted text on `--surface-sunken` 7.03:1. Muted text on the warning frame 7.2:1. All pass. |
| 1.4.3 Contrast, dark | Pending h2 9.33:1. Success pill 8.82:1. Muted text on sunken 6.5:1, on surface 6.99:1. All pass. |
| 1.4.11 Non-text contrast | The warning frame border (1.51:1) and the dashed removed border are decorative. The meaning is carried by the h2 text and the pill word. Pass. |
| 1.4.1 Use of colour | Pass. Each pill has an icon and a word. Removed rows are dashed and dimmed, and they also have the word. |
| 2.5.8 Target size | Pass. Dense controls are 32px, only for `pointer: fine` at 1024px and up (`globals.css` "Dense 32px controls"). Coarse pointers keep 44px. Gaps are at least 6px. |
| 2.4.7 / 2.4.11 Focus | Global `--focus` outline. No `overflow: hidden` on `.urow` or `.setting` that would clip it. Pass in code; I did not see a focus screenshot in this round. |
| 1.4.10 Reflow | 200% at 1280px gives a 640px viewport, which uses the tablet auto-fit layout. 400% gives 320px, which uses the 2-column cards. The settings controls wrap below 640px. Pass in code; not captured. Watch `.ucell-confirm { width: max-content }` (P2). |
| Settings help | `aria-describedby` links the help text and the unit (`settings/page.tsx:112`). Good. |

## Issues

### Blocking

**B1 (High): the pending row has no visible labels at 1024px and up.**
- **Where:** `/admin/users`, laptop and wider. Screenshot `mcp-Claude_Browser-blob-1795445578515-470i5t.jpg`, top frame. The row reads "pending | staff | Not a host | 3 | Save" with nothing naming the columns. "3" and "staff" mean nothing on their own, and this is the row an admin acts on most.
- **Cause:**
  - `globals.css:2274` `.admin-pending .ulist-head { display: none; }`. The header is not rendered for the pending list anyway (`users/page.tsx:43-55`).
  - At the same time, `globals.css` (1024px block, `.urow .ucell label`) visually hides the per-control labels.
- **Breaks:** WCAG 2.2 SC 3.3.2. Also spec 3.10: "Each control keeps a real `<label>` (visually hidden at laptop+, visible on phone cards)". That rule assumes a header row is visible.
- **Fix (two files):**
  1. In `web/src/app/admin/users/page.tsx`, inside the `pending.length > 0` branch, render the same `<div className="ulist-head" aria-hidden="true">` block (User, Status, Role, Host tier, Daily cap, empty span) before `<ul className="ulist" aria-labelledby="pending-title">`. Better: extract it into a small `UsersHead` component used by both sections.
  2. In `web/src/app/globals.css`, delete the rule `.admin-pending .ulist-head { display: none; }` (line 2274).

  Do not make the labels visible inside the pending row instead. That would break the grid alignment with the rows below.

### Non-blocking, fix this round (Medium)

**M1. Column header style breaks the spec type rule and the other screens.**
- **Where:** `globals.css:2228-2238`, with `text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; font-size: var(--text-caption)`.
- **Breaks:** spec 2 type table (`design-system.md:213`): "`label` 13px/16px, 500, 0.005em … table column headers (sentence case, no all-caps)". The manager table header (`table.data thead th`, `globals.css:1082-1088`) follows the rule; this is the only all-caps header in the app.
- **Fix:**
  - Change the declarations to `font-size: var(--text-small); font-weight: 500; letter-spacing: 0.005em;`. If a `--text-label` token exists, use it instead of `--text-small`.
  - Remove `text-transform`.
  - Keep `color: var(--text-muted)`.

**M2. Status pills deviate from spec 3.9 without a recorded decision.**
- **Where:** `user-row.tsx:61-77`.
- **Breaks:** spec 3.9 (`design-system.md:398-400`): Pending is warning + `clock`, Active is success + `check`, Removed is danger + `ban`. The build uses `CircleAlert` for pending (the same icon as "Not assigned") and `pill-neutral` for removed. The labels are lowercase ("active"), while every other pill in the app is sentence case ("Assigned", "Cancelled").
- **Fix:**
  - Pending: copy Lucide `clock` into `web/src/app/components/icons.tsx` (decision 7 allows this) and use `<Clock />`.
  - Removed: use `pill-danger` (it exists at `globals.css:819`) with `<Ban />`.
  - Pill text: "Pending", "Active", "Removed". Display only; the select option text stays lowercase for parity.
  - If the design lead prefers neutral for removed (it is already dimmed and dashed), add that to `decisions.md` instead. Either way, the code and the spec must agree.

**M3. The pending Save should be primary.**
- **Where:** `user-row.tsx:139`. Every Save is `btn-secondary`.
- **Breaks:** spec 4.5 (`design-system.md:512`): "Save (secondary sm; primary on pending rows)". Approving a pending request is the screen's primary action (spec 4.5, first line).
- **Fix:** `className={row.status === 'pending' ? undefined : 'btn-secondary'}`. Unclassed `button` is the primary style. The existing `.urow .ucell-save button` width and height rules still apply.

**M4. The pending frame shouts when nothing is pending.**
- **Where:** `users/page.tsx:43-46` with `globals.css:2116-2129`. With zero pending, the result is a warning-tinted frame with an amber heading around a white "No requests waiting." box. That signals "attention needed" when none is.
- **Breaks:** spec 3.16 (empty states are quiet, `--text-muted`) and the meaning of the warning tone.
- **Fix:**
  - Add a modifier only when the list is empty: `className={pending.length ? 'admin-section admin-pending' : 'admin-section'}`.
  - The empty `.empty` box then renders like the other screens' empty states.
  - Keep the text "No requests waiting." exactly.
- **Note:** I inferred this from the code, not from a capture. Please capture it in round 2.

**M5. Settings help text is inaccurate or ambiguous against what the settings actually do.**

All 3 fixes are in `web/src/app/admin/settings/page.tsx`, inside `GROUPS`.

- **`hostess_avg_allowance_pct` (`:28`).** The current text is "How far above the team average a party hostess may go." It does not say average *of what* or *in what unit*. `engine.ts:66-67, 174-177` caps the hostess's average kids per party at the team average plus this percentage (see also the migration comment at `0001_init.sql:30`). Use: "How much higher a party hostess's average kids per party may be than the team average, in percent. A whole number from 0 to 100."
- **`availability_cutoff_dow` (`:39`).** The cutoff falls in the week *before* the schedule week (`0001_init.sql:141, 152`: `p_week_start + (dow - 1) - 7`). Use: "The day in the week before each schedule week: 1 is Monday, 2 is Tuesday, up to 7 for Sunday." Change the group blurb (`:35`) to: "When staff must have their availability in, the week before each schedule."
- **Time help (`:45, :52, :58`).** The validator only accepts a two-digit hour (`lib/admin.ts:60`), so "8:00" is rejected. Make the three time help lines say, respectively:
  - "Time of day on the cutoff day, 24-hour, like 08:00 or 18:30."
  - "Staff see party details from this time on the day of the party, like 08:00."
  - "Bowling parties that start after this time go to servers only. 24-hour, like 18:00."

  The validator's error message already uses "08:00 or 18:30", so the help will match it.

The other text is accurate:
- Fairness window, 1 to 365, matches `lib/admin.ts:75` and `engine-data.ts:63,70`.
- Allowance range 0 to 100 matches `:80`.
- Cutoff 1 to 7 matches `:85`.
- Reveal time matches `0001_init.sql:290`.
- Bowling "after" is strict `>` (`engine.ts:78`), so "start after" is the correct wording.

**M6. The settings inputs do not line up down the column.**
- **Where:** screenshot `mcp-Claude_Browser-blob-1795445654841-rnffbq.jpg`. The "30" and "25" inputs sit about 4px to the right of the "3" and "20:00" inputs. The Save buttons follow the same drift.
- **Cause:** `.setting-unit { min-width: var(--space-10) }` (`globals.css:2350`, 40px). "24-hour" and "1 to 7" are wider than 40px, so each row's control cluster has a different width and is right-aligned.
- **Breaks:** alignment craft. The spec 4.6 row anatomy puts the input and Save in a fixed right column.
- **Fix:** in `globals.css`, replace `min-width: var(--space-10)` with `width: var(--space-16)` (64px, which fits "24-hour" at `--text-small`).
- **Also:** set `--setting-input: 160px` (spec 4.6 says the input is 160px) and change `.admin-settings` max-width to `720px` (spec 2 "forms never wider than 720px", `design-system.md:292` and 4.6). The current calc resolves to 844px.

**M7. Row semantics differ from spec 3.10. Decide, do not drift.**
- **Where:** `users/page.tsx:46-72` uses `ul`/`li` with an `aria-hidden` header. Spec 3.10 (`design-system.md:411`) and critique-round-3 follow-up F1 ask for the table pattern on per-row forms: `role="table"`, a visually hidden `role="row"` of `columnheader`s, and `form role="none"` wrapping a `div role="row"`.
- **This is not an AA failure.** Every control is labelled, and sales parties shipped the same list pattern in phase 2.
- **Fix, pick one:**
  - (a) Apply the R3-M1 pattern here. The admin screen is a true grid with a visible column header, so it is the best fit of the three screens.
  - (b) Add a `decisions.md` entry: "Per-row edit forms use `ul`/`li` with labelled controls; the table role pattern is only for the manager week." Then update spec 3.10.

  I recommend (b) for consistency with sales. Either way, it is non-blocking.

### Non-blocking (Polish)

- **P1. The email shows twice when there is no name.** `user-row.tsx:26, 95`. Pending users with no name show "pending@example.com" as the name and again as the contact line (screenshot `...-wd1w1m.jpg`). Fix: `const contact = row.email ?? row.phone ?? ''` and render `.user-contact` only when `contact && contact !== label`. (This answers manual-checks question 3.)
- **P2. The confirm can overflow on long names at 1024px and up.** `globals.css:2278-2282` sets `.ucell-confirm { width: max-content }`, and the text cannot wrap. Change it to `width: fit-content; max-width: 100%;`.
- **P3. The confirm copy is wrong for pending users.** "They lose access immediately" (`user-row.tsx:146`) is odd for someone who never had access. Optional: when `row.status === 'pending'`, use "Turn down <name>'s request? They won't get access."
- **P4. The admin max width is 1240px, but the spec says 1200px.** Spec 2 and 4.5 (`design-system.md:292, 511`). Set `--admin-max: 1200px` (`globals.css:2096`).
- **P5. Focus goes to the body after "Yes, remove".** The confirm unmounts (`:46`) while the action is pending. Focus is restored on the redirect, and the `role="status"` "Saved." banner announces the result, so this is acceptable. Optional: keep the confirm mounted with Yes `disabled` until the navigation completes.
- **P6. `inputMode` on the settings inputs.** Optional: `inputMode="numeric"` for the three integer keys. It only changes the phone keyboard. `type="text"` stays per spec 4.6, so validation is unchanged.
- **P7. Settings grouping differs from spec 4.6.** The spec says Availability / Assignment / Reveal. The build has Fair host assignment / Availability deadline / Day-of timing, with the bowling time under Day-of timing. The builder's grouping reads well, and the bowling cutoff is a time of day. Accept it, and note it in `decisions.md` with the M2 and M7 entries.

### N5 (document, no code)

Add the no-JS remove trade-off and the pending frame (instead of spec 4.5's "left bar on each row") to `decisions.md` as design-lead decisions.

## What is genuinely excellent (do not "fix" away)

- **The pre-hydration `disabled` guard combined with the submitter check.** It is fail-safe, hydration-stable, and uses the native form. It is the cleanest version of the confirm pattern in the app so far, so reuse it as the reference.
- **Focus defaults to "Keep user"**, and Keep and Escape restore the saved value.
- **The dense grid at 1024px and up**, with 32px controls only on fine pointers and 44px kept for touch. Eleven users fit on one laptop screen, compared with a long scroll before.
- **The pending section is isolated at the top.** It makes the one actionable thing obvious, which is the right hierarchy for this screen.
- **The settings help is tied to inputs** with `aria-describedby`, including the unit. The `.vh` suffix on each Save keeps the visible text short and the name unique.
- **The code diff is tight.** Nothing was removed except the tab strip, and there are no hard-coded colours.

## Scores (1 to 5)

| Area | Before | After R1 |
|---|---|---|
| Brand identity | 1 | 4 |
| Visual hierarchy | 2 | 4 (M3 would make the pending action primary) |
| Consistency / tokens | 2 | 3 (M1 all-caps header, M2 pills, M6 widths) |
| Density and scanability | 1 | 5 |
| Responsive: phone | 2 | 4 (P1) |
| Responsive: ultrawide | 2 | 4 (P4) |
| Accessibility | 3 | 3 (B1; 4 once fixed) |
| States (empty, error, status) | 2 | 3 (M4) |
| Theming (light/dark) | 2 | 4 (users dark not captured) |
| Craft vs Linear/Stripe | 2 | 4 (M6 alignment) |

## Round 2 requests (parent session, admin login)

Capture:
- users at 1024 and 1440, light and dark, after B1 (pending header visible)
- users with zero pending (M4)
- settings at 375 light and dark
- users at 1280 with 200% zoom
- a keyboard focus capture on a dense select and on Save

Then run an axe pass on both admin screens with a scratch `@axe-core/playwright` (critique-round-3 F4). Do not save any settings and do not press "Yes, remove".
