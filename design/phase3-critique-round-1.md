# Phase 3 critique, round 1: Staff "Your schedule" (`/app`)

Date: 2026-11-23. Critic: design critic. Worktree `.worktrees/redesign-pilot`. Read-only on app code.

## Verdict: FAIL

Parity holds on data and text. `my_schedule` is the only fetch, every state string is verbatim, and the screen-reader slot label is correct and read once. There is no WCAG 2.2 AA failure in code.

It fails on four blocking items:

1. **H1.** The time and customer name render in the muted colour, so the hierarchy is inverted.
2. **H2.** Hidden slots reuse the Sales "cancelled" look, and in dark mode they are brighter than revealed slots.
3. **H3.** The "Today" and "Tomorrow" chips are blue, which breaks decision 9.
4. **H4.** The in-page Sign out was removed against spec 3.1, 4.2 and 4.7 #10, without approval.

Every fix is small and CSS-led.

## Method and limits

- Read `app/page.tsx` (all 120 lines), `git diff` for `page.tsx` and `globals.css` (Staff block at 2008-2116), `site-header.tsx`, `components/header-nav.tsx`, `middleware.ts` and `lib/access.ts`. Compared against the Sales block (`globals.css:1636-1760`) and the manager rows (`1249-1303`).
- Evidence used: the parent's screenshots and computed values in `phase3-manual-checks.md`.
  - 375 light `…1795443862439-11zb45.jpg`
  - 1280 light `…1795443874773-1zwt1f.jpg`
  - 1280 dark `…1795443874773-1gajnz.jpg`
  - 2560 light `…1795443874773-pk4be5.jpg`
- I built a static harness of the exact Staff markup with the real `globals.css` to capture the hidden state, run axe and check reflow. The sandbox blocks Chromium from launching (`mach_port_rendezvous ... Permission denied`). As a result, this round has **no critic-run screenshots and no axe run**. The hidden state is judged from code plus token values. I computed contrast ratios from the tokens myself.

## Parity (audit items 4, 10, 14): 3 of 3 verified in code

| Item | Result | Evidence |
|---|---|---|
| 4. Own slots for 14 days via `my_schedule` only | Pass | `page.tsx:31-34` makes the same RPC with the same params. There is no other query. Grouping is display-only and keeps DB order (`:38-43`). |
| 4. Label "Party, <weekday, date> <start> to <end>" | Pass | `page.tsx:71-73`: `.vh` span with verbatim text. The visible copy is `aria-hidden` (`:74-76`), so it is read once. Inside a `<p>`, so it is not concatenated with the next line. |
| 4. Hidden text "Details shown on the morning of the party." | Pass | `page.tsx:100`, verbatim. |
| 4. Revealed: customer, kids, type, notes | Pass | `page.tsx:81-90`. Notes show only when present, as before. Null handling is identical to main. |
| 4. Error "Could not load your schedule." | Pass | `page.tsx:52-57`, `role="alert"`, danger banner with icon and words. |
| 14. Empty "No upcoming parties." | Pass | `page.tsx:58`, only when there is no error. |
| 10. Sign out reachable from `/app` | Pass functionally, but deviates from spec (H4) | Middleware sends only `active` profiles to `/app` (`access.ts:20-27`, `middleware.ts:47-55`). `SiteHeader` renders Sign out for every active role (`site-header.tsx:48, 67-72`), so all roles that land on `/app` can sign out. On phones the button is icon-only, with its name kept by `.vh-md`. |

## WCAG 2.2 AA (from code and tokens)

- **Contrast**, all passing:
  - Hidden meta (`--text-muted` on `--surface-sunken`): 7.03 light, 6.50 dark.
  - Neutral pill: 7.03 / 6.50.
  - Success pill (`#137538`/`#EDF7F0`): 5.28 light; (`#4ADE80`/`#0F2A1A`) 8.82 dark.
  - Info chip: 6.03 light, 6.93 dark.
  - Notes: 16+ / 14+.
- **Structure:** banner, nav "Main", main, and a region labelled by the h1. Heading order is h1, then one h2 per day. Each `ul` is labelled by its day h2. This is correct.
- **No double read** of the time. See the parity table.
- **Targets:** the page body has no controls. Header links are 44px. Theme options are at least 44px wide and 44px tall on phone, 32px tall at 640px and up (passes 2.5.8). Sign out is at least 44px.
- **Reflow and 200% zoom:** `overflow-wrap:anywhere` on name, meta and notes, `flex-wrap` on the h2 and pill row, no `nowrap` on the time. The grid switches at 640px with an 11rem time column, so a 720px (200% of 1440) view fits. No issue found in code. Not browser-verified.
- **Reduced motion:** nothing animated was added.
- **Name concatenation (M1):** this is not an AA failure, but it should be fixed. See below.

## Blocking issues

### H1. Hierarchy inverted: the time and customer name use the muted colour

- **Screen:** all widths, both themes. The parent's 375 and 1280 shots show it, and the computed values confirm it in dark: time `rgb(161,161,170)`, customer `rgb(161,161,170)`, notes `rgb(237,237,239)`.
- **Cause:** the global rule `p { color: var(--text-muted) }` (`globals.css:321-324`). `.staff-time` (`page.tsx:70`) and `.staff-who` (`:80`) are `<p>`, and nothing in the Staff block resets their colour. Only `.staff-notes` sets `--text` (`globals.css:2101`).
- **Breaks:**
  - Spec 4.2: the time is the primary read ("When am I working?") and the customer is `body-strong`.
  - Spec 2.1: muted is for secondary text.
  - Consistency: the manager rows reset this explicitly with `.prow .pcell { color: var(--text) }` (`globals.css:1249-1254`).
- **Fix:** in `globals.css` (Staff block), add the rule below. Keep `.staff-meta` muted. Keep `.staff-notes` at `--text`.
  ```css
  .staff-time,
  .staff-who { color: var(--text); }
  ```
  Also set `.staff-who strong { font-weight: 600; }` to match `.party-who strong` (`:1687`) and `.pcell-customer strong` (`:1272`). The browser default of 700 is the only bold-700 on any redesigned screen.

### H2. Hidden slots copy the Sales "cancelled" treatment, and dark mode inverts it

- **Code:** `.staff-hidden { background: var(--surface-sunken); border-style: dashed; }` (`globals.css:2064-2067`). This is identical to `.party-item.cancelled` (`globals.css:1644-1647`).
- **What's wrong:**
  1. **Semantics.** A hidden slot is a confirmed shift whose details come later. It is not void. For most of the 14-day window almost every card is hidden (only today's slots after the reveal are not). So the dominant state of the screen borrows the app's "cancelled / not real" visual language. A hostess who has seen Mady's screen, or who just glances at the phone, can read a dashed sunken card as "off".
  2. **Dark-mode inversion.** In dark, `--surface-sunken` is `#1D1E22` and `--surface` is `#16171A`. Hidden cards are therefore *lighter*, which means more raised, than revealed cards on the `#0E0F11` page. The "quieter" state ends up the louder one.
  3. **Light mode.** `#F4F4F5` on page `#F7F7F8` with a `#DCDCE0` dashed edge (1.24:1) makes the card nearly dissolve into the page.
- **Breaks:** spec 4.2 ("each slot card ... then either the neutral pill ... or ... revealed"). The spec does not prescribe a separate surface. Spec 2 principle 2 says state goes in the pill, with icon and word. It also breaks the dark-theme parity rule ("light and dark are equal citizens").
- **Fix:**
  - Delete the `.staff-hidden` rule (`globals.css:2063-2067`) and the forced-colors block (`2112-2116`, which becomes moot and is already a no-op).
  - Keep the class in `page.tsx` as a hook if wanted.
  - Hidden and revealed cards then share `--surface` and the solid `--border`. The neutral "Details hidden" pill plus the morning-of sentence carry the state, which the spec already requires.
  - Optional, if a quieter hidden card is still wanted: `.staff-hidden .staff-meta { color: var(--text-subtle); }` (5.95:1 light on surface). Do not change the surface.

### H3. "Today" / "Tomorrow" chips are blue (decision 9)

- **Code:** `.staff-when { background: var(--info-bg); color: var(--info-fg); }` (`globals.css:2033-2040`). Parent dark computed value: `rgb(122,167,255)` on `rgb(16,30,58)`.
- **Breaks:**
  - Decision 9: blue survives only as the focus ring.
  - Spec section 1: brand red is only for the logo, the primary action and the active-nav marker.
  - The info tone is a semantic status (Locked, Preview). "Today" is emphasis, not a status. No other redesigned screen marks today.
- **Fix:** use a neutral-strong chip. It reads as emphasis without borrowing red (which on a schedule sits too close to `--danger-fg` `#B42318`) or blue.
  ```css
  .staff-when {
    padding: 0 var(--space-2);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-full);
    background: var(--surface-selected);
    color: var(--text);
    font-size: var(--text-small);
    font-weight: 600;
  }
  ```
  Contrast: `#18181B` on `#EDEDEF` is about 15:1. `#EDEDEF` on `#2A2C31` is about 12:1.

### H4. In-page "Sign out" removed against the spec

- **Code:** the `form action="/auth/signout"` was deleted from `page.tsx`. Builder rationale: `phase3-staff-notes.md` "What changed", bullet 4.
- **Breaks:** the spec keeps this button in three places, and no decision in `decisions.md` overrides it (decision 3 adds header sign-out for sales and manager only):
  - 3.1: "the existing 'Sign out' button stays at the bottom of the staff page as today"
  - 4.2: "sign-out button at the end of the list (as today) and also in the header"
  - 4.7 #10: "plus the existing in-page buttons on staff and pending"
- **Why it matters:**
  - On phones, the primary staff device, the header Sign out is an unlabeled icon (`site-header.tsx:70`, `.vh-md`). That is less discoverable for staff, who previously saw a labelled button.
  - `SiteHeader` returns `null` on any profile-read failure (`site-header.tsx:48-51`). In that case `/app` would have no way to sign out at all, where today it has one.
- **Fix:** in `page.tsx`, after the `days.map(...)` block and inside the `<section>`, add:
  ```tsx
  <form action="/auth/signout" method="post" className="staff-signout">
    <button type="submit" className="btn btn-secondary">Sign out</button>
  </form>
  ```
  Add the CSS below. The button keeps `min-height: var(--control-lg)`.
  ```css
  .staff-signout { margin-top: var(--space-6); }
  @media (max-width: 639.98px) { .staff-signout .btn { width: 100%; } }
  ```
- **Alternative:** if Jeff prefers header-only, record it as decision 10 in `decisions.md` and update spec 3.1, 4.2 and 4.7 #10. Until then, the spec governs.

## Non-blocking issues

### M1. Day heading text runs together for assistive tech: "TodayMonday, Nov 23"

- **Code:** `page.tsx:63-65`. The adjacent JSX spans on separate lines produce no whitespace text node, so the h2's text is `TodayMonday, Nov 23`. The flex `gap` only spaces them visually. Because each `ul` uses `aria-labelledby` (`:67`), the list's accessible name is also "TodayMonday, Nov 23". Copy and paste, and reader mode, show the same.
- **Fix:** render `<span className="staff-when">Today</span>{', '}` (and the same for Tomorrow). The comma text node is invisible in layout because of the flex gap. If a visible comma appears, use `<span className="vh">, </span>`. Fix this round; it is one line.

### M2. Spacing is tight on phone (parent item 3)

- **Screen:** 375 light.
- **Problem:** the success pill sits flush on the "12 kids · other" line, and the notes hairline is 4px under the meta line. The cause is `margin-top: var(--space-1)` on `.staff-meta, .staff-notes` (`globals.css:2091-2096`) together with the 22px pill.
- **Fix:** add `.staff-body { display: grid; gap: var(--space-1-5); }`. Then drop the `margin-top` on `.staff-meta, .staff-notes`. Set `.staff-notes { margin-top: var(--space-1-5); padding-top: var(--space-3); }`.

### M3. Card rhythm and column width drift from spec 4.2

- `.staff-list` gap is `--space-2` (8px). The spec says 12px. Change it to `var(--space-3)` (`globals.css:2051`).
- The column is `max-width: 44rem` (704px). The spec says 640px. Change it to `40rem` (`globals.css:2016`). At 1280 and 2560 a narrower column also tightens the time-to-details gap the parent's shots show.

## Polish

- **P1. Visible time format.** "2:00 p.m.–4:00 p.m." is cramped, with an unspaced en dash between two meridiems. Spec 2.5 reserves the en dash for tables and uses "to" for staff wording (4.2: "2:00 to 4:00 p.m."). Change `page.tsx:75` to `{formatClock(r.start_time)} to {formatClock(r.end_time)}`.
- **P2. Pill wording and tone differ from spec 3.9.** The spec has "Details on the morning" (neutral, `clock`) and "Revealed" (info, `eye`). The build has "Details hidden" (neutral, `lock`) and "Details shown" (success, `lock-open`). I think the build's wording is clearer, and success avoids the blue that H3 removes. Keep it, but log it as a deliberate spec change in `phase3-staff-notes.md` and update spec 3.9 so the next phase does not "fix" it back.
- **P3. h1 size.** Spec 4.2 says `display` (28px) for "Your schedule" on phone. The build uses the default `title-1` (22px). There is no `--text-display` token yet, so either add one (`1.75rem`, line height 2.25rem, weight 650) or amend the spec. Low impact.
- **P4. Raw rem widths.** `11rem` (`:2106`) and `44rem` (`:2016`) are one-offs. Sales tokenised its columns (`--col-time` etc.), so add `--staff-time-col` and `--staff-max` on `.staff` for consistency.

## Header wrap at about 800px (parent item 4): recommendation

- **Who it affects:** not staff. Staff have one link. It affects manager (3 links) and admin (5 links) when they open `/app` or any screen at 640 to about 900px.
- **Cause:** `.site-nav a` has no `nowrap` (`globals.css:708-717`), and the tools keep their text labels from 640px (`.vh-md` hides them only below 640). Estimated widths at 800px for manager: brand about 100, links about 260, tools about 330 with labels, plus gaps and padding about 80. The nav gets squeezed, so "My schedule" breaks onto two lines.
- **Scope:** **not in this phase.** It is a shared-header change that alters every screen, needs before and after screenshots of all roles, and Phase 3 should ship Staff only (CLAUDE.md 16.7, one screen per phase). Do it as a small "header follow-up" step before the admin phase. Admin has the most links, and critique-round-3 R3-M2 already flags admin at 1024 to 1100.
- **Fix for that step:**
  - Add `.site-nav a { white-space: nowrap; }`.
  - Add a `.vh-lg` utility (visually hidden below 1024px) and use it instead of `.vh-md` on the theme option labels and the Sign out label in `theme-toggle.tsx:50` and `site-header.tsx:70`. Accessible names are unchanged.
  - Then measure `.site-header` height for admin at 640, 800, 1024 and 1100.
- **Related, also deferred:** spec 3.1 says staff on phone get no nav row. Today staff see a full 44px row with one "My schedule" tab. Consider hiding `.site-nav` when it has a single link, at phone width only.

## Scores (1 to 5)

| Area | Before | After R1 |
|---|---|---|
| Brand identity | 1 | 3 (blue chip, H3) |
| Visual hierarchy | 2 | 2 (H1 inverts it; 4 once fixed) |
| Consistency / tokens | 2 | 3 (H2 borrows cancelled; H3; P4) |
| Density and scanability | 2 | 4 |
| Responsive: phone | 2 | 3 (M2 spacing) |
| Responsive: ultrawide | 2 | 4 (centred column, no stretch) |
| Accessibility | 3 | 4 (no AA failure in code; M1; not browser-verified) |
| States (empty, error, status) | 2 | 3 (H2 hidden state) |
| Theming (light/dark) | 2 | 3 (H2 dark inversion) |
| Craft vs Linear/Stripe | 2 | 3 (4 once H1 to H3 are fixed) |

## What's genuinely good (keep it)

- The `.vh` label plus `aria-hidden` visible time pattern (`page.tsx:71-76`). It is exact parity for screen readers with a cleaner visual. Do not merge them back into one string.
- Day grouping that is display-only and keeps DB order, with the Today and Tomorrow markers computed from `todayBusiness()` (the same business-zone helper as elsewhere).
- No opacity dimming anywhere. Every colour comes from a token, and the Staff block has no hard-coded colours or px values.
- The top-aligned single column (`.page:has(.staff)`), which mirrors `.page:has(.sched)`.
- The error banner with icon and words, and the empty card reusing `.empty`.

## Re-check list for round 2

1. H1: computed colour of `.staff-time` and `.staff-who strong` is `--text` in both themes.
2. H2: hidden card background equals `--surface` in dark (`rgb(22,23,26)`). Ideally seed one future-dated assignment on the test project so the hidden state is actually seen.
3. H3: no `--info-*` used in the Staff block (`grep -n "info" globals.css` within 2008-2116).
4. H4: in-page Sign out is visible at the end of the list at 375, and keyboard-reachable after the last card.
5. M1: the h2 `textContent` reads "Today, Monday, Nov 23".
