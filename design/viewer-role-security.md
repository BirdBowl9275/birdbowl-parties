# Viewer role: security review and verification (2026-11-23)

Reviewed by the security-reviewer agent, challenged by the security-verifier agent, fixes applied by the parent session. Code-level review; evidence from the test project `birdbowl-parties-test`.

## Verdict
No Critical, High or Medium findings. The change REDUCES access: Dion and Susie currently hold `manager`, which reads every staff profile (email, phone), reads all availability and writes parties. As viewers they can only read parties (the same party details managers see) and host names, tiers and daily caps. No viewer write path exists through the UI, server actions, PostgREST or RPCs.

## Findings (after verification)
| ID | Severity | Finding | Status |
|---|---|---|---|
| WEB-01 | Low → Info once applied | Viewers could add, change or delete their own availability rows (policies only checked "own row, active"). | Fixed: 0006 adds `not is_viewer()` to the three availability self policies; test added. Applied and read back on the test project. |
| WEB-02 | Low | An admin could give a viewer a host tier, making them assignable. | Fixed twice: Admin form refuses it (unit test), and 0006 adds a database rule `profiles_viewer_not_host` (test added). Applied on the test project. |
| WEB-03 | — | Local test script swallowed failures. | Rejected as stale by the verifier: the script was already rewritten to exit 1 on any failure and require the final pass line. |
| WEB-04 | Info | Read-only switch keyed on the exact role name. | Fixed: default deny (only roles allowed to edit get controls). |
| WEB-05 | Info | 0004 and 0005 must not run in one transaction. | Documented; fails safe (nothing granted). |
| WEB-06 | Info | Party-reading accounts need strong sign-in. | Not caused by this change (they already read parties as managers). Keep their mailbox MFA strong. |
| WEB-07 | Low | Rollback order broke once 0006 existed. | Fixed: 0006 rollback drops then recreates; 0005 rollback says roll back 0006 first. |
| Info | Info | Existing assignments: clearing a tier does not unassign future parties. | Added to the production plan: check Dion's and Susie's tier and future assignments before switching. |
| Info | Info | `setting_text()` is callable by pending users (pre-existing, low-sensitivity config). | Recorded, no action. |

## Confirmed
- Party insert/update still require `can_manage_parties()`; no delete grant. Settings admin-only. Role/tier/status changes blocked by the profile guard.
- Every server action calls `requireManager()` or `requireSalesAccess()`, which exclude viewers.
- `schedule_hosts()`: security definer, fixed search_path, four columns, role-gated; anon and public have no EXECUTE.
- Every deploy order fails closed.

## Not verified
- The local RLS suite (`sh supabase/tests/run-local.sh`): the sandbox cannot start Postgres; Jeff to run.
- Production roles, tiers and assignments for Dion, Susie and Sophia.
- Production default function grants (test project: anon has no EXECUTE).
