# Phase 3b: shared header wrap fix (parent session, 2026-11-23)

Approved by Jeff ("Yes, header first") as a small shared-header step before the Admin phase.

## Problem (before)
From 640px the nav links shared the first row with the logo and the tools, squeezed into the gap, and labels broke mid-word ("My / schedule"). Measured on the pilot (3300) at /manager/schedule. Admin was simulated by temporarily inserting two extra links ("Users", "Settings") into the nav in the browser (measurement only, removed straight after, no role change).

| Width | Manager header | Admin (5 links) header |
|---|---|---|
| 375 | 115px, 1 nav row | 163px, 2 nav rows |
| 640 | 177px, 3 rows | 297px, 5 rows |
| 700 | 117px | 177px |
| 800 | 117px, "My schedule" on its own line | 117px |
| 900 | 57px | 117px |
| 1024+ | 57px | 57px |

Before screenshot, 800px manager: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795444834633-8mhxwo.jpg

## Change (globals.css, shared header block only)
1. `.site-nav a { white-space: nowrap; }`: a label never breaks; whole links wrap.
2. The inline nav layout (nav in the middle of row 1, links full header height, no bottom radius) moved from the 640px query to the 1024px query. 640 to 1023px keeps the phone arrangement: row 1 logo and tools (with labels), row 2 the links. The 640px query now only sets the side padding.
3. `min-height: var(--header-height)` on the inner row moved to 1024px with it.
No component, link list, role logic, or other screen changed. The header stays static below 1024px and sticky from 1024px (unchanged), so the sticky height is still 57px and scroll-padding is unaffected.

## After (measured)
| Width | Manager | Admin (5 links, simulated) |
|---|---|---|
| 320 | 211px, 2 nav rows | 211px, 2 nav rows |
| 375 | 115px, 1 row | 163px, 2 rows |
| 640 | 101px, 1 row | 101px, 1 row |
| 800 | 101px, 1 row | 101px, 1 row |
| 1000 | 101px | 101px |
| 1024 | 57px | 57px |
No label breaks at any width; no horizontal scroll.

After screenshots: 800px manager /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795444873720-oe9tte.jpg ; 375px manager /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795444873720-ylr429.jpg

## For the critic
- Phone and tablet focus order: DOM is logo, nav, tools; below 1024px the nav is shown below the tools (CSS `order: 3`), so Tab goes logo, nav links, then theme and Sign out, while the eye reads logo, tools, nav. Pre-existing pilot follow-up ("phone nav tab order"); is it a 2.4.3 failure or acceptable?
- 320px: tools row wraps (211px). Header is static there.
- Staff phone nav row (single "My schedule" link) still shown; deferred from phase 3.

## After critic (PASS), parent session follow-ups
- N1 measured: admin (5 links, simulated) at 1024px has 42px spare in the nav (links need 430px, nav 472px), overlay scrollbar (0px). A 17px classic Windows scrollbar still leaves about 25px. Not changed; re-check at the start of the Admin phase with the real admin role.
- N5 fixed: inner header bottom padding removed below 640px; the active underline now sits on the header border (gap 1px = the border), phone header 115 to 107px.
- N2 (spec text), N3 (staff single-link row), N4 (theme options 44px on touch tablets) left for later; N6 accepted.
