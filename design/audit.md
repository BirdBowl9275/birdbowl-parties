# Parties app: UI/UX audit (written by the parent session, 2026-11-23)

Scope: the Parties web app under `web/src`. Read-only. No app code, roles or data were changed.

Note: the separate auditor agent did not finish. This audit was written directly from the source and the running app. Items marked **not reviewed** still need a pass.

## Brand

- Logo: red circle, white bowling pins with red stripes, white "BIRD BOWL" lettering.
- Brand red (approx.): **#D7002A**. Confirm with a colour picker before the build.
- Brand white: **#FFFFFF**. Brand neutrals are not defined by the logo, so use the neutrals in the design spec.
- Current app: no logo, no brand red. The accent is blue (`--color-accent: #1f5fbf`). Dark mode accent is `#6b9cff`.
- Contrast check: white text on #D7002A is about **5.4:1**, which passes WCAG AA for normal text.
- Conflict to resolve: `--color-danger` is also a red (#b42318). Brand red as the accent would blur "action" and "error". Use a deeper or different red for errors, and keep brand red for primary actions.
- Dark mode with brand red: the red needs a lighter tone on dark surfaces to keep contrast. The design spec should define both tones.

## Theme (dark and light)

- Already built: light theme by default, dark theme when the system is set to dark (`globals.css`).
- Missing: no in-app toggle, so a person can't pick a theme that differs from their system.
- Recommendation: keep both themes, follow the system by default, and add a visible light/dark/system toggle in the header.

## Screen inventory (from source and the running app)

| Route | Role | What it does | Status |
|---|---|---|---|
| /login | public | Email or phone one-time code | Captured |
| /pending | pending user | Set name, wait for approval | Not reviewed |
| /app | staff | "Your schedule", time slots only, sign out | Captured (empty state) |
| /sales/parties | sales, manager | Add, edit, cancel parties for the week | Captured (laptop) |
| /manager/schedule | manager | Fairness table, party cards with host dropdown and lock, preview and save | Captured (phone and laptop) |
| /admin/users | admin | Pending approvals, per-user status, role, tier, daily cap | Captured (phone and laptop) |
| /admin/settings | admin | Four settings with separate save buttons | Captured (laptop) |

## Parity checklist (must survive the redesign)

1. Sign in by email code and by phone code. Errors: wrong code, expired code, rate limit (429), unconfigured sign-in.
2. Pending users see only the pending screen and can set a name.
3. Removed users are sent to login with a removed notice.
4. Staff see only their own time slots for the next 14 days, labelled "Party, <weekday, date> <start> to <end>". Before the reveal each slot says "Details shown on the morning of the party." After the reveal it shows customer, kids, type and notes. The database function `my_schedule` enforces this; the UI must not fetch party details any other way. Error state: "Could not load your schedule."
5. Sales: add a party (date, start, end, kids, type, customer, notes), edit it, cancel it. Cancelled parties are dimmed and cannot be edited.
6. Manager: week navigation, fairness table (parties, total kids, average kids, window days), host dropdown per party, "Lock by hand", save assignment.
7. Manager: preview the assignment (nothing saved), then save with a confirmation checkbox. Locked and revealed parties keep their host.
8. Admin: approve or change status, role, host tier (1 hostess, 2 front desk, 3 server, or not a host), daily cap (0 to 3) for every user.
9. Admin settings: six settings, each with its own save: fairness window (days), hostess average allowance (%), availability cutoff day (1 = Mon, 7 = Sun), availability cutoff time, morning reveal time, and the time after which bowling parties go to servers.
10. Sign out (POST to /auth/signout) from staff, pending and admin screens today. The approved header adds it for sales and manager.
11. Week navigation keeps the chosen week in the URL (`?week=`). Manager preview uses `?preview=1`. Status messages arrive in `?msg=` and are announced with role="status".
12. Pending screen: "Request received" text, the set-name form, and sign out. Active users who land there are sent to /app.
13. Manager schedule shows only active parties. Sales shows active and cancelled, with "host assigned" or "not assigned" on each.
14. Empty states that must stay: "No parties." per day, "No upcoming parties." for staff, "No requests waiting." for admin approvals.
15. Every load error keeps a role="alert" message: parties, users, schedule.

(Items 4 and 9 to 15 were corrected or added in a re-check on 2026-11-23. The first version missed two admin settings and the staff revealed state.)

## Findings, ranked

### High

1. **No brand identity in the UI.** No logo, no brand red, no header. (`layout.tsx`, `globals.css`.) Fix in the design system and header.
2. **Removing or changing a user is one click with no confirmation.** (`admin/users/page.tsx`: the Save button sets status directly.) Removing a user ends access immediately, so add a confirm step. Needs approval because it changes behaviour.
3. **No theme toggle.** Covered above.
4. **Fairness table is clipped on phones.** The "Average kids" column is cut off at 375px and only scrolls sideways. (`manager/schedule/page.tsx`, `.table-wrap`.) Use stacked cards on phones.
5. **Party cards on the manager schedule are long forms.** Each card has a host dropdown, lock checkbox and save button, repeated for every party. Hard to scan across a week. Use a grid or table with inline editing on desktop.

### Medium

6. **Labels and controls are placed by the browser default.** Several checkboxes sit inside `<label class="check">` with the text after, which works but needs a visible focus ring check in the redesign.
7. **Cancel party uses the `.secondary` button style with no confirmation.** A cancelled party can be restored only by re-entering it. (`sales/parties/page.tsx`.) Add a confirm step.
8. **Status is shown as text only.** "Host assigned", "not assigned", "cancelled" are plain text. Add a visual status token, but never rely on colour alone.
9. **Empty states are plain sentences.** "No parties." and "No upcoming parties." are fine but offer no next step.
10. **Dark mode contrast of the brand red is unchecked.** See brand section.
11. **Text links for week navigation are the only navigation.** No header and no app nav for sales, manager or staff. Admin has a tab nav. Add one shared header.

### Low

12. **Dev badge** (Next.js logo, bottom-left) appears in development only. Confirm it does not ship.
13. **Page title** is "Party Hostess Scheduler" on every screen. Set per-screen titles.
14. **Sign-in tabs** use `role="tab"` without `aria-controls` or tab panels. Fix for WCAG 2.2 AA.

### Not reviewed

- Server actions (`*/actions.ts`): authorisation and input validation. Belongs to the security review, not this audit.
- `pending/` and `app/` source (the screens were checked in the browser only).
- Engine logic (`lib/engine.ts`) and tests: not a UI concern.
- Performance and bundle size: not measured.

## Safe to restyle now (no behaviour change)

- Colours, type scale, spacing, radius, borders, focus rings, icons, the header.
- Button, input, select, table and card styles.
- Empty and loading states, responsive layout (except the fairness table, which changes layout only).
- Theme toggle (adds a control, changes no data).

## Needs your approval first

- Confirmation step on removing users (finding 2) and cancelling parties (finding 7). Changes behaviour.
- Any change to what a role can see or do.
- Any database or schema change.
- Dependency upgrades (8 npm vulnerabilities reported, 2 critical and 2 high). Not part of this audit; review separately.

## Baseline

Captured screens and the temporary role changes are recorded in `design/baseline.md`. All temporary role changes were reverted in the test project.
