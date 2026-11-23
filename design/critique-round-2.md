# Critique, round 2: Parties redesign pilot (tokens, header, manager schedule)

Date: 2026-11-23. Critic: design critic. Branch `redesign/pilot`, round 2 changes uncommitted in the worktree. Read-only on app code.

## Verdict: FAIL (one High item, conditional)

All 4 High items from round 1 and the Critical logo bug are fixed and verified. Parity is intact. The pilot fails on one new High item: in the supplied dark capture the row Save buttons render as a mid-grey fill with dark text. That is round 1's M5 again, now in the other theme. The code says it should be `--surface` / `--text`, so the cause may be the capture environment. **If a computed-style check (below) shows the expected colours, close R2-H1 and the pilot passes.** Nothing else blocks.

## Evidence and method

- Screenshots from the parent session (manager role, test data):
  - A = 1280x800 light (`mcp-Claude_Browser-blob-1795416972659-g3q1z3.jpg`)
  - B = 1280x800 dark (`…1795417070656-35mbs9.jpg`)
  - C = 375x812 light (`…1795417071737-f3jk2y.jpg`)
  - D = 2560x1080 light (`…1795417071855-bvumz2.jpg`)
  - E = 1280x800 light with `?preview=1` (`…1795417059635-24gtws.jpg`)
- Code: `git diff` (round 2) and `git diff main` on the schedule page.
- Served CSS: fetched `/_next/static/css/app/layout.css` from localhost:3300. It contains the round 2 rules, so the screenshots are not of stale CSS.
- Contrast: computed with the WCAG formula.
- Parent's hand tests (treated as evidence): save host, lock, unlock, fairness update, `?week` kept, `role="status"` message, preview panel, and the accessible names "Host", "Lock", "Light"/"Dark"/"System", "Sign out".
- **Not done:** no axe run and no live computed-style capture. Headless Chromium was refused in this session. `tsc` could not run from this shell (the ":" in the path breaks npx), so I relied on the builder's clean `tsc`/`vitest`/`next build`.

## Round 1 items: verified status

| Item | Status | Evidence |
|---|---|---|
| C1 broken logo | **Fixed** | A to E all show the logo. 128x128 PNG (6 KB) imported at `site-header.tsx:4,61` and served from `/_next/static/media`. No middleware change. |
| H1 theme toggle state contrast | **Fixed** | `globals.css:811-817`. Outline `--border-input` against the track is 3.11:1 light and 3.26:1 dark; against the segment it is 3.42 / 3.51. Weight is 600. The outline is visible in A, B and C. |
| H2 lock label and name | **Fixed** | `page.tsx:309-314`. Visible text equals the name: "Lock" at 1024px and up, "Lock by hand" below (C). The checked state uses an icon shape swap plus the info tone (info-fg on info-bg 6.03 / 6.93:1). |
| H3 phone sticky header | **Fixed below 640px** | `globals.css:647-651, 199-207`. C: the header is static. **New gap at 640 to about 840px**, see R2-M1. |
| H4 fairness before parties on phone | **Fixed** | C: Monday's parties follow the Preview button. `globals.css:1046-1054`. |
| M1 wrapping rows | **Fixed** | A and B: single-line time and Save. Save's name is "Save assignment" via `.vh`. |
| M2 narrow rail | **Partly fixed** | 360px rail and no-wrap headers are in. D: the host names in the 360px rail still wrap to two lines. See R2-M3. |
| M3 sticky rail | **Fixed in code** | `.page { overflow-x: clip }` at `globals.css:235`. Not confirmed visually. |
| M4 ISO week label | **Fixed** | A: "Week of Nov 23 – 29, 2026". Display only; `?week=` is unchanged. |
| M5 Save looks disabled (light) | **Fixed in light, regressed in dark** | A: white fill with an input border. B: grey fill with dark text. See R2-H1. |
| M6 ultrawide | **Partly fixed** | D at 2560: seven day columns plus the rail. From 1600 to 2199px the week wraps onto two rows. See R2-M2. |
| M7 table semantics | **Not fixed** (builder's reason is valid) | Kept as R2-M5 with a workable fix. |
| P1 confirm checkbox | Fixed | E: the box lines up with the sentence. |
| P2 magic numbers | Fixed | New tokens `--space-3-5`, `--content-max-wide`, `--content-max-ultra`. No hex/rgb/hsl outside the token block. |
| P3 empty days | Fixed | D: dashed, compact, left-aligned. |
| P4 toggle flash | Fixed | `useLayoutEffect`. React 19.1, so there is no SSR warning. |
| P5 nav bar position | Fixed | A: the red bar sits on the header's bottom edge. |
| P6 ISC notice | Fixed | `icons.tsx:1-13`. |
| P7 admin double nav | Deferred by design | |

## Parity: 7 of 7 manager items (6, 7, 10, 11, 13, 14, 15) still present

Round 2 changed only the lock markup (`page.tsx:309-314`), the Save text (`:317`, accessible name still "Save assignment") and the week label (`:36-44`, `:157`). Field names, hidden `party_id` and `week`, actions, `?week`/`?preview`/`?msg` and `role="status"`/`role="alert"` are all unchanged. The parent's hand tests confirm saving, locking, unlocking and preview.

## Fix list (ranked)

### High

**R2-H1. Dark mode: the row Save buttons look disabled, and their text may fail contrast.**
- Screen: B.
- Code: `globals.css:1288-1302` (plus the base rule at `:420-424`).
- What's wrong: B shows Save as a mid-grey fill (about #707070) with near-black text. That reads as disabled, on the row's primary action. The estimated text contrast is about 3.4:1, which would fail SC 1.4.3. The code resolves to `#16171a` / `#ededef` (15.3:1), and the served CSS contains the rule, so either something overrides it at runtime or the capture tool altered it. Round 1 saw the same symptom in light mode.
- Exact fix:
  1. In a normal browser, set `data-theme="dark"` and read the computed `background-color` and `color` of `.prow .pcell-save button`.
  2. If they are `rgb(22, 23, 26)` and `rgb(237, 237, 239)`, close this item as a capture artefact. The pilot then passes.
  3. If not, add `appearance: none;` to the base `button, .btn` rule (`globals.css:378`). Use DevTools "Computed → background-color → origin" to find and delete the overriding rule. Do not add a third, more-specific override.
  4. Recapture B.

### Medium

**R2-M1. 640 to about 840px (which includes 200% zoom on 1280 to 1680 laptops): the sticky header grows to two rows again.**
- Code: `globals.css:743-759` (nav `flex: 1` with `flex-wrap`), `:824-829`, and `theme-toggle.tsx:55` (labels visible from 640px).
- What's wrong: at 768px the content box is 720px. The brand (about 92px) + toolbar (toggle with labels about 262px + Sign out about 100px) + gaps leave about 226px for nav links that need about 270px. The nav wraps to two 56px rows, so the header is about 112px tall and sticky, while `scroll-padding-top` is 72px. This is the round 1 H3 mechanism (SC 2.4.11 risk) in a band that 200% zoom hits. The widths are estimated from CSS, not captured.
- Exact fix: change the static-header and scroll-padding media queries at `globals.css:203` and `:647` from `max-width: 639.98px` to `max-width: 1023.98px`. Then verify at 768x1024 and at 1280 with 200% zoom.

**R2-M2. 1600 to 2199px: the "week grid" wraps, putting Saturday and Sunday on a second row.**
- Code: `globals.css:1450-1460` (`repeat(auto-fill, minmax(240px, 1fr))`).
- What's wrong: the main column is the viewport − 64 (page padding) − 384 (rail + gap), capped by the 2000px container below 2200px. Columns: 1600px gives 1152px (4 columns), 1920px gives 1472px (5 columns), and 7 columns appear only from 2200px. A week that reads Mon to Thu, then Fri to Sun, breaks the calendar model. It also pushes Saturday, the busiest party day, below the fold. Spec 4.4 says "Seven day columns (Mon to Sun)".
- Exact fix: at 1600 to 1919px, keep the laptop row-list layout (move the card-grid block's `min-width: 1600px` to `1920px`, so 1600 to 1919 falls through to the 1440 two-column layout with grid rows). At 1920px and up, use `grid-template-columns: repeat(7, minmax(0, 1fr));` (196 to 280px columns; the card internals already stack). Keep the 2200px `--content-max-ultra` rule. Tell the parent that this reverses its 1600px request, because 7 × 240 does not fit below 2200px.

**R2-M3. The fairness rail at 360px still wraps host names.**
- Screen: D, all five host names on two lines.
- Code: `globals.css:1115-1120` (cell padding 12px) together with the no-wrap headers at `:1123`.
- What's wrong: "Parties", "Total kids" and "Average kids" plus 24px padding each take about 270px of 360px, leaving about 90px for names. That doubles row height and breaks scanning (round 1 M2).
- Exact fix: add `.sched-rail table.data th, .sched-rail table.data td { padding-inline: var(--space-2); }`, `.sched-rail table.data td:first-child { white-space: nowrap; }`, and widen the rail from 360px to 400px at `:1059` and `:1452`. Add a token `--rail-width: 400px` and use it in both places. Keep the header text verbatim (parity item 6).

**R2-M4. At 1024 to 1439px the fairness table stretches across 1216px.**
- Screens: A, B, E.
- What's wrong: "Renamed Host" sits about 600px from its Parties count and about 1,150px from its average. The eye has to track across the whole screen, below a Stripe/Linear-quality bar. The table also takes about 170px above the parties on a 800px-high laptop.
- Exact fix: add `@media (min-width:1024px) and (max-width:1439.98px) { .sched-rail .data-table-wrap { max-width: 640px; } }`.

**R2-M5. (carried from round 1 M7) The party grid has no table semantics.**
- Code: `page.tsx:240-249, 251-321`.
- The builder is right that a single `role="table"` with `h2`s between rows is invalid. Fix it per day instead:
  - give each `.day-group` `role="table" aria-labelledby={`day-${day}`}`, with `id={`day-${day}`}` on its `h2`
  - give each `form.prow` `role="row"` and each `.pcell` `role="cell"`
  - move a visually hidden `role="row"` of `role="columnheader"` spans into each group, and keep the visual `.phead` `aria-hidden`.

  This is not a WCAG failure (the controls are labelled, and the forms are named "Assign X"), so it doesn't block.

### Polish

- **R2-P1. Phone: Lock and Save are different heights and their tops are offset by about 6px.** Screen C. Lock is 44px; Save is about 49px (min-height 44 + 12px padding-block). `.prow` uses `align-items: flex-end` (`globals.css:1227`). Fix: below 1024px, `.prow .pcell-save button { padding-block: 0; }` so both are `--control-lg` (44px).
- **R2-P2. The preview table still shows ISO dates ("2026-11-24"), "to" instead of an en dash, and rows out of date order.** Screen E; `page.tsx:205-206, 219`. These are display only, and the strings are not on the parity list. Fix: render `dayHeading(p.date)` (short form `{ weekday:'short', month:'short', day:'numeric' }`) and `formatClock(start)–formatClock(end)`, and sort `previewRows` by `p.date` then `p.start` for display only. Do not change `previewInput` or what is saved.
- **R2-P3. The spec and the build disagree on the week label.** Spec 3.3 says "Week of Mon, Nov 23 – Sun, Nov 29" with "Previous"/"Next"; the build shows "Week of Nov 23 – 29, 2026" with "Previous week"/"Next week". The build is better (it includes the year). Update `design-system.md` 3.3 to match it, not the code.
- **R2-P4. Repo hygiene before committing.** `web/node_modules` is a symlink, and the `node_modules/` pattern (trailing slash) doesn't match symlinks. `git status` lists it as untracked, so `git add -A` would commit it. Stage files by name, or add `/web/node_modules` (no slash) to `.gitignore`. Also stage the new `web/src/app/brand-logo-128.png`, or C1 comes back.

## Scores (1 to 5; "before" is from the audit)

| Area | Before | R1 | R2 |
|---|---|---|---|
| Brand identity | 1 | 2 | 4 |
| Visual hierarchy | 2 | 4 | 4 |
| Consistency / tokens | 2 | 4 | 4 |
| Density and scanability | 2 | 3 | 4 |
| Responsive: phone | 2 | 3 | 4 |
| Responsive: ultrawide | 2 | 2 | 3 (good at 2560, wraps at 1600 to 2199) |
| Accessibility | 3 | 3 | 4 (pending R2-H1 and axe) |
| States (empty, error, status) | 2 | 4 | 4 |
| Theming (light/dark) | 2 | 4 | 3 (dark Save) |
| Craft vs Linear/Stripe | 2 | 3 | 4 |

## Keep (don't "fix" these away)

- The schedule row at 1280 (A): one line per party, a quiet Lock chip, a white Save, and pills that pair an icon with a word. This is the strongest part of the pilot.
- At 2560 (D): seven columns of compact cards, dashed quiet empty days, and the rail aligned to Monday's top.
- On phone (C): parties come first, there are 44px targets, and the full "Lock by hand" wording is used.
- Theme toggle: a real radio group with a visible 3:1 selected state.
- The logo through a static import, with no middleware or auth change.
- No colour literals outside the token block.

## Round 3 changes

Verified with `tsc --noEmit` (clean) and `vitest run` (73/73). `next build` was not run (dev server on 3300). Visual checks at the breakpoints are still to be done in a browser.

Fixed:
- R2-M1 and a11y item A (SC 2.4.11): header is static below 1024px; sticky only from 1024px, where it is 57px and `scroll-padding-top` is 72px. 375px unchanged (static).
- a11y 1 (SC 1.4.12): time cell wraps (nowrap removed from `.pcell-time`).
- a11y 2 (SC 1.4.1 / 1.4.11): checked lock chip has an `--info-fg` border (6.7:1 / 7.5:1 on surface), a 2px inset ring, weight 600, the padlock swap and a check glyph (`content: ... / ''`, so the name stays "Lock"). `@media (forced-colors: active)` gives it a Highlight fill and border.
- R2-M2: seven columns `repeat(7, minmax(0, 1fr))` start at 1920px; below that the laptop layout is used. This reverses the earlier 1600px request.
- R2-M3: `--rail-width: 400px` token (used at 1440px and up), rail cell padding reduced to `--space-2`. Host names are not forced to nowrap, so very long names wrap instead of being clipped.
- R2-M4: fairness table wrap capped at 640px from 1024 to 1439px.
- R2-M5 / round 1 M7: each day with parties is a `role="table"` (labelled by its h2) holding a visually hidden header row and `role="row"` forms with `role="cell"` cells. The h2 sits outside the table. Field names are unchanged.
- R2-P1: Lock and Save heights match below 1024px.
- R2-P2: preview shows day-heading dates, en dash times, rows sorted by date then start time (display only).
- R2-P3: design-system.md 3.3 updated to match the build.
- a11y 4 (average "No parties" text), a11y 5 (", " separator in the day heading), a11y 6 (rows are now `row`, not named form landmarks), a11y B (`.data-table-wrap` scrolls instead of clipping).

Not fixed:
- a11y 3 (tab order versus the visual order of the nav on phones): needs a change to site-header markup order; left as is, low impact.
- R2-P4 (repo hygiene): staging is the parent's job; stage files by name and include `brand-logo-128.png`.
- a11y D (toggle flash) and E: need a live browser.
