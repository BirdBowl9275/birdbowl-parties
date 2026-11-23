# Phase 3 (Staff "Your schedule", /app): manual browser checks (parent session, 2026-11-23)

## Test data (test project birdbowl-parties-test only, approved by Jeff)
- `my_schedule` checks only `assigned_host = auth.uid()` and active status, not role, so jeff@ stayed manager.
- The parties guard requires a host-eligible assignee (tier not null), so jeff@'s tier was set to 1 temporarily.
- Party 2 ("Tomorrow Customer", today 2:00 to 4:00 p.m., notes "Bring candles") was reassigned from Test Hostess A (…00a2) to jeff@.
- Restored afterwards and verified: party 2 host Test Hostess A, unlocked; jeff@ manager, tier null, active; 0 parties assigned to jeff@.
- Only the revealed state could be seen (the party is today, after the 08:00 reveal). The hidden (before reveal) state was not seen with data; judge it from code.

## Before (main, 3200), populated
- 375x812: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795443862439-9lw1ap.jpg
  Single centred card, slot as bold sentence "Party, Monday, Nov 23 2:00 p.m. to 4:00 p.m." with "Tomorrow Customer · 12 kids · other · Bring candles", Sign out button in the card.

## After (pilot, 3300), populated, revealed
- 375x812 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795443862439-11zb45.jpg
- 1280x800 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795443874773-1zwt1f.jpg
- 2560x1080 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795443874773-pk4be5.jpg
- 1280x800 dark: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795443874773-1gajnz.jpg
- Empty state on 3300: "No upcoming parties." card under the shared header, works.
- Text: "Today" chip, "Monday, Nov 23", visually hidden "Party, Monday, Nov 23 2:00 p.m. to 4:00 p.m.", visible "2:00 p.m.–4:00 p.m.", "Tomorrow Customer", "Details shown", "12 kids · other", "Bring candles". Sign out in the header.

## Computed styles (dark, 1280)
- Time "2:00 p.m.–4:00 p.m." rgb(161,161,170) 17px/600 (muted secondary colour)
- Customer "Tomorrow Customer" rgb(161,161,170) 15px/700 (muted)
- "12 kids", "other" rgb(161,161,170)
- Notes "Bring candles" rgb(237,237,239) (primary)
- "Today" chip text rgb(122,167,255) on rgb(16,30,58) (blue)

## For the critic to judge
1. Hierarchy inverted: time and customer name (what staff need most) are in the muted secondary colour, while the notes are in primary.
2. "Today" chip is blue. Decision 9 reserves blue for the focus ring; brand red is the accent.
3. Phone: the pill "Details shown" sits tight against the "12 kids · other" line; the hairline above notes is tight.
4. Header at about 800px wraps "My schedule" to a second line (known pilot follow-up).
5. Hidden state not seen with data.
