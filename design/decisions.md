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
