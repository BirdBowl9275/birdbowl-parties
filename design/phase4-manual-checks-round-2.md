# Phase 4 (Admin): manual browser checks after builder round 2 (parent session, 2026-11-23)

jeff@ temporarily admin in the test project (approved by Jeff), restored afterwards and verified: manager, active, tier null. No settings saved, no one removed, no user changed in this round.

## Users
- 1440 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795446116564-pg18mi.jpg
- 1024 dark: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795446116564-q7ua5r.jpg
- B1: column header (User / Status / Role / Host tier / Daily cap) now above BOTH the pending row and "Everyone else" (2 headers). Sentence case (M1).
- M2: pills "Pending" (clock, amber: dark rgb(251,191,36) on rgb(46,34,8)), "Active" (check, green: dark rgb(74,222,128) on rgb(15,42,26)), "Removed" (ban, red).
- M3: pending row Save is primary red; other rows secondary.
- P1: pending@example.com shown once.
- 720px wide (equivalent to 200% zoom at 1440): rows become cards with visible labels, no horizontal scroll (scrollWidth 720). /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795446127975-88xrv7.jpg
- Keyboard focus on the Test Sales Role select: 2px solid blue outline rgb(37,99,235). /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795446127975-ys2uv6.jpg
- M4 (zero pending): not seen with data; the test project has one pending user and changing that was not approved. Judge from code.

## Settings
- 1280 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795446139045-8au0d1.jpg
- 375 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795446139045-1ph8nu.jpg (no horizontal scroll)
- M6: all six inputs at x=615 and all Save buttons at x=863 at 1280 (aligned).
- M5 help text as rendered (9 lines): allowance "How much higher a party hostess's average kids per party may be than the team average, in percent. A whole number from 0 to 100."; cutoff "When staff must have their availability in, the week before each schedule." / "The day in the week before each schedule week: 1 is Monday, 2 is Tuesday, up to 7 for Sunday."; times "24-hour, like 08:00 or 18:30" etc.
- Values unchanged: 30, 25, 3, 20:00, 08:00, 18:00.

## Not done
- axe: no axe tooling available in this browser pane; not run.

## After critic round 2 (PASS), parent session follow-ups
- R2-M1: `.admin-pending { margin-inline: calc(-1 * (var(--space-4) + var(--border-width))); }` inside the 1024px admin block, so the pending columns line up with "Everyone else". Page side padding at 1024px+ is 32px, larger than the 17px pull, so no horizontal scroll is expected. NOT seen in the browser (jeff@ already restored to manager); verify at the next admin check.
- R2-P1: removed the dead `.admin-pending .empty` rule.
- R2-P2: `--settings-max: 720px` on `.admin`; `.admin-settings` uses it.
- R2-P3 (allowance wording) left as is; axe not run (no tooling in this browser).
