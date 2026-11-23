# Parties app: before-screen baseline (2026-11-22)

Scope: read-only capture of the running app. No app code, roles or data were changed.

Environment: local dev server on http://localhost:3200, connected to the **birdbowl-parties-test** Supabase project (test data, not live). Signed in as jeff@birdbowl.com, whose profile role is **manager** (active).

## Captured

| Screen | Width | Status |
|---|---|---|
| /login (Sign in, email tab) | 375x812 phone | Captured inline |
| /login | 768x1024 tablet | Captured inline |
| /login | pane default (laptop) | Captured inline |
| /manager/schedule (Weekly schedule) | 375x812 phone | Captured inline |
| /manager/schedule | pane default (laptop) | Captured inline |
| /sales/parties (Parties: add-a-party form and week list) | pane default (laptop) | Captured inline; manager role can open it |
| /admin/users (Users: pending approval, everyone else, per-user status/role/tier/cap) | pane default (laptop) and 375x812 phone | Captured inline; captured while temporarily admin |
| /admin/settings (availability cutoff day and time, bowling-to-servers cutoff, fairness window) | pane default (laptop) | Captured inline; captured while temporarily admin |

| /app (Your schedule: staff view, "Party time slots for the next two weeks", empty state "No upcoming parties", sign-out button) | 375x812 phone and pane default (laptop) | Captured inline; captured while temporarily staff. Empty state only: the test account has no assignments, so the populated view (time slots, details on the morning of the party) is not captured |

## Temporary role changes (test project only)

- Staff capture: jeff@birdbowl.com's role was changed to **staff**, the staff screen was captured, and the role was reverted to **manager**. Verified: 1 row, active, manager.

## Temporary admin access (test project only)

- jeff@birdbowl.com's role was changed from **manager** to **admin** in birdbowl-parties-test, approved by Jeff, to capture the admin screens.
- It was reverted to **manager** afterwards. Verified in the SQL editor: one row updated, status active, role manager.
- No other profile or setting was changed.

Observed on /manager/schedule: week navigation at top; "Fairness, last 30 days" table (host, parties, total kids, average kids); per-party cards with time, kid count, type, a host dropdown, "Lock by hand" checkbox and "Save assignment" button. On phone the fairness table squeezes and the header wraps; the average-kids column is clipped at 375px.

## Not captured

- **Ultrawide (3440x1440):** the browser pane cannot render that width, so it is not captured.
- **Image files:** screenshots are shown inline, not saved to disk.

## Notes

- Sign-in failure earlier was caused by the dev server being started in a sandbox that blocks Supabase, not by the app code. Running the server from a normal terminal fixed it.
- Test data includes party customer names. Do not reuse these screenshots outside the design team.
