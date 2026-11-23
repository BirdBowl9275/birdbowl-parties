# Phase 2 (Sales parties): before screenshots

Captured 2026-11-23 from the main branch (http://localhost:3200/sales/parties?week=2026-11-23), test data, manager role, light theme.

- 375x812 phone: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795417982015-z8rkev.jpg
- 1280x800 laptop: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795417982232-uprbw2.jpg
- 2560x1080 ultrawide: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795417982140-7zvao8.jpg

Observed problems in the before state:
- Every existing party shows its full edit form at all times; the week is a long wall of inputs, worst on phones.
- Summary times use 24-hour format ("14:00–16:00") while the manager schedule uses "2:00 p.m."; day headings are ISO dates ("2026-11-23").
- Ultrawide: content is a 960px centred column with large empty margins.
- Old blue accent, no shared header, week nav as plain underlined links.
- "Cancel party" submits immediately with no confirmation.
