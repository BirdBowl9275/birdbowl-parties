# Phase 3 (Staff /app): manual browser checks after builder round 2 (parent session, 2026-11-23)

## Test data (test project birdbowl-parties-test, approved by Jeff)
- Recorded first: parties 2 ("Tomorrow Customer", 2026-11-23) and 7 ("Sales Insert", 2026-11-27) both host Test Hostess A (…00a2), unlocked.
- Temporarily: jeff@ tier 1; parties 2 and 7 assigned to jeff@. Role stayed manager.
- Restored and verified: parties 2 and 7 host Test Hostess A, unlocked; jeff@ manager, tier null, active; 0 parties assigned to jeff@.

## Seen with data: revealed (today) and hidden (Friday) together
- 375 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795444362257-kw943p.jpg
- 1280 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795444362257-ngqh3q.jpg
- 2560 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795444362257-mtkr1m.jpg
- 375 dark: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795444362257-l2aaf9.jpg
- 1280 dark: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795444362257-k7342j.jpg

## Round 1 fixes confirmed (computed styles)
- H1: time and customer in primary text (light rgb(24,24,27), dark rgb(237,237,239)); kids/type muted; notes primary.
- H2: hidden card has the same surface and solid border as the revealed card; "Details hidden" neutral pill plus "Details shown on the morning of the party." in muted text.
- H3: "Today" chip neutral (light text rgb(24,24,27) on rgb(237,237,239); dark rgb(237,237,239) on rgb(42,44,49)). No blue.
- H4: in-page Sign out present with and without parties; form action /auth/signout, method post; 343x50 at 375, full width; header Sign out kept.
- M1: visually hidden ", " between chip and date (heading reads "Today, Monday, Nov 23").
- M2: phone spacing between pill, meta and notes is comfortable.
- P1: visible time "2:00 p.m. to 4:00 p.m."; screen-reader label unchanged.
- No horizontal scroll at 375.

## Defect found and fixed by the parent session
- At 640px and up the time column (11rem) wrapped "2:00 p.m. to 4:00 / p.m." and "10:00 a.m. to 12:00 / p.m." onto two lines (P1's longer wording). Fix in the Staff block: `--staff-time-col: 13.5rem` and `.staff-time { white-space: nowrap; }` inside the 640px query. Measured: longest slot text 194px, column 216px, staff container 640px at a 700px viewport. Not re-screenshotted with data (data already restored).

## After critic round 2 (FAIL on B1), parent session follow-ups
- B1 (WCAG 1.4.12) fixed: 640px query uses `grid-template-columns: minmax(var(--staff-time-col), max-content) minmax(0, 1fr)`, keeping `nowrap`. Measured with a temporary measurement card and letter-spacing 0.12em, word-spacing 0.16em: at 700px time 216 to 254px wide grows the column, time right edge 301 vs details left 317, no overlap, no horizontal scroll; at 1280px normal 216px (553 vs 569), spaced 254px (591 vs 607), no overlap.
- N1 recorded in design/decisions.md ("Design lead decisions during rollout").
- N2 kept as is (verbatim "No upcoming parties." only); N3 deferred app-wide.
