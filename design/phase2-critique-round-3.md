# Phase 2 critique, round 3: Sales parties (`/sales/parties`)

Date: 2026-11-23. Critic: design critic. Worktree `.worktrees/redesign-pilot`. Read-only on app code. No browser this round: judged from code plus the parent's measured results in `phase2-manual-checks-round-3.md`.

## Verdict: PASS

No blocking items. M1, M2 and M3 from round 2 are fixed, the polish items are done safely, parity is intact (5 of 5 Sales items), and I found no WCAG 2.2 AA failure in code. One new Medium (the open confirm widens the actions column, which causes the pill wrap the parent saw) and five Polish items remain. All are non-blocking. I recommend fixing R3-M1 before committing the phase because the fix is one line.

## Method

- Read `cancel-party.tsx` (121 lines), `page.tsx`, the Sales block of `globals.css` (1568-2015) and `git diff HEAD -- icons.tsx`.
- Parity: counted tokens in `git show main:web/src/app/sales/parties/page.tsx` against the current page plus `cancel-party.tsx`. `git diff main -- web/src/app/sales/actions.ts web/src/lib` is empty.
- Grepped for: `CircleX`, `user-row.cancelled`, `cancelled`, literal `\uXXXX` in `web/src/app/sales`, `role=` in `web/src/app/sales`, and hard-coded colours and px values in the Sales block.

## Round 2 items, re-verified

| Item | Status | Evidence |
|---|---|---|
| M1 popover dismissal | **Fixed** | See the M1 analysis below. The parent's real-click retest passed every case. |
| M2 ultrawide edges | **Fixed** | `globals.css:1991-1993` caps `.sales.sched` at `--list-max + --space-6 + --rail-width`. The parent confirmed one centred container at 2560. |
| M3 trigger height | **Fixed** | `globals.css:1938-1943` (padding, small text) plus `1961-1966` (`min-height: var(--control-sm)` under `pointer: fine`). The parent measured 32px at desktop and about 50px on phone. |
| P2 CircleX | **Removed** | No match anywhere in `web/src`. `git diff HEAD -- icons.tsx` shows only the `Ban` addition, so nothing else in the file changed. |
| P3 dead `.user-row.cancelled` | **Removed** | No match. `cancelled` now appears only as `.party-item.cancelled` (globals.css:1644-1656, 1757, 2002) and `page.tsx:120-157`. The `.user-row` screens are unaffected. |
| P4 column tokens | **Fixed** | `--col-time`, `--col-kids`, `--col-type`, `--btn-min`, `--field-min` and `--confirm-max` are defined once in `.sales` (1571-1578) and used at 1625, 1726, 1860, 1869, 1875, 1908 and 1956. The Sales block has no raw widths left. The `min-width: 140px` at 591/601 is in the legacy `.inline` and `.party-form` rules outside the Sales block, existed before this work, and is overridden by `.sales .party-form button`. |
| P1 unverified captures | Still open | See R3-P6. |

## M1 analysis (cancel-party.tsx)

1. **No-JS and pre-hydration safety: intact.** The server HTML is still `details > summary` plus the form (lines 80-119). Keep only renders after hydration (line 111). The first press only toggles the disclosure; submitting needs "Yes, cancel party". None of the new handlers can submit anything.
2. **Outside click (lines 63-66, 70):** closes on the completed `click` when the target is outside the fold. It only sets `open = false` and never calls `focus()`, so **no focus is stolen**. The parent confirmed focus stays put.
3. **Focus-leave (lines 84-91):** closes only when `relatedTarget` is a non-null node outside the fold, so switching windows or tabs (relatedTarget null) does not close it. It does not refocus. The parent confirmed that Tab from Keep moves to "Edit Host Two Customer" and the fold closes.
4. **One open at a time (lines 42-44):** opening a fold closes every other `details.cancel-fold[open]` without moving focus. Their `onToggle` then sets `isOpen=false`, and their listeners are removed. With a mouse, the document click listener on fold 1 also closes it. That is redundant but harmless.
5. **Escape (line 93):** unchanged. It closes and returns focus to the summary. Not gated by the pointer flag.
6. **Listener cleanup (lines 71-76):** every listener is added with the same capture flag it is removed with. The effect re-runs on `isOpen` and also cleans up on unmount, so no listeners leak.
7. **Pointer flag:**
   - It resets to false every time a fold opens (line 56), and pointerup and pointercancel reset it as well. Because the listeners exist only while the fold is open, a flag left true after a close cannot carry into the next open.
   - One narrow way it can stick while open: a right-click that opens a context menu can swallow `pointerup` on some platforms. Keyboard Tab-out then does not close until the next pointer press, but Escape still works. That makes it Polish, not a keyboard trap. See R3-P1.
8. **The defect the parent fixed (closing on pointerdown, so the row shrank before release):** the switch to `click` plus the blur gate is correct, and the retest shows a one-click switch between folds.

## Parity

All counts match main:

- `name="` 11/11, `required` 5/5, `maxLength` 2/2, `min={` and `max={` 1/1, `defaultValue` 7/7
- `role="status"` 1/1, `role="alert"` 1/1, "No parties." 1/1, "Could not load parties." 1/1
- `?week=` 2/2, `requireSalesAccess`, and create/update/cancel 2/2 each

Other checks:
- The cancel form still posts hidden `id` and `week` to `cancelParty`.
- Cancelled rows still render no Edit and no Cancel.
- The `?msg=` banner is unchanged.
- `actions.ts` and `lib` have no diff against main.

**Parity: 5 of 5 Sales items verified (5, 11, 13, 14, 15).**

## Text and ARIA hygiene

- No literal `\u` escapes in `web/src/app/sales`. The en dashes in `page.tsx:29,125` are real characters.
- The only `role=` attributes are `group` on a `div` (cancel-party.tsx:102), `status` and `alert` on `div`s (page.tsx:89,95). No roles are on `form` or `label` elements.

## Pill wrapping (manual-checks item): not blocking. The cause is R3-M1.

## Remaining items (ranked)

### Blocking

None.

### Non-blocking: Medium

**R3-M1. Opening the confirm widens the actions column, so Kids and Type shift left in that row and the "Host assigned" pill wraps.**
- Location: `globals.css:1878-1885` and `1903-1909`. Evidence: the parent's note in `phase2-manual-checks-round-3.md:22`.
- Cause:
  - `.party-cancel` is `flex: 0 0 var(--actions-col)` (120px) but keeps the default `min-width: auto`.
  - The open fold is `width: max-content; max-width: var(--confirm-max)` (up to 320px), so the flex item's automatic minimum grows to about 300px.
  - Every column except `.party-who` has a fixed basis, so `.party-who` absorbs the loss. The pill wraps, and Kids and Type (which sit between `.party-who` and `.party-cancel`) slide about 180px left of the other rows' columns.
  - This contradicts the builder's own comment at 1895-1897 ("extending left under the empty space of the row").
- Standard broken: grid alignment and column consistency (spec table and list layout). It only occurs while a confirm is open, so it is not an AA issue.
- Exact fix: in the `@media (min-width: 1024px)` block, add `min-width: 0;` to `.party-cancel`. Merge it with the rule at 1898-1901 (see R3-P5).
  - The column then stays 120px. The column-direction `align-items: flex-end` lets the fold overflow to the left, below the one-line Time/Who/Kids/Type cells, which is the intended in-flow drop.
  - Re-check at 1024 and 1440 with the confirm open: the columns should line up with the neighbouring rows, the pill should stay inline, and the confirm should not cover any text.

### Non-blocking: Polish

- **R3-P1. The pointer flag can stick after a context-menu press.** On macOS, `pointerup` may not fire after a right-click opens the context menu (`cancel-party.tsx:57-62, 88`). Until the next pointer press, Tab-out then does not close the fold. Escape and Keep still work.
  - Fix: inside the effect, also register `document.addEventListener('contextmenu', onUp, true)` and `document.addEventListener('keydown', onUp, true)`, and remove both in the cleanup. A key press means the next focus move is keyboard-driven.
- **R3-P2. A fold opened before hydration is not tracked.** If the user opens a fold before React hydrates, `isOpen` stays false. Outside-click close then stays off until the next toggle. The other folds are still closed when another fold opens, because that only depends on the other fold's `onToggle`.
  - Fix: in the hydration effect (line 27-29), also run `setIsOpen(detailsRef.current?.open ?? false)`. Do not move focus.
- **R3-P3. Escape can stop working inside the open confirm.** Clicking the non-focusable confirm text moves focus to `body`, so the `onKeyDown` on `details` no longer receives Escape.
  - Fix: register a `keydown` listener on `document` inside the same open-only effect, which calls `close()` on Escape. Then remove `onKeyDown` from `details`.
- **R3-P4. Tablet inconsistency.** At 1024px and up on a coarse pointer (iPad landscape), the Cancel summary keeps 44px but the Edit summary drops to 32px (`globals.css:1950-1952` is not gated). Both pass spec line 265 (24px minimum, 44px on phones).
  - Fix: move `.edit-fold summary { min-height: var(--control-sm); }` from the 1024 block into the `(min-width: 1024px) and (pointer: fine)` block at 1961.
- **R3-P5. Leftover CSS from the popover.**
  - `.party-cancel` is declared twice in the 1024 block (1878-1885 and 1898-1901). Merge the two.
  - `justify-content: flex-end` (1882) and `position: relative` (1883) no longer do anything. Drop them.
  - `justify-content: center` at 1997 is a no-op now that M2 is in. Drop it.
- **R3-P6. Carried from R2-P1.** Still uncaptured:
  - an axe run
  - 200% zoom at 1440
  - the phone (375) with the confirm open
  - the cancelled row at 375 in dark

  Capture these at the next screenshot pass. I don't expect failures.
- **Data note (not a design issue).** Jeff should decide whether the "Design QA test" parties in the test DB stay.

## Scores (1 to 5)

| Area | Before | R1 | R2 | R3 |
|---|---|---|---|---|
| Brand identity | 1 | 4 | 4 | 4 |
| Visual hierarchy | 1 | 4 | 5 | 5 |
| Consistency / tokens | 2 | 3 | 4 | 5 |
| Density and scanability | 1 | 4 | 4 | 5 |
| Responsive: phone | 2 | 4 | 4 | 4 |
| Responsive: ultrawide | 1 | 3 | 4 | 5 |
| Accessibility | 3 | 2 | 4 | 4 (axe/zoom unverified) |
| States | 2 | 3 | 4 | 4 (R3-M1) |
| Theming | 2 | 4 | 4 | 4 |
| Craft vs Linear/Stripe | 1 | 3 | 4 | 4 (R3-M1) |

## Keep (don't "fix" these away)

- **The cancel disclosure:**
  - no-JS safe (the first press only opens)
  - closes on a completed click, not on pointerdown
  - focus-leave close applies to keyboard moves only
  - closing never moves focus; only Escape and Keep return focus to the trigger
- **The in-flow confirm:** it pushes rows down instead of overlaying them.
- **Pointer-sensitive density:** 32px controls only under `pointer: fine`, and 44px everywhere else.
- **Layout and styling:**
  - one page container at ultrawide
  - the named `.sales` column measures
  - the fixed actions column
  - cancelled rows styled with tokens, not opacity
