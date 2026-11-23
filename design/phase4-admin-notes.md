# Phase 4: Admin (users and settings)

## What changed
- web/src/app/admin/users/page.tsx: new layout (sched/admin section, banners for msg and load error, pending frame, dense list). Still a server component with the same query.
- web/src/app/admin/users/user-row.tsx (new, client): one user's form. Same form, same hidden `id`, same fields (`status`, `role`, `tier`, `daily_cap`), same options and values, same `updateProfile` action passed in as a prop. Adds a status pill and the remove confirm.
- web/src/app/admin/settings/page.tsx: six settings in three labelled groups (Fair host assignment, Availability deadline, Day-of timing), each with label, unit, help text and its own form, hidden `key`, `value` input and `updateSetting`. Only keys present in the table are shown, as before.
- web/src/app/admin/nav.tsx: removed (tab strip retired; header has Users and Settings for admins). Nothing else imported it.
- web/src/app/admin/page.tsx and actions.ts: untouched (/admin still redirects to /admin/users).
- globals.css: removed the old admin-nav and user-row rules; added an "Admin: users and settings" block at the end. Tokens only, no hard-coded colours. Reuses pill, banner, panel, empty, confirm-box, btn-danger, btn-secondary.
- Layout: phones are cards (user + pill, two-column fields, full-width Save); tablets wrap fields in one row; 1024px and up is one aligned grid row per user under a column header (User, Status, Role, Host tier, Daily cap) with 32px controls on fine pointers, 44px on touch. Pending users are in a warning-toned frame at the top; removed users are dashed and dimmed.

## Parity
- 8 (approve / change status, role): status and role selects unchanged; pending section first, Save unchanged.
- 9 (tier 1/2/3/not a host, cap 0-3 for every user): options and values unchanged for every row, pending and others.
- 10 (six settings, each own save): six forms, each with its own Save, same keys, same validation messages and redirects.
- 14 / finding 2 (empty state "No requests waiting."): same text, now in the empty-state style.
- Sign out: removed with the old tab strip; the header Sign out (form post to /auth/signout) is on every admin page. No other change.
- Messages: `?msg=` still shown (status banner); redirects and messages come from the untouched actions.
- Settings load error: unchanged (no banner was there before, none added).

## Remove confirm (decision 1)
The status stays a select inside the one Save form. Approach, in user-row.tsx:
1. Server HTML: the "removed" option is rendered `disabled` for every user who is not already removed. Without JavaScript, or before hydration, "removed" cannot be selected, so a first press of Save can never remove anyone. All other edits (approve, role, tier, cap) save as today.
2. After hydration the option is enabled. The form's submit handler checks the selected status: if it is "removed" and the user is not already removed, it calls preventDefault and opens an inline confirm ("Remove <name>? They lose access immediately.") with "Yes, remove" and "Keep user".
3. Only "Yes, remove" (the submit button inside the form, detected by event submitter) lets the submit through to the same server action. "Keep user" (or Escape, or changing the select) closes it; Keep and Escape also reset the select to the saved status and return focus to it. Focus moves to "Keep user" when the confirm opens (safe default).
4. Trade-off: with JavaScript failing, an admin cannot remove a user on this screen (fail-safe). Other edits still work. If a no-JS removal path is wanted, a details/summary fold like Cancel party could be added; not built to keep the row small.
5. Already-removed users keep "removed" selected and enabled, so re-saving them is not a new removal and needs no confirm.
- Server-side rule that admins cannot change their own status is unchanged (the confirm shows first, then the existing error message appears).

## Checks
- ./node_modules/.bin/tsc --noEmit: clean.
- ./node_modules/.bin/vitest run: 6 files, 73/73 passed.
- `next build` not run (per instruction). grep for \u escapes in admin: none. No ARIA roles on form or label elements (role="group" only on the confirm div, as in cancel-party). No new dependencies, no git commands.
- Not done: screenshots and browser check of the admin screens (they need an admin login on the test project); please review them visually, especially the confirm at 1024-1440px.

## Round 2 (critic round 1 fixes)
Applied: B1 (shared `UsersHead` above both lists, rule hiding the pending header removed), M1 (header: small, 500, 0.005em, sentence case), M2 (Clock icon added to components/icons.tsx; Pending warning, Active success, Removed danger with Ban; pill text sentence case; select options unchanged), M3 (pending Save is primary), M4 (warning frame only when someone is pending; empty text unchanged), M5 (help text rewritten; checked against engine.ts ceilingFor and eligible, lib/admin.ts validateSetting and TIME regex, and migration 0001 availability_locked and reveal_at), M6 (unit width 64px, input 160px, settings max-width 720px), P1 (contact line hidden when same as name), P2 (confirm fit-content, max-width 100%), P4 (admin max 1200px), P6 (inputMode numeric on the three integer keys; type stays text).
Skipped as instructed: P3, P5. Decisions M7, P7, N5 and the no-JS trade-off are in design/decisions.md.
Behaviour unchanged: same actions, field names, values, options, hidden inputs, messages and redirects.
