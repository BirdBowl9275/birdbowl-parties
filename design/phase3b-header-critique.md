# Phase 3b critique: shared header wrap fix (2026-11-23)

Scope: the `globals.css` diff against HEAD (shared header block only), read alongside `site-header.tsx`, `components/header-nav.tsx`, `components/theme-toggle.tsx`, `design/design-system.md` 3.1 and 3.12, the notes in `design/phase3b-header-notes.md`, and the earlier follow-ups in `critique-round-3.md` (R3-M2, F2).

## Verdict: PASS

The change fixes the mid-word wrap and the 3 to 5 row stacking at 640 to 1023px. It adds no WCAG 2.2 AA failure. Nothing blocks merging this step. One item is a hard gate before the Admin phase (N1).

**Evidence limits (read this first).** I could not render the page myself. Headless Chromium will not start inside this sandbox (`mach_port_rendezvous ... Permission denied`). This verdict therefore rests on:
- a line-by-line reading of the CSS;
- width arithmetic from the tokens;
- the parent's measurements and three screenshots (800px before, 800px after, 375px after).

I captured no screenshots of my own, ran no axe scan and recorded no Tab sequence. The checks marked "by code" below should be confirmed once in a real browser (see the verification list at the end).

## What the change does, checked against the diff

- `.site-nav a { white-space: nowrap }` (globals.css:713-714). Labels can no longer break. The nav is `flex-wrap: wrap` (704), so a whole link moves to the next row instead. This is correct.
- The inline layout (nav `order: 0; flex: 1; align-self: stretch`, links at `--header-height`, square corners) and `min-height: var(--header-height)` move from the 640px query to the 1024px query (755-771). The 640px query now only sets padding `4px 24px 0` (746-750).
- **At 1024px and up the result is identical to HEAD.** The 1024 block sets padding `0 32px`, which overrides the 640 padding, then min-height and the inline nav. This matches the old 640 rules plus the old 1024 padding rule. So the sticky 57px header, the 72px `scroll-padding-top` (203) and the 2200px cap (1566-1571) are unchanged.
- Sticky and static still switch at the same width as the inline layout (648-652, 208-212). The header is static wherever it has two or more rows. This is the property that keeps 2.4.11 safe, and the change keeps it.

## Width-by-role check

Estimates use the tokens: link padding 12px a side, gap 4px, body text 16px below 640 and 15px from 640, and theme labels in `--text-small`. Where the parent measured, the measurement is used.

| Width | staff (1) | sales (2) | manager (3) | admin (5) | Notes |
|---|---|---|---|---|---|
| 320 | 3 rows (brand / tools / 1 link) | 3 rows | 4 rows, 211px measured | 4 rows, 211px measured | Static. Tools wrap under the brand (about 316px needed, 288px available). Links wrap whole. No horizontal scroll. |
| 375 | 2 rows | 2 rows | 115px, 1 nav row (screenshot) | 163px, 2 nav rows | Static. |
| 640 | 2 rows | 2 rows | 101px | 101px | Row 1 needs about 530px of 592px. Admin links need about 415px. |
| 800 | 2 rows | 2 rows | 101px (screenshot, clean) | 101px | Fixed: before was 117 to 177px with "My / schedule". |
| 1000 | 2 rows | 2 rows | 101px | 101px | Static. Before, manager here was 57px, so this is +44px, but in a header that scrolls away. Acceptable. |
| 1024 | 57px | 57px | 57px | 57px measured | Sticky. Unchanged from HEAD. Admin margin is thin, see N1. |
| 1440 | 57px | 57px | 57px | 57px | Unchanged. |
| 2560 | 57px | 57px | 57px | 57px | Inner row capped at 2400px by the 2200px rule. Unchanged. |

No width or role regresses at 1024px and up. Below 1024, every role now gets the same predictable two-part header. The only cost is height for staff and sales at about 700 to 1023px, which used to fit on one row (N3).

## WCAG 2.2 AA

| SC | Result | Basis |
|---|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | Pass (by code) | Sticky only from 1024px, where the header is one 57px row. Scroll padding is 72px, which matches the spec (design-system.md:263). The header is static below 1024px with 16px padding. Rules at 1024px and up are unchanged from HEAD. Residual risk only if the admin header wraps at 1024px (N1). |
| 2.4.3 Focus Order | Pass, advisory note | See "Focus order" below. |
| 1.4.10 Reflow (320) | Pass (by code plus parent measurement) | Flex-wrap everywhere, `nowrap` only on single links. The widest link ("My schedule", about 112px) is far below 288px. No fixed widths, no `overflow: hidden`. The header is 211px but static, so it scrolls away. |
| 1.4.12 Text Spacing | Pass (by code) | `nowrap` stops breaks inside a label. Overflow is still handled because whole links wrap and nothing clips. With 0.12em letter and 0.16em word spacing, "My schedule" grows by about 25px, which is fine at 320px. At 1024px and up, extra spacing can push the admin nav onto a second row while the header is sticky (N1). Content is not lost; the risk is focus being obscured. |
| 2.5.8 Target Size (Minimum) | Pass | Links and the brand are 44px tall. Theme segments are 32px tall from 640px and Sign out is 44px, all above 24px. The 44px touch-target house standard is missed by the theme toggle at 640 to 1023px (N4). |
| 1.4.11 / 2.4.7 | Unchanged | Focus ring and active marker are untouched. |

### Focus order (the parent's question)

DOM order is brand, nav, tools. Below 1024px the nav is drawn on row 2 (`order: 3`), so Tab goes brand, links (row 2), theme and Sign out (back up to row 1), then main. The change widens this mismatch from "below 640" to "below 1024".

**My judgement: not a 2.4.3 failure, so do not fix it in this step.**
- The three groups are independent. No meaning or operation depends on visiting the tools before the links.
- The sequence is predictable and the same at every width.
- It is exactly the order the spec prescribes (design-system.md:326, "Tab order logo, links, theme, account").
- Focus is visible on every stop.

**Do not apply the old follow-up F2 as written** (critique-round-3.md:79: move `<HeaderNav>` after the tools and drop `order: 3`). After this change it would move the mismatch to 1024px and up, where the nav is inline between brand and tools. That is the main keyboard surface for manager and admin, so it would make things worse. Mark F2 as superseded.

If you want the visual and Tab orders to match below 1024px, the smallest safe fix is one CSS line. Add it inside the existing `@media (max-width: 1023.98px)` block at globals.css:648-652:

```css
  .site-header-inner {
    reading-flow: flex-visual;
  }
```

- It changes no DOM, no component and nothing at 1024px and up.
- Chromium 137+ then tabs brand, theme, Sign out, links. Safari and Firefox ignore it and keep today's order, so there is no regression.
- If you apply it, also update design-system.md:326 to say "below 1024px, Tab follows the visual rows: logo, theme, sign out, links".

My recommendation is to leave it out for now. The cross-browser answer is the phone sheet in spec 3.1, which removes the row-2 nav entirely.

## Issues

### Blocking
None.

### Non-blocking (ranked)

**N1. Admin at exactly 1024px has very little spare width. Measure it before the Admin phase. (Medium, pre-existing R3-M2, not caused by this change.)**
- Where: globals.css:755-771 (inline layout), 648-652 and 208-212 (sticky switch). site-header.tsx:16-23 (five admin links).
- What's wrong: the parent's "1024: 57px" admin figure does not say whether scrollbars were overlay (macOS) or classic. My estimate is about 975px needed against 1024px, or against about 1007px with a 17px Windows scrollbar. Round 3 estimated about 10px of slack. A larger browser default font (all type is `rem`, but the breakpoints are `px`) or user text spacing would also make it wrap. If the nav wraps, the sticky header becomes about 113px, which is more than the 72px scroll padding. That fails 2.4.11.
- Fix: measure `.site-header` height as admin at 1024, 1100 and 1280 in three conditions: (a) classic scrollbars (macOS "Show scroll bars: Always", or Windows), (b) browser default font at 20px, (c) the WCAG text-spacing bookmarklet. If any reading is over 57px, change all three `1024px` / `1023.98px` queries (globals.css:208, 648, 755) together to `64em` / `63.99em`. That is still 1024px at the default font and scales with the user's font. If (a) still wraps, raise the three queries together to `1280px` / `1279.98px`. Keep the three in lockstep; they must never diverge.

**N2. The spec no longer describes the header that ships. (Medium, documentation.)**
- Where: design-system.md:310 ("sticky header, 56px") and :324 (phone below 640px: 52px header with a menu sheet).
- Fix: update 3.1 to say:
  - From 1024px: sticky single row, 56px plus 1px border.
  - Below 1024px: static two-part header. Row 1 is logo plus tools. Row 2 is the links, which wrap whole and never break mid-label.
  - The menu sheet remains the planned phone design (deferred).
- Also record that `nowrap` on links is intentional.

**N3. Staff (and sales) pay a 44px row at 640 to 1023px. (Low, deferred item.)**
- Where: globals.css:700-706.
- What's wrong: staff have one link, and it is always the current page. Before the change it sat inline from about 700px. Spec 3.1 says staff get no nav row on phone.
- Fix when the deferred staff item is picked up, CSS only, inside the `max-width: 1023.98px` block:
  ```css
  .site-nav:has(> a:only-child[aria-current='page']) { display: none; }
  ```
  This hides the row only when the single link points at the page already open. Laptop and up keep "My schedule", as spec :487 requires.

**N4. Theme segments are 32px tall on touch tablets (640 to 1023px). (Polish, pre-existing.)**
- Where: globals.css:830-835.
- What's wrong: this passes 2.5.8, but the house standard is 44px touch targets. The spec segmented control is "36px (44px phone)" (design-system.md:384). Tablets now use the phone arrangement, so they should get phone-sized targets.
- Fix: change that query from `min-width: 640px` to `min-width: 1024px`. Row 1 is already 44px (brand and Sign out), so the toggle grows to about 50px. That adds about 6px of header height at 640 to 1023px and changes nothing at 1024px and up.

**N5. Active marker floats 8px above the border on phones but sits on it at 640px and up. (Polish, pre-existing.)**
- Evidence: the parent's 375px screenshot (`...blob-1795444873720-ylr429.jpg`). The red bar under "Schedule" sits about 8px above the header border. The 800px screenshot (`...-oe9tte.jpg`) shows it flush.
- Cause: the base `.site-header-inner` padding is `var(--space-2) var(--space-4)` (globals.css:677), so there is 8px at the bottom. The 640 query sets the bottom to 0.
- Fix: globals.css:677 becomes `padding: var(--space-2) var(--space-4) 0;`. Phone header goes from 115px to 107px, and the marker reads as a tab on the border, as it does on tablet and desktop. For one rhythm across both, optionally use `var(--space-1)` for the top padding too.

**N6. 320px header is 211px (about 37% of a 568px-tall screen). (Polish, accepted.)**
- It is static and passes reflow. No action now; the spec's phone sheet would remove the nav rows. Listed so nobody mistakes it for a regression.

## What's good (keep it)

- **One switch point for everything.** Inline layout, sticky position and scroll padding all change at 1024px. The header is never sticky while it has more than one row. This is the right invariant; keep the three queries in lockstep (see N1).
- **`nowrap` on the link, `wrap` on the nav.** Whole links move instead of labels breaking, which is the correct division of labour.
- **A minimal diff with a comment explaining why.** At 1024px and up the output is identical to HEAD, so the risk is contained to the static header range.

## Verify once in a real browser (I could not)

1. Admin at 1024px with classic scrollbars, a 20px default font, and the text-spacing bookmarklet. Header height should be 57px (N1).
2. Tab sequence at 375px and 800px: Skip, brand, links, Light/Dark/System (one stop, arrow keys inside), Sign out, main. No focus stop should be hidden.
3. axe-core on `.site-header` at 375, 800 and 1440px in light and dark. Expect 0 violations, since no colours or roles changed.
