# Polish pass notes (2026-11-23)

All paths under web/src/app unless noted. No behaviour, query, action, field, message or permission changes. No git commands run. `next build` not run.

1. Staff phone nav row: globals.css, new rule in a max-width 1023.98px block hides `.site-nav` when it holds only a current-page link.
2. Touch targets: globals.css. `.theme-opt` 32px min-height moved to `(min-width:1024px) and (pointer:fine)` (44px otherwise). `.edit-fold summary` 32px moved into the existing fine-pointer block with the cancel controls.
3. Page titles: layout.tsx now uses `{ default: 'Parties', template: '%s · Parties' }` (description, robots, icons kept). `export const metadata` added to login, pending, app, manager/schedule, sales/parties, admin/users, admin/settings pages (all server components). /admin only redirects, so it has none.
4. Loading placeholders: new loading.tsx in app/, manager/schedule/, sales/parties/, admin/ (role="status", visually hidden "Loading…", skeleton bars). CSS appended to globals.css (`.loading-skeleton`, `.skeleton-line`), pulse disabled under prefers-reduced-motion.
5. Cleanup: removed `staff-hidden` class (app/page.tsx), `.brand-link img` and `.auth-brand img` rules, merged the duplicate `.party-cancel` declaration (the `justify-content`/`position` lines noted in R3-P5 were already gone), dropped the no-op `justify-content: center` on `.sales-layout` at 1920px, deleted brand-logo-128.png (grep found no references). R3-P2: sales/parties/cancel-party.tsx hydration effect now also calls `setIsOpen(detailsRef.current?.open ?? false)`.
6. Spec: design/design-system.md, sections 3.1, 3.9, 3.12, 3.16, 3.19 (new), 4.1, 4.2, 4.5 marked "(updated 2026-11-23)".

Checks: `tsc --noEmit` clean; vitest 75/75.
