# Phase 3 critique, round 3 (final): Staff "Your schedule" (`/app`)

Date: 2026-11-23. Critic: design critic. Worktree `.worktrees/redesign-pilot`. Read-only on app code.

## Verdict: PASS

- B1 is fixed exactly as specified, and the parent's in-browser measurements confirm it.
- N1 is recorded in `decisions.md` with the reason, and that entry explicitly supersedes the spec rows.
- No regressions were found.
- Parity is 3 of 3 audit items (4, 10 and 14), with all strings unchanged since round 2.

## Method and limits

- **Read:**
  - `phase3-critique-round-2.md`
  - the "After critic round 2" section of `phase3-manual-checks-round-2.md`
  - the new section of `decisions.md`
  - the Staff block, `globals.css:2008-2134`
  - `app/page.tsx` (126 lines)
  - `git diff` for the whole worktree
- **No critic-run browser.** Playwright is not installed in the worktree or globally. In rounds 1 and 2, Chromium was killed by the sandbox. So this round relies on the code plus the parent's measurements. I checked those measurements for internal consistency against the CSS (see below).
- **No new data screenshots with the fix.** The test data had already been restored. This is not blocking because the normal-spacing geometry is provably unchanged (see "Normal-spacing layout").

## B1: resolved

- **Code:** `globals.css:2113-2124`. Inside `@media (min-width: 640px)`, `.staff-item` now uses `grid-template-columns: minmax(var(--staff-time-col), max-content) minmax(0, 1fr)`, keeps `gap: var(--space-4)` and `align-items: start`, and `.staff-time` keeps `white-space: nowrap`. This matches the round 2 fix word for word. A comment at `:2115` records why the track can grow.
- **Parent's measurements check out against the CSS.**
  - At 1280 the card's left content edge is 320 (centred 640 container) + 1 (border) + 16 (padding) = 337.
  - Normal spacing: 337 + 216 = 553, plus the 16px gap gives 569. This matches the reported "553 vs 569".
  - With 1.4.12 spacing: 337 + 254 = 591, plus 16 gives 607. This matches "591 vs 607".
  - The spaced width of 254px matches my round 2 calculation (194 + 49 + 11).
- **640px boundary (worst case, computed).**
  - `.page` padding is 16px, so `.staff` is 608px and the card's content box is 574px.
  - Spaced: 254 + 16 leaves 304px for details.
  - Normal: 216 + 16 leaves 342px.
  - `.staff-body` is `minmax(0, 1fr)`, and the name, meta and notes all have `overflow-wrap: anywhere`, so nothing can push the card wider.
  - Note that `.page` has `overflow-x: clip`, so "no horizontal scroll" on its own would not prove there is no overflow. The parent's edge-to-edge comparison (time right edge vs details left edge) is the right check, and it passed at both 700 and 1280.
- **Below 640px:** unchanged. The layout is a single column and `nowrap` does not apply.

## Normal-spacing layout: unchanged

- `minmax(216px, max-content)` resolves to 216px whenever the time's max-content width is under 216px. The longest slot is 194px (parent measurement), so every card gets exactly the same 216px track it had in round 2.
- This means the time and details columns line up across cards just as before. The parent confirms this at 1280 (553/569 normal).
- **Ultrawide:** `.staff` is capped at `--staff-max: 40rem`, so 1920 and 2560 render the same card geometry as 1280.
- **One minor point:** under user text spacing, each card sizes its own time track. A long slot's details could therefore start up to about 38px further right than a short slot's details in the same day. That is the correct trade-off, because it keeps everything readable with no overlap, and it only happens when the user overrides spacing. Not an issue.

## N1: adequately recorded

`decisions.md:26-29` adds "Design lead decisions during rollout". It covers:

- **The pills.** "Details hidden" is neutral with the `lock` icon. "Details shown" is success with `lock-open`. The entry gives the reason (blue is reserved for the focus ring, per decision 9) and states that it supersedes spec 3.9, 4.2 and 7.
- **The double Sign out,** with the spec references.

This closes the drift risk I raised. `design-system.md` itself still has the old wording at lines 401-402, 485 and 534. That is acceptable while the decisions entry supersedes it (see the non-blocking items).

## Regressions: none

- `git diff --stat` touches only three files: `design/decisions.md` (5 lines added), `web/src/app/app/page.tsx` and `web/src/app/globals.css`.
- The `globals.css` diff is purely additive: 0 removed lines, and every added line is in the Staff block. Other screens cannot be affected.
- The Staff block has no hex, `rgb()` or px literals. The only literals are the two named rem variables and the media query breakpoints.
- `page.tsx` is unchanged since round 2:
  - the verbatim strings (`:55`, `:58`, `:72`, `:100`)
  - the `.vh` slot label plus `aria-hidden` visible time
  - the `.vh` comma in the day heading
  - the POST `/auth/signout` form placed last

## Remaining items (all non-blocking)

1. **Spec text sync (doc only).** Update `design-system.md` 3.9 (lines 401-402), 4.2 (line 485) and section 7 row 4 (line 534) to "Details hidden / neutral / `lock`" and "Details shown / success / `lock-open`". Do this when the spec is next edited, so future readers do not need to cross-reference `decisions.md`.
2. **Dead class (polish).** `page.tsx:69` still adds `staff-hidden` to hidden cards, but no CSS rule uses it anymore. Either remove it (`className="staff-item"` always) or keep it on purpose as a test hook. Either way it has no visual effect.
3. **N2 (agreed, kept as is).** The empty state is only the verbatim "No upcoming parties." line. Strike the second sentence from spec 3.10 at the next spec edit.
4. **N3 (deferred app-wide).** There is no `loading.tsx` card placeholder. Track it with the app-wide loading-state work.
5. **Deferred from round 1.** P3 (h1 `display` size), the header wrap at about 800px, and the staff phone nav row.
6. **Next time data is seeded (verification gap, not a defect).** Take one 1280 light and one 1280 dark screenshot showing a revealed and a hidden slot, to put the one-line time column on record visually.

## WCAG 2.2 AA

- 1.4.12 text spacing now passes at 640px and up, per the parent's measurements and my arithmetic.
- Every other criterion is unchanged from round 2 and passing:
  - contrast in both themes
  - landmarks and heading order
  - list names
  - a single announcement of each slot label
  - Sign out as the last tab stop
  - targets of 44px or more
  - reflow at 320
  - reduced motion
  - forced colours
- Caveat: there was no axe run in any round because of the sandbox. Run an axe pass when a browser is available, as a confirmation rather than a gate.

## Parity: 3 of 3 verified

- **Item 4:** the `my_schedule` 14-day fetch, the verbatim slot label, the reveal sentence, the revealed fields and the error alert.
- **Item 10:** Sign out, both in the page and in the header.
- **Item 14:** the empty state, shown only when there is no error.

## Scores (1 to 5)

| Area | Before | R1 | R2 | R3 |
|---|---|---|---|---|
| Brand identity | 1 | 3 | 4 | 4 |
| Visual hierarchy | 2 | 2 | 4 | 4 |
| Consistency / tokens | 2 | 3 | 4 | 4 |
| Density and scanability | 2 | 4 | 4 | 4 |
| Responsive: phone | 2 | 3 | 4 | 4 |
| Responsive: ultrawide | 2 | 4 | 4 | 4 |
| Accessibility | 3 | 4 | 3 | 4 |
| States (empty, error, status) | 2 | 3 | 4 | 4 |
| Theming (light/dark) | 2 | 3 | 4 | 4 |
| Craft vs Linear/Stripe | 2 | 3 | 4 | 4 |

## Keep (do not "fix" away)

- **The `minmax(var(--staff-time-col), max-content)` track.** It is fixed and aligned normally, and it grows only when the user needs it. Do not revert it to a plain fixed track or remove `nowrap`.
- **The phone card order:** time, then name and pill, then meta, then notes under a hairline. Every card uses the same surface.
- **The neutral "Today" / "Tomorrow" chip,** and the visually hidden comma in the heading.
- **The `.vh` slot label with `aria-hidden` visible time.**
- **The full-width in-page Sign out,** present in every state.
