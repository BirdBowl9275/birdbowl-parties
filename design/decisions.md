# Parties redesign: approved decisions (Jeff, 2026-11-23)

Jeff approved the visual direction in design/preview/index.html and design/design-system.md, and these answers to section 7 of the spec:

1. **Confirm steps:** approved. Add a confirm step before cancelling a party and before removing a user (status set to removed). This is a behaviour change, approved.
2. **Header links per role:** each role sees only the screens it can use. Admin sees all.
3. **Sign out in the header** for sales and manager: approved.
4. **Sales edit forms** fold behind an "Edit" button: approved.
5. **Manager viewers (Dion, Susie, Sophia):** not decided. The redesign does not change any permission.
6. **Font:** system font stack. No web font download.
7. **Icons:** copy the needed Lucide SVGs into the app. No new npm dependency.
8. **Logo:** use web/public/brand/bird-bowl-logo.png (Jeff's PNG, 1868x1865). An SVG would be better later. Brand red #D7002A still to be confirmed with a colour picker.

9. **Accent colour (2026-11-23):** brand red #D7002A is the accent, with #FF4D64 for red text on dark surfaces. The old blue accent (#6b9cff) is retired; blue remains only as the focus ring. Jeff left the choice to the design lead ("however you see it visually best"), which supersedes the earlier "keep blue accent" note in the deploy chat.

## Rollout

- Pilot first: design tokens, shared header, and the manager schedule. Jeff approves the pilot before other screens.
- Backup: .backups/2026-11-23-pre-redesign (web/src, configs, design docs).
- Models: builder on Sonnet 5.5, critic on Opus 5.5.

## Pilot approval (2026-11-23)

Jeff approved the pilot's visual direction (manager schedule, header, tokens, light/dark) for rollout. Order: sales parties, then staff, then admin (users and settings), then login and pending. One screen per phase, with tests, build and before/after screenshots each time.

## Design lead decisions during rollout (2026-11-23)

- **Staff slot pills (phase 3):** "Details hidden" (neutral, lock icon) before the reveal and "Details shown" (success green, lock-open icon) after it. This replaces spec 3.9's "Details on the morning" / "Revealed" (info blue), because blue is reserved for the focus ring (decision 9) and the shorter labels fit a phone card. design-system.md 3.9, 4.2 and 7 still show the old wording; this entry supersedes them.
- **Staff Sign out:** kept both the header Sign out and the in-page Sign out button on /app (spec 3.1, 4.2, 4.7 #10), so staff on phones have a labelled button.
- **Admin rows use the list pattern (critic M7):** per-row edit forms on /admin/users use `ul`/`li` with labelled controls and an `aria-hidden` visible header, the same as sales parties. The table-role pattern (spec 3.10) stays for the manager week only. Spec 3.10 is superseded for admin rows.
- **Admin settings grouping (critic P7):** Fair host assignment / Availability deadline / Day-of timing, with the bowling cutoff under Day-of timing, instead of spec 4.6's Availability / Assignment / Reveal. Display only; the six keys, forms and Save buttons are unchanged.
- **Pending users in one frame (critic N5):** pending users sit in one warning-toned frame at the top of /admin/users, instead of spec 4.5's left bar on each row. When nobody is pending the frame is dropped and the empty text shows quietly.
- **No-JS remove trade-off:** the "removed" option on /admin/users is disabled until JavaScript has loaded, so nobody can be removed by accident on a first press. With JavaScript off an admin cannot remove a user on this screen; other edits still work. Do not re-enable the option without a confirm, and do not add a second no-JS removal path.
- **Disabled buttons in the auth card (phase 5, critic P1):** `.auth-card button:disabled` uses `--surface-selected` / `--text-muted` / `--border` (6.6:1 light, 5.5:1 dark, no opacity) instead of spec 3.4's `--surface-sunken` / `--text-disabled` / `--border-subtle`. Deliberate, scoped to the auth card because the 3.4 style washed out on the sign-in screen. Promote to the global `button:disabled` in a later pass if Jeff agrees.

## Jeff's answers to open decisions (2026-11-23)

1. **npm audit warnings:** Jeff took the recommendation. `npm audit` (2026-11-23) reports 9 (3 low, 1 moderate, 3 high, 2 critical), all "No fix available". Critical/moderate (tinypool, @vitest/mocker) are test-only and never shipped. postcss is build-time on our own CSS. sharp (libvips) is only used by Next's image optimiser, which this app doesn't use for user images. @supabase/auth-js is runtime but has no fix yet. Decision: no upgrade now (no fix exists, and upgrades need approval anyway); re-run `npm audit` before each deploy and upgrade when fixes ship. The install scripts (esbuild, fsevents, sharp) are the packages' normal native setup and are fine.
2. **Viewers (Dion, Susie, Sophia) are read-only.** Today they hold the `manager` role, which can reassign hosts, lock and save. Making them read-only needs a new role (or permission) in the database, RLS, middleware and the header links: a permission and schema change outside the UI redesign. It goes as its own task and needs Jeff's explicit approval before any change. Until then the redesign keeps current behaviour.
3. **Party type colours:** only two party types exist. Bowling = Bird Bowl (brand red). Arcade = Game Zone (its violet/cyan palette). The database values stay `bowling` and `other`; the UI shows `other` as "Arcade" (display label only, no schema change). The Game Zone logo is NOT used as app branding; it may appear only as the marker for arcade parties (and the Bird Bowl logo for bowling parties). Blue stays reserved for the focus ring, so arcade uses violet, not blue.
4. **Cancelled test parties** ("Design QA test", "Design QA test 2" in the test project): keep them. They are cancelled, harmless, and useful for checking the cancelled-row style; removing them would need a hard delete the app doesn't offer.
- **Party type tags (phase 6, critic M1):** the bowling-ball icon is hand-drawn because Lucide has none. Square tags (radius-xs) = party type; round pills = status.
- **Sign-in card position and footer (phase 5):** on laptops the card sits 12vh from the top (not spec 4.1's 30%), so the code step and errors stay above the fold on short screens; the spec's "Bird Bowl" footer line is not built, because the card's brand row already carries the logo and name. The theme toggle in the card is icon-only at every width (labels kept for assistive technology).

## Access decision (2026-11-23, Jeff)
- **Dion and Susie: read-only.** They may view the manager schedule and the parties list but not add, edit, cancel, assign, lock or save. Needs a new read-only access level (database role, RLS, route checks, hidden controls). Not built yet; needs Jeff's approval of the plan, then test project first, then production.
- **Sophia: same access as Mady (sales) and Stephanie (manager).** The `manager` role already includes everything `sales` can do (`can_manage_parties()` covers sales, manager and admin), so Sophia needs the `manager` role and no code change. If she isn't already manager, Jeff sets it in Admin, Users.
