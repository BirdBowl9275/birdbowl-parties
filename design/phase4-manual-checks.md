# Phase 4 (Admin users and settings): manual browser checks (parent session, 2026-11-23)

jeff@ was temporarily admin in the test project (approved by Jeff). Restored afterwards and verified: jeff@ manager, active, tier null.

## Users (pilot 3300)
- 1280 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795445578515-470i5t.jpg
  Pending approval frame (warning tone) with pending@example.com and pill; "Everyone else (10)" aligned rows under USER / STATUS / ROLE / HOST TIER / DAILY CAP headers; status pills; removed user row muted with dashed border. 11 forms, same as before.
- 375 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795445654841-wd1w1m.jpg (cards, 2-column fields, full-width Save, no horizontal scroll)
- 2560 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795445654841-y0y2xh.jpg

### Remove confirm (Test Sales, an active user)
- Set Status to removed, pressed Save: no request; inline "Remove Test Sales? They lose access immediately." with "Yes, remove" and "Keep user"; focus on "Keep user".
  Screenshot: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795445600395-hrb88d.jpg
- Keep user (Enter): confirm closed, select reset to "active", focus on the Status select. After reload Test Sales is still active (also verified in the database).
- "Yes, remove" was NOT pressed (no real removal performed).
- Server-rendered HTML: the "removed" option is disabled before hydration for non-removed users (builder's no-JS guard); after hydration it is enabled.

### Normal save (Test Removed, already removed)
- Daily cap 3 to 2, Save: no confirm (already removed), redirect to ?msg=Saved., banner "Saved." in role="status", value persisted. Restored to 3 the same way; verified 3 after reload and in the database.

### Ordering note (pre-existing, not a regression)
- After saving Test Removed it moved to the top of "Everyone else" on BOTH main (3200) and the pilot. The query orders by created_at, and the seeded test users share a created_at, so ties come back in arbitrary order. Same query as before the redesign.

## Settings (pilot 3300)
- 1280 dark: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795445654841-rnffbq.jpg
- Three groups: Fair host assignment (Fairness window, days; Hostess average allowance, %), Availability deadline (cutoff day 1 to 7; cutoff time 24-hour), Day-of timing (Morning reveal time; Bowling parties after this time go to servers). Each keeps its own Save. Help-text ranges match lib/admin.ts validateSetting (1 to 365 days, 0 to 100 %). Values unchanged (30, 25, 3, 20:00, ...). No settings were saved in this check.

## For the critic to judge
1. No-JS behaviour: with JavaScript off (or before hydration) an admin cannot set anyone to removed on this screen at all (option disabled). Today, without JS, removal works in one click. Is this an acceptable trade-off for "never remove on first press", or should a no-JS path (e.g. a details/summary fold) exist?
2. Each Save button's accessible name includes the user's name ("Save Test Sales"); check label-in-name and that the visible "Save" text starts the name.
3. Pending row shows the email twice when the user has no name (pending@example.com as name and email).
