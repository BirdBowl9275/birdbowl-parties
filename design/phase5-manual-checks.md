# Phase 5 (Login and Pending): manual browser checks (parent session, 2026-11-23)

Signed-out view via http://127.0.0.1:3300 (separate host, so no session; nobody was signed out). No code was requested: no email or text was sent.

## Login
- 375 light, removed notice: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795446623807-8o8un3.jpg
  Logo + "Bird Bowl Parties", "Sign in", body text verbatim, removed notice as a red banner (role="alert", text verbatim), segmented Email/Phone tabs, "Work email", disabled "Email me a code" grey rgb(82,82,91) on rgb(237,237,239). No horizontal scroll.
- Tabs: tablist/tab/tabpanel present; roving tabindex (Email 0, Phone -1). Click Email then ArrowRight: focus and selection move to Phone, label becomes "Mobile number" (type tel), button "Text me a code".
- Invalid phone "12" + Enter: "Enter a valid phone number, with the area code." in role="alert"; stays on the contact step (client-side check, no request).
  Screenshot: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795446634801-l0odgc.jpg (button caught mid colour transition; settled value white on rgb(215,0,42), opacity 1)
- 1280 dark: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795446649597-nd2nat.jpg (disabled button rgb(161,161,170) on rgb(42,44,49); page rgb(14,15,17))
- 2560 light: /Users/jeffgeb/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-d422-4c9e-b46b-1a344787786e/tool-results/mcp-Claude_Browser-blob-1795446649597-ql5yoq.jpg (card centred; small on ultrawide, as intended for a sign-in card)

## Not checked in the browser
- Code step, busy states and verify error: would require sending a real one-time code.
- /pending: needs a signed-in pending user; awaiting Jeff's approval to set jeff@ to pending temporarily. Judge from code.
