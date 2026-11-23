# Phase 2 (Sales parties): manual browser checks after builder round 2 (parent session, 2026-11-23)

tsc clean, vitest 73/73, main untouched, no literal escape sequences in sales files.

## H1 contrast (computed in the browser, effective opacity 1)
- Cancelled row text, light: 7.03:1. Dark: 6.50:1. Row computed opacity 1 (was 0.6).

## H2 no-JS / pre-hydration
- Fetched the server-rendered HTML for the page (what a browser without JS receives): 7 `details.cancel-fold` elements, each with a summary "Cancel party <customer>" and the cancel form inside; zero "Cancel party" submit buttons outside a fold. The first press can only open the fold.

## Interaction (JS)
- Open: focus moves to "Keep party"; text "Cancel this party? This cannot be undone."
- Escape: fold closes, focus returns to the "Cancel party" summary, no request.
- Keep party: fold closes, focus returns, no request.
- Yes, cancel party (throwaway "Design QA test 2", id 16): "Party cancelled.", row cancelled; neighbouring real test party untouched.
- Add a party form accessible name: "Add a party".
- A stale dev-only hot-reload error ("Element type is invalid" in SalesPartiesPage) appeared while the builder was editing; after a fresh load the page hydrates and works, no error overlay, imports verified correct.

## After screenshots (round 2)
- 1440x900 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795418595929-0uoj5g.jpg
- 1440x900 dark, confirm open (popover over the next row): /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795418570962-27fp4l.jpg
- 2560x1080 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795418596058-492401.jpg
- 375x812 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795418597161-0fna7o.jpg

## For the critic to judge
1. Ultrawide: the list is capped and centred, but the page title "Parties" and week navigation stay at the far left and right edges, not aligned with the capped content.
2. The confirm popover overlays the next row's kids/type and its "Cancel party" button while open.
3. Test database now has two cancelled throwaway parties (ids for "Design QA test" and 16 "Design QA test 2").
