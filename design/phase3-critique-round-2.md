# Phase 3 critique, round 2: Staff "Your schedule" (`/app`)

Date: 2026-11-23. Critic: design critic. Worktree `.worktrees/redesign-pilot`. Read-only on app code.

## Verdict: FAIL (one blocking item, one-line CSS fix)

Every round 1 item is resolved: H1 to H4, M1 to M3, P1 and P4. P2 is only half done (see N1). Parity is 3 of 3 audit items, with all strings verbatim.

The screen now reads correctly. The time and customer are primary, hidden and revealed cards share one surface, the "Today" chip is neutral, and Sign out is back at the end of the list.

The one blocker was introduced by the parent's time-column fix. `white-space: nowrap` inside a fixed `13.5rem` grid track means that under WCAG 1.4.12 text spacing the time overflows its column and overlaps the customer name or pill. Fix B1 and this passes. No re-review is needed beyond a quick re-check of B1.

## Method and limits

- **Read:**
  - `app/page.tsx` (126 lines)
  - the Staff block, `globals.css:2008-2133`
  - `git diff --stat`: only `app/page.tsx` and `globals.css` changed, and the CSS diff is only the Staff block
  - `phase3-staff-notes.md` (Round 2)
  - `phase3-manual-checks-round-2.md`
  - spec 3.1, 3.9, 4.2 and 7
  - `decisions.md`
  - audit parity items 4, 10 and 14
- **Opened the parent's data screenshots,** which show a revealed slot (today) and a hidden slot (Friday) together:
  - 375 light `…1795444362257-kw943p.jpg`
  - 375 dark `…-l2aaf9.jpg`
  - 1280 light `…-ngqh3q.jpg`
  - 1280 dark `…-k7342j.jpg`
  - 2560 light `…-mtkr1m.jpg`
- **No critic-run browser this round either.** I updated my static harness to the round 2 markup and the current `globals.css`, and wrote a run that covers axe, a font-width sweep, text spacing, reflow at 320/640/720, tab order and forced colours. Chromium is again killed by the sandbox (`mach_port_rendezvous_mac.cc:159 ... Permission denied (1100)`). So:
  - B1 is computed from the parent's measured 194px plus the 1.4.12 spacing values.
  - There is no axe run.
  - The 1280 shots predate the time-column fix (they still show "4:00 / p.m." wrapping), so the fix itself has not been seen on screen with data.

## Round 1 items

| Item | Status | Evidence |
|---|---|---|
| H1 time and customer muted | Resolved | `globals.css:2067-2070` sets `--text` on `.staff-time, .staff-who`. `:2094-2098` sets `strong` to 600 at `title-3`. Parent computed values: light `rgb(24,24,27)`, dark `rgb(237,237,239)`. In the 375 shots the time and name read as primary, with kids and type muted. |
| H2 hidden = "cancelled" look, dark inversion | Resolved | The `.staff-hidden` rule and its forced-colors block are gone. `.staff-item` (`:2058-2065`) gives every card `--surface` and a solid `--border`. In the 375 dark shot both cards sit on the same surface. The state is carried by the "Details hidden" lock pill plus the sentence. |
| H3 blue Today chip | Resolved | `.staff-when` (`:2036-2044`) uses `--surface-selected`, `--text` and `--border`. There is no `info` in the Staff block. Contrast is about 15:1 light and 12:1 dark. |
| H4 in-page Sign out removed | Resolved | `page.tsx:109-113` has a POST `/auth/signout` form with `btn btn-secondary`. It renders after the list and after the empty and error states, so it is always present. It is full width below 640px (`:2129-2133`). Parent: 343x50 at 375. The header Sign out is kept. |
| M1 "TodayMonday" | Resolved | `page.tsx:63-64` uses `<span className="vh">, </span>`, so the h2 and list name is "Today, Monday, Nov 23". `.vh` is absolute, so it does not take a flex gap slot. |
| M2 phone spacing | Resolved | `.staff-body` is a grid with a `--space-1-5` gap (`:2072-2075`). Notes have `margin-top: --space-1-5` and `padding-top: --space-3`. The 375 shot shows the pill, meta and notes evenly spaced. |
| M3 rhythm and width | Resolved | List gap is `--space-3` (`:2055`). `--staff-max: 40rem` (`:2015`). |
| P1 time wording | Resolved | `page.tsx:75` shows "2:00 p.m. to 4:00 p.m." (aria-hidden). The `.vh` label at `:71-73` is unchanged. |
| P2 log the pill deviation | Partly | It is logged in `phase3-staff-notes.md` ("Spec deviation (P2)"), but spec 3.9 rows "Details on the morning" and "Revealed", and the wording in 4.2 and 7, still say the old thing. See N1. |
| P4 raw rem widths | Resolved | `--staff-max` and `--staff-time-col` are set on `.staff` (`:2014-2021`). |
| P3 h1 `display` size, header wrap | Deferred as agreed | Not assessed. |

## Parent's time-column fix (`--staff-time-col: 13.5rem`, `.staff-time { white-space: nowrap }` at 640px and up)

- **Normal text:** correct. The longest string is about 194px (parent measurement) in a 216px track, and the parent confirmed it no longer wraps. At 200% browser zoom on 1440 (720 CSS px), the 640px container leaves about 376px for details, which is fine. Below 640px the layout stacks and `nowrap` does not apply, so 320px reflow is unaffected. Text-only zoom scales the track and the text together, since both are in rem.
- **Text spacing:** fails. See B1.

## Blocking

### B1. Time overflows into the details column under WCAG 1.4.12 text spacing (AA)

- **Screen:** every width of 640px and up, both themes, on any slot whose time is longer than about 10.5rem. "10:00 a.m. to 12:00 p.m." is the worst case.
- **Cause:** `globals.css:2113-2122`. The track is a fixed `var(--staff-time-col)` (216px) and the text is forced onto one line with `white-space: nowrap`. `.staff-item` has no overflow handling, so the text spills out of the track.
- **Arithmetic:** `title-2` is 17px.
  - 1.4.12 requires letter-spacing 0.12em, which is 2.04px across 24 characters, or +49px.
  - It also requires word-spacing 0.16em, which is 2.72px across 4 spaces, or +11px.
  - The time becomes about 254px. That is 38px past its track. After the 16px gap, about 22px of the time sits on top of the first characters of the customer name or the "Details hidden" pill.
  - Overlapping text is a loss of content under 1.4.12.
  - The same mechanism, at a smaller scale, applies to any platform font that is more than about 11% wider than the one the parent measured.
- **Fix:** in the `@media (min-width: 640px)` block at `globals.css:2114-2118`, change the track to grow when it has to. Keep everything else, including `nowrap`.
  ```css
  .staff-item {
    grid-template-columns: minmax(var(--staff-time-col), max-content) minmax(0, 1fr);
    gap: var(--space-4);
    align-items: start;
  }
  ```
  With normal spacing, every time is narrower than 13.5rem, so all cards keep the identical 216px column and alignment is unchanged. With text spacing or a wider font, the track grows and the details move right instead of being overlapped.
- **Re-check:**
  1. At 1280 and at 640, apply the text-spacing bookmarklet, or inject `* { letter-spacing: .12em !important; word-spacing: .16em !important; line-height: 1.5 !important; }`.
  2. Confirm that the `.staff-time` right edge is less than or equal to the `.staff-body` left edge on every card.
  3. Take one normal 1280 screenshot with data to confirm the columns still align.

## Non-blocking

### N1. Spec still describes the old pills (finish P2)

- **Where:** `design-system.md`:
  - 3.9 rows "Details on the morning / neutral / clock" and "Revealed / info / eye" (lines 401-402)
  - 4.2 (line 485): "neutral pill 'Details on the morning' ... the info pill 'Revealed'"
  - section 7 parity row 4 (line 534)
- **Risk:** the next builder or critic "fixes" the screen back to an info-blue pill, which would collide with decision 9.
- **Fix:** update the spec to the shipped design. Change those rows to "Details hidden / neutral / `lock`" and "Details shown / success / `lock-open`", and change the 4.2 and section 7 wording to match. Alternatively, add it as a numbered entry in `decisions.md` for Jeff to confirm. This is a documentation change and needs no app code.

### N2. Empty-state helper line from spec 3.10 not present (Polish, optional)

- Spec line 445 proposes "No upcoming parties." plus "When you're assigned a party it shows here. Details appear on the morning of the party."
- The build keeps only the verbatim parity string (`page.tsx:58`), which is the safe choice. The page subtitle already says when details appear.
- **Options:** leave it as is and strike the second sentence from 3.10, or add it as a `.muted` line inside `.empty`. Either way, do not change the first sentence.

### N3. Loading state (deferred, app-wide)

- Spec 3.10 lists "3 card placeholders". No route in the app has a `loading.tsx`, and that is consistent with the earlier phases.
- This is not a Staff regression. Track it with the app-wide loading-state work.

### Deferred, not assessed

- P3 (h1 `display` size).
- Header wrap at about 800px, and the staff phone nav row.

## WCAG 2.2 AA (code and tokens; not browser-run)

- **Contrast:** passes in both themes.
  - Primary text on `--surface` is 15:1 or better.
  - Muted meta is 7.0 light and 6.5 dark.
  - The neutral chip is 15 light and 12 dark.
  - The success pill is 5.28 light and 8.82 dark.
- **Structure:** unchanged and correct.
  - Landmarks: banner, nav "Main", main, and a section named by the h1.
  - Heading order: h1, then one h2 per day.
  - Each list is labelled by its day heading, and that name now includes the comma.
- **Slot name:** read once, through the `.vh` label. The visible time is `aria-hidden`.
- **Keyboard:** the in-page Sign out is a native submit button placed last in the DOM, so it is the last tab stop after the header controls. The page body has no other controls.
- **Focus:** uses the shared `.btn` focus ring.
- **Targets:** in-page Sign out is 44px or more (`--control-lg`, 50px measured at 375). Header targets are unchanged from round 1.
- **Reflow:** below 640px everything stacks and wraps, with no horizontal scroll at 375 (parent).
- **Text spacing (1.4.12):** fails at 640px and up. See B1.
- **Reduced motion:** nothing animated was added.
- **Forced colours:** the cards keep their solid borders. Removing the dashed rule loses nothing, because the state is in pill text.

## Parity: 3 of 3 audit items verified (4, 10, 14)

- **Item 4:**
  - The only fetch is `my_schedule` with `p_from` today and `p_to` today + 14 (`page.tsx:31-34`).
  - Grouping is display-only and keeps DB order.
  - The label "Party, <weekday, date> <start> to <end>" is verbatim (`:71-73`).
  - "Details shown on the morning of the party." is verbatim (`:100`).
  - Customer, kids, type and notes appear after the reveal (`:81-90`).
  - "Could not load your schedule." appears with `role="alert"` (`:52-57`).
  - The parent saw the hidden and revealed states with real data.
- **Item 10:** Sign out works in the page (`:109-113`) and in the header.
- **Item 14:** "No upcoming parties." shows only when there is no error (`:58`).

## Regressions

- None found outside B1.
- The diff touches only `app/page.tsx` and the Staff block of `globals.css`. The Staff block has no hard-coded colours or px values. `--staff-max` and `--staff-time-col` are the only rem literals, and they are now named.

## Scores (1 to 5)

| Area | Before | R1 | R2 |
|---|---|---|---|
| Brand identity | 1 | 3 | 4 |
| Visual hierarchy | 2 | 2 | 4 |
| Consistency / tokens | 2 | 3 | 4 |
| Density and scanability | 2 | 4 | 4 |
| Responsive: phone | 2 | 3 | 4 |
| Responsive: ultrawide | 2 | 4 | 4 |
| Accessibility | 3 | 4 | 3 (B1; 4 once fixed) |
| States (empty, error, status) | 2 | 3 | 4 |
| Theming (light/dark) | 2 | 3 | 4 |
| Craft vs Linear/Stripe | 2 | 3 | 4 |

## What's genuinely good (keep it)

- **The 375 card is the right shape for a hostess's phone.** The big time comes first, then the name with its state pill, then the kids and type, then notes under a hairline. Hidden and revealed cards are differentiated only by pill and copy, not by surface or opacity.
- **The neutral "Today" chip** reads as emphasis without any colour.
- **The full-width Sign out** at the end of the list, which is present in every state.
- **The `.vh` slot label with `aria-hidden` visible time,** and the visually hidden comma in the day heading.
- **Named layout variables on `.staff`.**

## Re-check for round 3 (B1 only)

1. At 640px and up, `grid-template-columns` on `.staff-item` is `minmax(var(--staff-time-col), max-content) minmax(0, 1fr)`.
2. With 1.4.12 spacing injected at 1280 and 640, no `.staff-time` overlaps `.staff-body`.
3. A normal 1280 screenshot with data shows the time on one line and the details column aligned across cards.
