# Phase 2 builder, round 3: Sales parties fixes

Choice: in-flow expansion (not overlay). The spec does not call for an overlay, so the confirm now pushes content down at every width.

- M1 (web/src/app/sales/parties/cancel-party.tsx, globals.css): 
  - Added open state via onToggle; while open, a document pointerdown listener closes the fold on an outside press or tap, with no focus move.
  - onBlur (focusout) on the details closes it when focus goes to a non-null element outside the fold.
  - Opening a fold closes any other details.cancel-fold[open]; no focus change.
  - Escape still closes and refocuses the summary. No-JS safety, Keep party after hydration, focus to Keep on open, the confirm text, the hidden id and week inputs and the action are unchanged.
  - Desktop absolute-positioned popover removed. The open fold is now a column flex block in the party-cancel column, right-aligned, up to --confirm-max wide, and the row grows taller (align-items: flex-start via :has so other cells stay on the first line).
- M2 (globals.css): at 1920px and up, `.sales.sched` max-width = --list-max + --space-6 + --rail-width, so the title, week nav, banners, list and rail share one container.
- M3 (globals.css): a `(min-width: 1024px) and (pointer: fine)` block gives the Cancel summary and the confirm buttons min-height --control-sm (32px), above the 24px minimum. Coarse pointers and phones keep 44px.
- Polish: removed the unused CircleX export (no importers). Removed the dead `.user-row.cancelled` rule (no page uses user-row with cancelled). Added `.sales` custom properties --col-time, --col-kids, --col-type, --btn-min, --field-min and --confirm-max, and used them in the Sales block.

Checks: `tsc --noEmit -p web` is clean; vitest 73 of 73; grep for a literal backslash-u in web/src/app/sales finds none. `next build` was not run. No server actions, queries, routes or other screens changed. Not visually verified in a browser this round.
