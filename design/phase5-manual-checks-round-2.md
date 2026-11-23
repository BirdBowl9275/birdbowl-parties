# Phase 5 (Login and Pending): manual browser checks after builder round 2 (parent session, 2026-11-23)

jeff@ was temporarily set to status pending in the test project (approved by Jeff) to see /pending; restored and verified: manager, active, tier null, full_name empty (unchanged). The name form was not submitted. No sign-in code was requested.

## Pending
- Before (main 3200), 375: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795447181386-x79uh9.jpg (plain card, pale blue "Save name", blue "Sign out")
- After (pilot 3300), 375 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795447181386-6kbo5s.jpg (edge-to-edge on phone, logo + "Bird Bowl Parties" + theme toggle, text verbatim, "Save name" btn-secondary, "Sign out" btn-ghost, no site header, no horizontal scroll)
- After, 1280 dark: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795447195525-1e5vq5.jpg
- /app and other routes redirect to /pending for the pending user (both servers).

## Login (round 2)
- 1280 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795447195525-6eemsq.jpg
- Manual activation: focus on Email, ArrowRight moves focus to Phone while Email stays selected; Enter selects Phone (label "Mobile number").
- B1: selected tab border rgb(138,138,147), weight 600.

## For the critic
- In the 400px card on laptop, "Bird Bowl Parties" wraps to two lines next to the labelled theme toggle (light and dark screenshots above). Polish or fix?
- Code step, busy and verify error still not seen (would need a real code).

## After critic round 2 (PASS), parent session follow-ups
- N1 fixed: theme toggle icon-only inside `.auth-brand` at every width (labels visually hidden, still in the accessible name); "Bird Bowl Parties" on one line at 1280 (brand row 48px tall).
- N3 recorded in decisions.md (12vh card offset, no footer, icon-only toggle on the card).
- N6 seen in the browser with the Supabase auth calls intercepted in the page (window.fetch stub for /auth/v1/otp and /auth/v1/verify; address design-qa@example.invalid, which cannot receive mail and shouldCreateUser is false). Nothing reached Supabase.
  - "Sending..." busy state: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795447436134-401ahm.jpg
  - Code step: "If that email can sign in, a code is on its way.", focus on #code (aria-describedby code-status), "Use a different email": /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795447436134-48ph39.jpg
  - Verify error: "That code is not right or has expired. Check it or request a new one." in role="alert"; focus stays on #code (N5 does not occur); aria-describedby "code-status auth-error"; stays on /login. 1280 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795447444007-weaetf.jpg ; 375 dark: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795447444007-w35vjv.jpg
- N2 (re-selecting the selected tab wipes the step) left as before; behaviour change needs Jeff. N4 left for the spec pass.
