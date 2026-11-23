# "Invite someone": security review and verification (2026-11-23)

Reviewed by the security-reviewer agent, challenged by the security-verifier agent, fixes applied by the parent session. Code-level review.

## Design (Jeff's decision)
Jeff, Mady, Stephanie and Sophia invite (roles admin, sales, manager); viewers and staff cannot. An invite creates a PENDING account (default role, no tier) with `auth.admin.createUser` (service role key, server only). No email is sent: the inviter tells the person to sign in at parties.birdbowl.com with their email. An admin approves and sets the role. The inviter never chooses a role.

## Verdict
No path for a non-inviter to create accounts; no way for an inviter to grant access. Remaining risk is low and depends on a phished inviter account plus a careless approval.

## Findings (after verification)
| ID | Severity | Finding | Status |
|---|---|---|---|
| INV-01 | Low | Approval relied on a name the inviter typed (and the person can change). | Fixed: pending rows lead with the email; "Invited by" shows the inviter (0007 `profiles.invited_by`, set only by the server). |
| INV-01a | Low–Medium | "Invited by" showed the inviter's name, which users can change. | Fixed: shows name and email (email is guarded). |
| INV-02 | Low | No cap or audit on invites. | Fixed: 10 invites per inviter per 24 hours; inviter recorded. Small race at the cap and "already exists" attempts not counted: accepted. |
| INV-03 | Low | Service role key exposure depends on Vercel scoping. | Open, Jeff: add the PRODUCTION key in Vercel for Production only, marked Sensitive; never in Preview or Development. The TEST key in local `web/.env.local` (project `ocps…` = birdbowl-parties-test, git-ignored) is acceptable; never put the production key there. |
| INV-04 | Low | Free-text `?msg=` and invitee name/email in the URL. | Fixed for /invite (fixed message codes). Admin pages still show free text (pre-existing, Low). |
| INV-05 | Info | No build-time server-only guard on the admin client. | Accepted: the key has no NEXT_PUBLIC_ prefix so it is never bundled; `server-only` would be a new dependency. |
| INV-06 | Info | Inviters can tell whether an email has an account. | Accepted (only four trusted inviters). |
| M2 | Medium (uptime) | Deploying the code before migration 0007 breaks Admin, Users ("Could not load users"). | Production order: apply 0007 and read the column back BEFORE deploying. |

## Confirmed
- `inviteUser` calls `requireSalesAccess()` first; viewers, staff, pending, removed and signed-out users are refused before the admin client is created.
- Nothing reads user or app metadata for permissions; the trigger only takes `full_name` and the server-set `invited_by` (validated as an existing profile id).
- Sign-in stays OTP to the real mailbox; invitation-only (`shouldCreateUser: false`).
- Removed users cannot be reactivated by invite ("already has an account").
- Redirects go to fixed paths; messages render as text.

## Not verified
- A real invite on the test project (needs the test service role key in `web/.env.local`).
- Supabase Auth settings on production: "Allow new users to sign up" must stay OFF; anonymous sign-ins off.
- Vercel key scoping (after Jeff adds it).
