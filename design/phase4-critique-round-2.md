# Phase 4 critique, round 2: Admin users and settings

Date: 2026-11-23. Critic: design critic (Opus 5.5). Scope: `/admin/users` and `/admin/settings` in the `redesign-pilot` worktree. I did not change any application code.

## Verdict: PASS

B1 is fixed. All the Medium items (M1 to M6) and the Polish items that were applied (P1, P2, P4, P6) are resolved. M7, P7, N5 and the no-JS trade-off are recorded in `decisions.md`.
- Parity: 12 of 12.
- WCAG 2.2 AA: no failures found.
- Critical/High issues open: none.

What is left is one Medium alignment issue (R2-M1) and three small Polish items. None of them blocks the phase. Fix R2-M1 before rolling the pattern out further.

### Evidence used

- **Code:** `git diff HEAD` (`decisions.md`, `nav.tsx` deleted, `settings/page.tsx`, `users/page.tsx`, `icons.tsx`, `globals.css`), plus the untracked `users/user-row.tsx`. To check the help text I read `lib/engine.ts`, `lib/admin.ts` and `supabase/migrations/0001_init.sql`. I also grepped 0002 and 0003; neither touches these settings.
- **Screenshots:** the parent session's real-browser captures with an admin login, all listed in `phase4-manual-checks-round-2.md`:
  - users 1440 light (`...-pg18mi.jpg`)
  - users 1024 dark (`...-q7ua5r.jpg`)
  - users 720 / 200% zoom (`...-88xrv7.jpg`)
  - keyboard focus (`...-ys2uv6.jpg`)
  - settings 1280 light (`...-8au0d1.jpg`)
  - settings 375 light (`...-1ph8nu.jpg`)
- **Checks I ran:**
  - `tsc --noEmit`: clean.
  - `vitest run`: 6 files, 73 of 73 passed.
  - grep of the added CSS: no hex, `rgb(` or `hsl(` values.
  - Contrast for the new pill colours, computed from the tokens.
- **Not verified:**
  - axe-core has not been run on either admin screen. The parent's browser pane has no axe, and I have no admin session. This is carried forward from critique-round-3 F4. It is not a blocker, because a manual check of the code covers labels, names and contrast.
  - The zero-pending state (M4) has no capture, so I judged it from the code only.
  - Users at 375 dark and settings in dark were not captured this round. Dark tokens are shared and already verified elsewhere.

## Round 1 items

| Item | Status | Evidence |
|---|---|---|
| **B1** pending row unlabelled at 1024+ | **Resolved** | A shared `UsersHead` is now rendered above both lists (`users/page.tsx:8-19, 61, 77`). The `display:none` rule for the pending header is gone. Screenshots `pg18mi` and `q7ua5r` show User / Status / Role / Host tier / Daily cap above the pending row. Each control still has its own `<label htmlFor>` (`user-row.tsx:99-133`). |
| M1 header type | Resolved | `globals.css:2228-2236` now uses `--text-small`, weight 500, letter-spacing 0.005em, sentence case, and no `text-transform`. |
| M2 pills | Resolved | `user-row.tsx:62-78`: Pending is warning + `Clock`, Active is success + `Check`, Removed is danger + `Ban`, all in sentence case. The option text is still lowercase. The `Clock` paths match Lucide `clock` (`icons.tsx`). Contrast: danger pill 5.97:1 light and 7.25:1 dark; warning pill 5.43:1 and 9.33:1. |
| M3 pending Save primary | Resolved | `user-row.tsx:140`. Brand red is correct for the primary action under spec 1 rule 1; `btn-danger` stays for "Yes, remove" only. |
| M4 quiet empty state | Resolved (code only) | `users/page.tsx:56`: the frame class is applied only when `pending.length > 0`. The text "No requests waiting." is unchanged. |
| M5 help text | Resolved, all accurate | See "Help text verification" below. |
| M6 settings alignment | Resolved | `.setting-unit { width: var(--space-16) }`, `--setting-input: 160px`, `.admin-settings { max-width: 720px }`. The parent measured all inputs at x=615 and all Saves at x=863. Screenshot `8au0d1` confirms both columns are flush. |
| M7 row semantics | Resolved by decision | `decisions.md`: "Admin rows use the list pattern". |
| P1 duplicate email | Resolved | `user-row.tsx:96`. `pending@example.com` appears once (`88xrv7`, `pg18mi`). |
| P2 confirm overflow | Resolved | `globals.css:2276-2277` sets `width: fit-content; max-width: 100%`. |
| P3 pending confirm copy | Skipped as instructed | Still open as optional polish. Not re-raised. |
| P4 max width 1200 | Resolved | `globals.css:2096`. |
| P5 focus after remove | Skipped as instructed | Not re-raised. |
| P6 inputMode | Resolved | `settings/page.tsx:7, 117`. Only the three integer keys get it, and `type="text"` and `required` are unchanged. |
| P7 grouping | Resolved by decision | `decisions.md`. |
| N5 and the no-JS trade-off | Resolved | `decisions.md`, two entries. The wording ("do not re-enable the option without a confirm, and do not add a second no-JS removal path") is the right guard. |

### Help text verification (M5)

| Setting | Help claim | Source | Verdict |
|---|---|---|---|
| Fairness window | Days back to count each host's parties, 1 to 365 | `engine.ts:72-73` (`inWindow`), `admin.ts` (1 to 365) | Accurate |
| Hostess average allowance | How much higher a party hostess's average kids per party may be than the team average, %, 0 to 100 | `engine.ts:68-69` (`ceilingFor`, tier 1 only, `teamAverage * (1 + pct/100)`), `admin.ts` (0 to 100), migration `:30` | Accurate. See Polish R2-P3 for a nuance. |
| Cutoff day | The day in the week before each schedule week, 1 is Monday, up to 7 for Sunday | `0001_init.sql:151-154`: `p_week_start + (dow - 1) - 7`, where week_start is a Monday (`:191`) | Accurate. dow=3 lands on the prior Wednesday, which matches the migration comment "Wednesday … of the prior week". |
| Cutoff time | Time of day on the cutoff day, 24-hour, like 08:00 or 18:30 | `:153`, `admin.ts` `TIME` regex `^([01]\d\|2[0-3]):([0-5]\d)$` | Accurate. The examples match the validator's error text. |
| Reveal time | Staff see party details from this time on the day of the party | `0001_init.sql:290-306` (`reveal_at = party_date + reveal_time`) | Accurate |
| Bowling cutoff | Bowling parties that start *after* this time go to servers only | `engine.ts:78` (`party.start > bowlingServerAfter && tier !== 3`, strict) | Accurate |

## Parity: 12 of 12 verified

Nothing has changed since round 1 in what is submitted:
- The same `updateProfile` and `updateSetting` actions.
- Hidden `id` and `key` fields.
- The `status`, `role`, `tier` and `daily_cap` names, values, option text and `defaultValue`s.
- `value` text input with `required`.
- The `?msg=` banner in `role="status"` and the load error in `role="alert"` with the same text.
- "No requests waiting."
- The pending section is first.
- `/admin` still redirects.
- Header Users, Settings and Sign out.
- The self-change guard in `lib/admin.ts:48-52`.

`inputMode` and the pill and button classes are presentational only. `actions.ts` is not in the diff. The remove confirm logic (`user-row.tsx:35-60, 108`) is byte-identical to round 1, so the safety analysis from round 1 still holds.

## Accessibility (WCAG 2.2 AA)

| Check | Result |
|---|---|
| 3.3.2 Labels | **Pass (was the B1 fail).** A visible column header now sits over every dense row at 1024px and up. Below 1024px the labels are visible on the cards (`88xrv7`). |
| 1.3.1 / 4.1.2 | Pass. Each select has a real `<label>`. The header is `aria-hidden`, so names are not announced twice. Each form is named "Edit <name>". |
| 2.5.3 Label in name | Pass. "Save <name>" and "Save <setting label>". |
| 1.4.3 Contrast | Pass in both themes. The new danger pill is 5.97:1 light and 7.25:1 dark. The others are unchanged from round 1. |
| 1.4.1 Use of colour | Pass. Every pill has an icon and a word. |
| 2.4.7 / 2.4.11 Focus | Pass. A 2px solid focus outline is visible on a dense select (`ys2uv6`). No ancestor clips it. |
| 1.4.10 Reflow / 1.4.4 Resize | Pass. 720px (200% at 1440) gives cards with visible labels and scrollWidth 720 (`88xrv7`). Settings at 375 has no horizontal scroll (`1ph8nu`). |
| 2.5.8 Target size | Pass. Dense 32px controls apply only to fine pointers at 1024px and up; coarse pointers keep 44px. |
| axe-core | **Not run** (see "Not verified"). Run it before the phase is merged to main, as it is the last missing automated check across phases 2 to 4. |

## Issues

### Critical / High

None.

### Medium

**R2-M1. The pending grid and the "Everyone else" grid do not line up.**
- **Where:** `/admin/users`, 1024px and wider.
  - Screenshot `pg18mi`: the pending Status select and Save sit about 17px left of the columns below.
  - Screenshot `q7ua5r`: pending Save is at roughly 460 to 525 in the capture, while the other Saves are at roughly 470 to 535.
  - Screenshot `ys2uv6` shows the same offset.
- **What's wrong:** two stacked grids share one set of column headers, but their columns are offset. The fixed columns line up with the right edge of each container. The pending container is inset by `.admin-pending { padding: var(--space-4) }` plus its 1px border (`globals.css:2116-2121`), so its whole column set moves left by `--space-4 + --border-width`. On a screen designed as one aligned grid this is the most visible craft flaw, and it is the kind of thing Linear or Stripe would not ship.
- **Rule:** spec 3.10 / 4.5 (one aligned grid per user under a column header), and alignment craft.
- **Fix (CSS only):** in `web/src/app/globals.css`, inside the existing `@media (min-width: 1024px)` admin block, add:
  ```css
  .admin-pending {
    margin-inline: calc(-1 * (var(--space-4) + var(--border-width)));
  }
  ```
  This pulls the frame out by its own padding and border. Its inner grid, header and "Pending approval" heading then line up exactly with "Everyone else" and with the "Users" h1. Page padding at 1024px and up is `--space-8` (32px), so the 17px outdent cannot overflow. Leave the rule out below 1024px, where the rows are cards and nothing needs to align.

### Polish

**R2-P1. Dead CSS rule.**
- **Where:** `globals.css:2127-2129`, `.admin-pending .empty { padding: var(--space-4); }`.
- **Problem:** since M4, `.empty` only renders when the `admin-pending` class is absent, so this selector never matches.
- **Fix:** delete the rule.

**R2-P2. A one-off literal in the settings width.**
- **Where:** `globals.css:2301`, `.admin-settings { max-width: 720px; }`.
- **Problem:** this is the only raw pixel width in the admin block that is not one of the local custom properties declared on `.admin` (`:2095-2105`).
- **Fix:** add `--settings-max: 720px;` to the `.admin` property list and use `max-width: var(--settings-max);`. The value stays the same.

**R2-P3. The allowance help reads as a hard limit, but it is a preference.** This is optional.
- **Where:** `settings/page.tsx:29`.
- **Why it matters:** in `engine.ts:192-199`, going over the ceiling only ranks a hostess lower, and only after "fewest parties this week". A hostess with fewer parties can still be given one that takes her over. "May be" is close enough for an admin to use, but it is slightly stronger than what the code does.
- **Suggested text:** "How much higher a party hostess's average kids per party can be than the team average before the schedule prefers someone else, in percent. A whole number from 0 to 100."

## What's genuinely excellent (do not "fix" away)

- **The remove confirm.** It is disabled before hydration, has a submitter check, focuses "Keep user" by default, and Escape or Keep restores the saved value. It is unchanged from round 1 and is still the reference pattern for the app.
- **The shared `UsersHead` component.** It fixes B1 without duplicating markup.
- **Settings alignment.** The settings page now has a clean two-column rhythm with flush inputs and Saves (`8au0d1`). At 375px the Save wraps to the right on its own line, with no horizontal scroll (`1ph8nu`).
- **The help text.** It is accurate against the engine, the validator and the SQL. Every example matches the validator's own error message.
- **The pill set.** The pills are now consistent with the rest of the app: sentence case, an icon plus a word, and the correct tone tokens.
- **The decisions log.** The `decisions.md` entries name exactly what supersedes the spec and why, so the next builder will not drift back.

## Scores (1 to 5)

| Area | Before | After R1 | After R2 |
|---|---|---|---|
| Brand identity | 1 | 4 | 4 |
| Visual hierarchy | 2 | 4 | 5 (primary pending Save, quiet empty state) |
| Consistency / tokens | 2 | 3 | 4 (R2-P2 literal) |
| Density and scanability | 1 | 5 | 5 |
| Responsive: phone | 2 | 4 | 5 |
| Responsive: ultrawide | 2 | 4 | 4 (1200 cap; not re-captured at 2560) |
| Accessibility | 3 | 3 | 4 (5 once axe is run clean) |
| States (empty, error, status) | 2 | 3 | 4 (empty state judged from code) |
| Theming (light/dark) | 2 | 4 | 4 |
| Craft vs Linear/Stripe | 2 | 4 | 4 (R2-M1 grid offset) |

## Requests before merge (parent session)

- Apply R2-M1, then re-capture users at 1440 light to confirm the pending and "Everyone else" columns are flush.
- Run axe with a scratch `@axe-core/playwright` on `/admin/users` and `/admin/settings`, in light and dark. Do not save anything and do not press "Yes, remove".
