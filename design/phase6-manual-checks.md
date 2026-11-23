# Phase 6 (party-type chips): manual browser checks (parent session, 2026-11-23)

Pilot 3300, test data, jeff@ as manager (no role change). Nothing saved.

- Sales parties 1440 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795448154646-e60gd2.jpg
  Type cells 92px wide, 0 overflowing; chips Arcade 76px, Bowling 80px. Add form select `party_type`: bowling=Bowling, other=Arcade (values unchanged).
- Manager schedule 1440 dark: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795448176442-dplf81.jpg
- Assignment preview (?preview=1) 1440 dark, not submitted: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795448176442-hwi1kk.jpg
- Sales parties 375 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795448176442-iiakvu.jpg ("12 kids" + Arcade chip, "8 kids" + Bowling chip)

## Not seen
- Staff revealed slot (needs a temporary assignment to jeff@); judge from code.

## For the critic
- The Bowling chip is red, the same hue family as the danger/cancel styles ("Cancel party" outline, red banners). Does it read as an error or warning next to them? Consider whether a deeper brand-red or an icon is enough to distinguish it.

## After critic (PASS) and round 2 fixes
- M1: type tags square (border-radius 4px), bowling-ball icon; Bowling text rgb(176,0,35). Zoom: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795448472759-rjnbwv.png
- M2: cancelled rows' chips muted: rgb(82,82,91) on white.
- No type cell overflow. Select text Bowling / Arcade, values unchanged.
- Staff slot still not seen with data.
