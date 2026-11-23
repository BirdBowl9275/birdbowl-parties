# Phase 2 (Sales parties): manual browser checks (parent session, 2026-11-23)

Pilot server http://localhost:3300, test data, manager role (manager can open /sales/parties).

## Functional test: all passed

- Add a party (Wed Nov 25, 17:00 to 19:00, 5 kids, other, customer "Design QA test"): "Party added." in role="status"; row appears on Wednesday as "5:00 p.m.–7:00 p.m.", "Not assigned" pill.
- Edit via the Edit fold (details/summary named "Edit Design QA test"), kids 5 to 6, Save party: "Party saved."; row shows 6 kids.
- Cancel party, first press: no submit; inline "Cancel this party? This cannot be undone." with "Yes, cancel party" and "Keep party"; focus moved to "Keep party".
- Keep party: confirmation closes, focus returns to the "Cancel party" trigger, no request sent.
- Cancel then "Yes, cancel party": "Party cancelled."; row dimmed, "Cancelled" pill, no Edit or Cancel controls.
- Side effect: the test database now holds a cancelled "Design QA test" party on 2026-11-25 (the app has no un-cancel).

## After screenshots

- 1440x900 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795418074766-zsabui.jpg
- 1440x900 light, Edit open: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795418109322-o7w2pu.jpg
- 1440x900 light, cancel confirm open: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795418123639-zp4a88.jpg
- 1440x900 light, after cancel: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795418142270-bs5z4l.jpg
- 375x812 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795418152835-er0tvn.jpg
- 1280x800 dark: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795418152950-c35jkb.jpg
- 2560x1080 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795418153053-ej0a01.jpg

## Concerns for the critic to judge

1. Cancelled row text looks very low contrast, especially in dark mode.
2. Ultrawide: rows stretch the full width, leaving large gaps between customer and kids/type columns.
3. At 1440 and wider the header "Add a party" button jumps to a form that is already visible (two red primary buttons on screen).
4. Before hydration or without JavaScript, the first "Cancel party" press submits without confirming (builder's stated progressive-enhancement fallback).
5. The new-party form has no accessible name ("unlabelled form").
