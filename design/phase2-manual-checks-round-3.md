# Phase 2 (Sales parties): manual browser checks after builder round 3 (parent session, 2026-11-23)

tsc clean, vitest 73/73, no literal \u escapes in sales files. Pilot server http://localhost:3300, test data. No party was cancelled in this round.

## Defect found and fixed by the parent session
- With one confirm open, pressing another party's "Cancel party" did not open it (open list empty after the click). Cause: the outside-press handler and the focus-leave handler both closed the first confirm on pointerdown; the row shrank before release, so the click landed elsewhere. Fix in cancel-party.tsx: outside close listens for the completed `click`; the focus-leave close is skipped while a pointer is pressed (pointerdown/pointerup/pointercancel flag), so it only applies to keyboard focus moves.

## Re-test after the fix (1440x900, real clicks and keys)
- Open confirm 1: focus on "Keep party", one open.
- Press "Cancel party" on the next row: confirm 2 opens in one click, confirm 1 closes, focus on "Keep party" of 2.
- Tab from "Keep party": focus moves to "Edit Host Two Customer", confirm closes.
- Escape: closes, focus returns to the "Cancel party" summary.
- Click empty page area: closes, focus not moved.
- Confirm is in flow: the open row grows and pushes the next row down; nothing is covered.

## Layout
- Desktop trigger height 32px. Phone trigger about 50px tall, no horizontal scroll at 375px (scrollWidth 375).
- 2560x1080: title, week navigation, list and rail now share one centred container.
- Dark mode 1440 with confirm open: readable, red surface distinct from the row.

## For the critic to judge
- When the confirm is open on desktop, the "Host assigned" pill wraps under the customer name in that row (the row's cells keep their line, the pill moves).

## After critic round 3 (PASS), parent session follow-ups
- R3-M1 fixed: `min-width: 0` on `.party-cancel` (1024px block); removed the no-op `justify-content` and `position`. Measured at 1440: Kids x = 663 before and after opening the confirm; pill no longer wraps; no horizontal scroll. Checked visually at 1024.
- R3-P1 fixed: pointer flag also resets on `contextmenu` and any `keydown`.
- R3-P3 fixed: document-level Escape while open. Test: open, click the confirm text (focus to BODY), Escape: closed, focus back on "Cancel party Tomorrow Customer".
- Still open (polish): R3-P2 (confirm opened before hydration not tracked until toggled), R3-P4 (Edit 32px on touch tablets), R3-P5 leftovers (duplicate `.party-cancel` declaration, `justify-content: center` near line 1997), R3-P6 (axe, 200% zoom).
- tsc clean, vitest 73/73.
