# Critique, round 1: Parties redesign pilot (tokens, header, manager schedule)

Date: 2026-11-23. Critic: design critic (Opus 5.5). Branch: `redesign/pilot` (commit 93e65f6). Read-only on app code.

## Verdict: FAIL

The parity check passes. The pilot still fails for three reasons:
- One Critical issue: the logo is broken on every signed-in screen.
- Two WCAG 2.2 failures: SC 1.4.11 on the theme toggle and SC 2.5.3 on the lock chip.
- Two High layout problems on phones.

Most of the fixes are small CSS or markup changes. The token work underneath is good (see "Keep").

## Evidence and method

- Screenshots (manager, test data): S1 = 1280x800 light, S2 = 1280x800 dark, S3 = 375x812 light. These are the three `mcp-Claude_Browser-blob-*.jpg` files supplied by the parent session.
- Code: `web/src/app/globals.css`, `layout.tsx`, `site-header.tsx`, `components/*.tsx`, `manager/schedule/page.tsx`, `middleware.ts`, `lib/access.ts`. Also read `git diff main` of the schedule page.
- Contrast ratios were computed with the WCAG relative-luminance formula, not judged by eye.
- `tsc --noEmit` passes.
- **Not done:** the sandbox blocks headless Chromium (Mach port permission denied). That means:
  - no axe-core run
  - no live hover or focus captures
  - no preview-panel screenshot
  - no ultrawide screenshot

  Ultrawide and the preview panel are judged from the CSS. Re-run axe in a normal terminal before round 2.

## Parity (audit items 6, 7, 10, 11, 13, 14, 15): 7 of 7 present

| # | Check | Result |
|---|---|---|
| 6 | Week links `?week=` ±7, fairness table (Host, Parties, Total kids, Average kids, "last N days"), `host_id` select with "Name (tier N)" / "Not assigned", `locked` checkbox, `reassignParty` with hidden `party_id` + `week` | Present (page.tsx:142-150, 288-299, 318-340). The visible "Lock by hand" wording was removed. See H2. |
| 7 | Preview link `?week=…&preview=1`, notice text verbatim, "No eligible host", fixed marker, `confirm` checkbox with sentence verbatim, "Save these assignments", `saveProposedAssignments` + hidden `week` | Present (page.tsx:152-223). "(fixed)" is now a "Fixed" pill. Same meaning. |
| 10 | Sign out for manager, POST `/auth/signout` | Present (site-header.tsx:66-71) |
| 11 | `?msg=` with `role="status"` | Present (page.tsx:157-162) |
| 13 | Manager shows active parties only (`.eq('status','active')`) | Unchanged (page.tsx:69) |
| 14 | "No parties." per day | Present (page.tsx:246) |
| 15 | `role="alert"` "Could not load parties." | Present (page.tsx:163-168). It moved above the preview panel, which is fine. |

No data, query, action or permission changes.

## Fix list (ranked)

### Critical

**C1. The logo is a broken image on every signed-in screen.**
- File: `site-header.tsx:60`, cause in `middleware.ts:65` + `lib/access.ts:61-80`.
- Evidence: S1, S2 and S3 show the broken-image glyph with the alt text cut off as "Bird".
- Cause: the middleware matcher only skips `_next/static`, `_next/image` and `favicon.ico`. `isPathAllowed` does not allow `/brand/...`, so the request for `/brand/bird-bowl-logo.png` is redirected to an HTML page.
- Second problem: the source file is a 146 KB, 1868x1865 PNG drawn at 32px in the header of every page.
- **Fix (no change to middleware or auth):**
  1. Copy the PNG to `web/src/app/brand/bird-bowl-logo.png`.
  2. In `site-header.tsx`, use `import Image from 'next/image'; import logo from './brand/bird-bowl-logo.png';`
  3. Render `<Image src={logo} width={32} height={32} alt="Bird Bowl" priority />`.

  The image is then served from `/_next/static/media` and resized through `/_next/image`, and the middleware already skips both. `next/image` is part of `next`, so there is no new dependency. Keep `.brand-link img` as is.

### High

**H1. Theme toggle: you can't see which option is selected (WCAG 2.2 SC 1.4.11, non-text contrast of state).**
- File: `globals.css:790-795`.
- The selected segment differs from the track only by low-contrast cues:

  | Cue | Light | Dark |
  |---|---|---|
  | Fill (`--surface` against `--surface-sunken`) | 1.10:1 | 1.08:1 |
  | 1px outline (`--border`) | 1.24:1 | 1.28:1 |
  | Icon colour change (`--text-muted` to `--text`) | 2.29:1 | 2.19:1 |

  All of these are under 3:1. On phones the toggle shows icons only (S3), so this is the only cue. In S2 (dark) the selected "System" segment is barely visible.
- **Fix:** in `.theme-opt:has(input:checked)`, replace `outline: var(--border-width) solid var(--border)` with `outline: var(--border-width) solid var(--border-input)`. That gives 3.11:1 light and 3.26:1 dark against the track. Add `font-weight: 600`. Keep `background: var(--surface)`.

**H2. Lock chip: when checked, the visible label is not in its accessible name (WCAG SC 2.5.3, level A), and the "Lock by hand" wording is gone.**
- File: `page.tsx:298-305`.
- The accessible name is "Lock by hand" (`.vh`). The visible text is "Lock" or, when checked, "Locked". A voice-control user who says "click Locked" gets no match.
- Parity item 6 calls this control "Lock by hand", and that text is no longer visible at any width.
- **Fix:**
  1. Delete the `txt-on` span and make the `txt-off` span always visible: rename it `txt` and drop the `.txt-on` / `.txt-off` rules at `globals.css:1281-1300`. The word is now always "Lock".
  2. Leave the checked state to the existing icon swap (`lock-open` to `lock`) plus the info tone. That means the state is never shown by colour alone.
  3. Below 1024px, show the full text: render `<span className="txt">Lock<span className="hide-lg"> by hand</span></span>`, with `.hide-lg { display: none }` inside `@media (min-width:1024px)`.
  4. Keep the `.vh` "Lock by hand" only if the visible text matches it. Otherwise drop the `.vh` span so the name comes from the visible text.

**H3. Phone: the sticky header is two rows, about 111px tall, and covers focused content.**
- Files: `globals.css:624-630`, `678-684`, `197`.
- Evidence (S3): the header takes 111 of 812px permanently.
- `scroll-padding-top: 72px` is less than the header height. When focus moves upward, a 44px control lands at y=72 under a header that ends at y=111, so 39px of it is hidden. This is the SC 2.4.11 risk the spec 2.6 called out.
- At 400% zoom on a 1280 laptop (320 CSS px wide, 200px tall), the header covers 55% of the viewport (SC 1.4.10 reflow).
- **Fix for this round:** add `@media (max-width: 639.98px) { .site-header { position: static; } }`. At ≥640px, change line 197 to `scroll-padding-top: calc(var(--header-height) + var(--space-4));`.
- Later: the spec 3.1 phone header (52px, menu button opening a sheet).

**H4. Phone: the fairness cards push every party below the first screen.**
- File: `globals.css:1023-1025` (`.sched-rail { order: -1 }`, applied below 1280px).
- Evidence (S3): the first viewport holds only the header, week bar, Preview button and fairness cards. With 5 hosts the first party starts about 1,100px down, and each extra host adds about 146px.
- Spec 4.4 puts the week before fairness, and assigning hosts is the manager's main task.
- **Fix:** delete the rule at 1023-1025 so that below 1024px the rail renders after the week. Add `@media (min-width:1024px) and (max-width:1439.98px) { .sched-rail { order: -1; } }` (see M2 for the 1440 breakpoint).

### Medium

**M1. Dense rows wrap.**
- File: `globals.css:1311`.
- Evidence (S1, S2): "Save assignment" breaks onto two lines in the 76px column, and "12:00 p.m.–2:00 p.m." wraps in the 132px time column. The rows end up with uneven heights. This is below the Linear/Stripe bar.
- **Fix:**
  - In `page.tsx:308`, render `Save<span className="vh"> assignment</span>`. The accessible name stays "Save assignment" and contains the visible "Save", so SC 2.5.3 passes.
  - Set the columns to `140px minmax(0, 1fr) 48px 76px 190px 92px 64px`.
  - Add `.pcell-time, .prow .pcell-save button { white-space: nowrap; }`.

**M2. The fairness rail is too narrow at 320px.**
- File: `globals.css:1027-1040`.
- Evidence (S1, S2): every host name ("Renamed Host", "Test Hostess A") wraps, and the "Total kids" / "Average kids" headers wrap. Each row is two lines tall.
- **Fix:**
  - Start the two-column layout at `@media (min-width: 1440px)` with `grid-template-columns: minmax(0, 1fr) 360px`.
  - From 1024 to 1439px, keep the rail above the week, per spec 4.4 for narrower laptops.
  - Add `table.data thead th { white-space: nowrap; }`.

**M3. The sticky rail never sticks.**
- File: `globals.css:227`.
- `.page { overflow-x: hidden }` forces `overflow-y: auto`, which makes `.page` a scroll container. `.page` never scrolls itself, so `position: sticky` on `.sched-rail` (line 1037) has no effect.
- **Fix:** change `overflow-x: hidden` to `overflow-x: clip`.

**M4. The week label is still in ISO format.**
- File: `page.tsx:146`.
- "Week of 2026-11-23" sits next to day headings like "Monday, Nov 23" (S1). Spec 3.3 asks for "Week of Mon, Nov 23 – Sun, Nov 29".
- **Fix:** format the label with a UTC helper like `dayHeading`, using `{ weekday: 'short', month: 'short', day: 'numeric' }` for `monday` and `days[6]`. Keep the "Week of" prefix. This is display only; `?week=` stays ISO.

**M5. Save buttons look disabled in light mode.**
- Evidence: S1 shows the three "Save assignment" buttons with a mid-grey fill. They look disabled.
- `globals.css:405-410` should give `--surface` (#FFFFFF) with an `--border-input` border. S2 (dark) renders correctly.
- **Fix:**
  1. In DevTools, check the computed `background-color` of `.prow .pcell-save button` in light mode.
  2. If it is not `rgb(255, 255, 255)`, add `.prow .pcell-save .btn-secondary { background: var(--surface); color: var(--text); }`.
  3. Recapture S1.

**M6. No ultrawide layout.**
- Files: `globals.css:922`, `1307-1389`.
- No rule exists above 1280px. At 2560px, `.sched` grows to 2000px and the customer column takes about 940px, so the host select sits about 1,000px away from the customer name.
- Spec 4.4 and 2.8 define a 7-column week grid from 1920px.
- **Fix:** build the spec 4.4 grid. Until then, add `@media (min-width: 1920px) { .sched { max-width: 1600px; } }` so rows don't stretch.

**M7. The row grid has no table semantics.**
- File: `page.tsx:229-237`, `248`.
- Spec 3.10 asks for `role="table"` / `row` / `columnheader` / `cell`. Today the header is `aria-hidden` and the rows are plain forms. The controls are labelled, so this is not a WCAG failure, but it doesn't follow the spec.
- **Fix:**
  - On `.sched-main`, add `role="table" aria-label="Parties this week"`.
  - On `.phead`, replace `aria-hidden` with `role="row"`, and give each of its spans `role="columnheader"`.
  - Give each `form.prow` `role="row"` and each `.pcell` `role="cell"`.
  - Day headings stay `h2` outside the rows. Wrap each day group in `role="rowgroup"`.

### Polish

**P1. The preview confirm checkbox is misaligned** (`globals.css:904-911`). The input has `margin-top: 12px` while the first text line starts at 0, so the box sits about 11px below the sentence. Found in code; the preview panel was not in the screenshots.
- **Fix:** `.panel .check { padding-block: var(--space-3); }` and `.panel .check input { margin-top: var(--space-0-5); }`.

**P2. Magic numbers outside the tokens:**

| Line | Now | Change to |
|---|---|---|
| `globals.css:911` | `12px` | `var(--space-3)` |
| `:873` | `3px` | `var(--space-0-5)` |
| `:866` | `14px` | Add `--space-3-5: 14px` and use it |
| `:764-765` | `40px` | `var(--control-lg)` below 640px (spec: 44px phone controls) |
| `:653`, `:922` | `2000px` | Add `--content-max-wide: 2000px` and use it |

**P3. Empty days are 80px boxed cards** (S1: Wednesday and Thursday). Five empty days take about 500px.
- **Fix:** `.day-group .empty { padding: var(--space-3) var(--space-4); text-align: left; background: transparent; border-style: dashed; color: var(--text-subtle); }`.

**P4. The theme toggle shows "System" for one frame before switching to a stored "Light" or "Dark"** (`theme-toggle.tsx:19-26`).
- **Fix:** use `useLayoutEffect` instead of `useEffect` for the localStorage read.

**P5. The active-nav bar floats mid-header** (S1: the red bar sits about 10px above the header's bottom border).
- **Fix:** at ≥640px, set `.site-nav a { min-height: var(--header-height); border-radius: 0; }` so the 2px bar sits on the header edge.

**P6. The ISC licence notice is missing** (`icons.tsx:1`). It currently has only a link. Paste the Lucide ISC copyright and permission text into the header comment.

**P7. Admin screens show duplicate navigation.** Now that the shared header appears on admin pages, they show both the header links and `admin/nav.tsx` (Users, Settings, Sign out). This was not caused by the token change and it's harmless. Retire `admin/nav.tsx` when admin is redesigned (spec 3.8).

## Scores (1 to 5, schedule screen; "before" from design/baseline.md and the audit)

| Area | Before | After |
|---|---|---|
| Brand identity | 1 | 2 (logo broken, red applied well) |
| Visual hierarchy | 2 | 4 |
| Consistency / tokens | 2 | 4 |
| Density and scanability | 2 | 3 (wrapping rows, narrow rail) |
| Responsive: phone | 2 | 3 (cards good, order and header poor) |
| Responsive: ultrawide | 2 | 2 (not built) |
| Accessibility | 3 | 3 (two SC failures, many good fixes) |
| States (empty, error, status) | 2 | 4 |
| Theming (light/dark) | 2 | 4 |
| Craft vs Linear/Stripe | 2 | 3 |

## Keep (don't "fix" these away)

- Tokens in `globals.css:4-188` match spec 2.1/2.2 exactly. There are no hex, rgb or hsl colours outside the token block. Every `var()` used is defined.
- Dark brand handling is correct: the primary fill stays #D7002A with white text, the nav marker uses `--brand-fg` #FF4D64, and focus stays blue.
- Status pills always pair an icon with a word. "Host assigned", "Not assigned", "Locked", "Fixed" and "No eligible host" never rely on colour.
- Each table has card twins hidden with `display: none`, so screen readers don't read the data twice. The fairness cards on phones fix audit finding 4 (S3).
- Focus uses `outline` rather than box-shadow, with `:has(:focus-visible)` on the custom chips. There is a skip link, and reduced motion is respected.
- The theme toggle is a real radio group in a `fieldset` with a legend. The pre-paint script prevents a theme flash, and choosing System removes the attribute.
- Form contracts are untouched: field names, hidden inputs, actions and query params.

## Round 2 changes (builder, 2026-11-23)

Verification: `tsc --noEmit` clean, `vitest run` 73/73, `next build` succeeds. Logo path `/_next/static/media/brand-logo-128.f150b098.png` returns HTTP 200 on localhost:3300. No screenshots or axe run (headless Chromium is blocked in the sandbox).

**Fixed**
- C1: `src/app/brand-logo-128.png` (128x128, 6 KB) imported statically in `site-header.tsx`, rendered as a plain `<img src={logo.src} width=32 height=32>`. No next/image, no middleware change, original `public/brand` file kept. `sips` failed in the sandbox (temp-file write blocked), so the copy was resized with a one-off Node script (zlib only, kept outside the repo).
- H1: selected theme segment now uses `--border-input` outline and weight 600. Options are 44px (`--control-lg`).
- H2: the lock control's visible text is always "Lock" (plus " by hand" below 1024px), with no separate `.vh` name, so name matches visible text. Checked state is shown by the icon swap and info tone. Field `locked` and checkbox unchanged.
- H3: header is static below 640px; `scroll-padding-top` is now header height + 16px at 640px and up.
- H4: below 1024px the fairness rail renders after the days; at 1024 to 1439px it stays above; at 1440px and up it is a right-hand column. All fairness data kept.
- M1: columns `140px 1fr 48px 76px 190px 92px 64px`, no-wrap on time and Save, button reads "Save" with a visually hidden " assignment".
- M2: rail is 360px from 1440px; table headers no-wrap.
- M3: `.page` uses `overflow-x: clip`, so the sticky rail works.
- M4: label reads "Week of Nov 23 – 29, 2026" (display only; `?week=` unchanged).
- M5: could not inspect computed styles (no browser). Added an explicit `.prow .pcell-save .btn-secondary` rule (surface fill, input border, small shadow, hover and active states). Please eyeball it in light mode; if it still looks grey, send a computed-style capture.
- M6: new 1600px and up layout: seven-ish day columns (`auto-fill, minmax(240px, 1fr)`) of compact party cards, rail at 360px; 2200px and up widens the container to 2400px (a deviation from the spec's 2000px, so seven columns fit at 2560).
- P1, P2 (new tokens `--space-3-5`, `--content-max-wide`, `--content-max-ultra`), P3, P4 (`useLayoutEffect`), P5, P6 (ISC text added).

**Not fixed**
- M7 (table roles): the day `h2` headings sit between rows, which makes `role="table"` structurally invalid and risks screen readers dropping the headings. Needs per-day markup; left for the full grid work.
- P7: deferred by design to the admin redesign.
- Spec's 1920px ultrawide breakpoint was lowered to 1600px at the parent's request.
