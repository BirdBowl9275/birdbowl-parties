# Production plan: viewer role, invites, logo and polish (for Jeff's approval)

Decision (2026-11-23): Dion and Susie are read-only. Sophia has the same access as Mady and Stephanie, which is the existing `manager` role (no code change).

## What changes
- Database (Supabase production project), three SQL files, run one at a time in the SQL editor:
  1. `supabase/migrations/0004_add_viewer_role.sql`: adds the role name `viewer`. Run ALONE and wait for "Success" before step 2 (Postgres rule: a new role name can only be used after it is saved).
  2. `supabase/migrations/0005_viewer_read_access.sql`: viewers may read parties (like sales/managers) and a host list (names, tiers, daily caps only). The editor shows a "destructive operation" warning because it replaces the parties read rule; that is expected, choose Run.
  3. `supabase/migrations/0006_viewer_no_availability_writes.sql`: viewers cannot write availability, and a database rule that a viewer never has a host tier. Same expected warning.
  4. `supabase/migrations/0007_invited_by.sql`: records who invited each person. MUST be applied before the app is deployed, or Admin, Users fails to load.
- Vercel: add `SUPABASE_SERVICE_ROLE_KEY` (the PRODUCTION project's service_role key) under Settings, Environment Variables, for **Production only**, marked **Sensitive**. Jeff does this; never paste it in chat.
- App (Vercel deploy from main): viewers land on the Schedule, see Schedule and Parties in the header, and see "View only" with no edit, assign, lock, preview, add or cancel controls. Admin, Users lists "viewer" in the Role menu, and refuses a host tier for a viewer.
- Nothing changes for staff, sales, managers or admins.

## Order (each step fails safe if the next one hasn't happened yet)
1. Run 0004, then 0005, then 0006, then 0007 on production.
2. Read-back check on production (read-only query): the three functions exist, anon cannot execute them, `parties_select` uses `can_view_parties`, the three availability policies mention `is_viewer`, `profiles.invited_by` exists.
3. Add the service role key in Vercel (Production, Sensitive), then deploy the app (`npx vercel deploy --prod` from `web/`).
4. Invite Dion, Susie and Sophia from "Invite someone" (production currently has only Jeff's account), tell them to sign in, then approve them in Admin, Users.
5. Before switching: check whether Dion or Susie has a host tier or future assigned parties (clearing a tier does not unassign existing parties; reassign those first).
6. In Admin, Users: set Dion and Susie to role `viewer`, tier "Not a host" (the app and database refuse a tier for a viewer). Confirm Sophia is `manager` (set it if not).
7. Dion or Susie signs in (or Jeff checks with them): Schedule and Parties show "View only", no edit controls.

## Rollback
- App: `npx vercel rollback`.
- Database: first set Dion and Susie back to `manager`, roll the app back first, then run the rollback SQL in the header of 0007, then 0006, THEN 0005 (that order). The `viewer` role name can stay; it grants nothing.

## Evidence so far (test project `birdbowl-parties-test`)
- 0004, 0005, 0006 applied. As a viewer: parties visible 11, own profile only, host list 5, availability 0; edits to parties, locks, settings changed 0 rows; availability policies block viewers.
- Browser as a viewer: Schedule and Parties read-only at laptop and phone widths; /admin/users returns 404; the preview link is ignored.
- tsc clean, vitest 75/75. Security review: no Critical/High/Medium; Low items fixed (see design/viewer-role-security.md, verified).
- Local RLS suite (0001 to 0006): ALL 75 ASSERTIONS PASSED (run by Jeff, 2026-11-23).
