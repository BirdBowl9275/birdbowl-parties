# Manual browser checks, round 2 (parent session, 2026-11-23)

Measured in a real browser against the pilot on http://localhost:3300 (test data, manager role).

## Functional test: all passed

- Change host and Save: persists after reload; "Assignment saved." in role="status"; ?week kept.
- Tick Lock and Save: persists; "Locked" pill appears after reload.
- Untick Lock and Save: persists.
- Fairness table updates after a save.
- Preview (?preview=1): proposed-host table, "Fixed" marker on locked parties, confirm checkbox, "Save these assignments". Not submitted.
- Test data restored afterwards (Host Two Customer: Test Hostess A, unlocked).

## Accessible names (DOM)

Host selects "Host"; lock checkboxes "Lock"; theme radios "Light", "Dark", "System"; sign out "Sign out".

## Confirmed defects for round 3

1. **Serious, WCAG 2.4.11 (focus not obscured).** At 700px wide the header is sticky and 117px tall (nav wraps to a second row), but `scroll-padding-top` is 72px. Focused controls can sit up to 45px under the header. Phone (375px) is fine: header is static. 1024px is fine: header 57px. Fix: make the header static until the nav fits on one row (about 900px), or set scroll-padding-top from the real header height at each breakpoint.
2. ~~Dark mode Save buttons look disabled~~ **Closed.** Computed styles in dark mode: background rgb(22,23,26), text rgb(237,237,239), border rgb(107,110,118), opacity 1, not disabled, text contrast 15.33:1. A fresh close-up shows them correctly. The earlier grey capture was an artefact (likely a theme transition). This also closes critique R2-H1.
3. **Preview table dates** still ISO ("2026-11-24") while the week label is human-readable. Use the same date format as the day headings.
4. Preview rows are not sorted by date. This was already true before the redesign (engine order); sort for display only, without changing the engine.
