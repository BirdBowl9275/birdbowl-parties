# Phase 2 critique, round 2: Sales parties (`/sales/parties`)

Date: 2026-11-23. Critic: design critic. Worktree `.worktrees/redesign-pilot`, branch `redesign/pilot`, uncommitted on `62e8c50`. I was read-only on app code and used only read-only git.

## Verdict: PASS

There are no Critical or High items and no WCAG 2.2 AA failure. Both round 1 blockers are fixed, and I verified each one in code and in the parent's live evidence. Three Medium items and three Polish items remain. None of them blocks this phase, but the two popover and alignment items (M1, M2) should be fixed before the phase is committed.

## Method

- **Code:**
  - Read `page.tsx`, `cancel-party.tsx`, `icons.tsx` and the `globals.css` diff against the working tree.
  - Ran `git diff main --stat` and compared `page.tsx` with `git show main:web/src/app/sales/parties/page.tsx`.
- **Live evidence:** I used `phase2-manual-checks-round-2.md` as evidence: computed contrast, the server HTML (no JS), the interaction results and tsc/vitest.
- **Screenshots opened:**
  - `…1795418595929-0uoj5g.jpg` (1440 light)
  - `…1795418570962-27fp4l.jpg` (1440 dark, confirm open)
  - `…1795418596058-492401.jpg` (2560 light)
  - `…1795418597161-0fna7o.jpg` (375 light)
  - I compared them against round 1 shots A to G and the before shots.
- **Not done in this round:**
  - I had no browser session, so there was no axe run and no 200% zoom capture.
  - Nobody captured the phone with the confirm open, or the cancelled row in dark at phone width.

## Round 1 items, re-verified

| Item | Status | Evidence |
|---|---|---|
| H1 opacity contrast | **Fixed** | `globals.css:585` is now `.user-row.cancelled`. A grep of `web/src` finds `cancelled` used as a class only at `sales/parties/page.tsx:122`. `.user-row` users (admin/settings:33, admin/users:60, app/page:44) never add `cancelled`, so no other screen changes. The rule is now dead CSS; see P3. The parent measured opacity 1, 7.03:1 in light and 6.50:1 in dark. |
| H2 one-press cancel without JS | **Fixed** | `cancel-party.tsx:40-71`: the server HTML is `details > summary` plus the form. The parent's server HTML check found 7 folds and 0 bare submit buttons. Opening the fold needs one press and submitting needs a second, deliberate press. |
| M1 duplicate primary | **Fixed** | `page.tsx:83` `.add-jump` is hidden at 1440px and up (`globals.css` 1440 block). The 1440 and 2560 shots show one primary. |
| M2 ultrawide stretch | **Fixed** | `--list-max` cap at `globals.css:1962`. The 2560 shot shows the list at about 1400px. There is a header alignment side effect; see M2 below. |
| M3 column drift / reflow | **Fixed** | `page.tsx:151` always renders `.party-cancel`. In the 1440 shot, Kids/Type line up on active and cancelled rows. The confirm no longer reflows the row, but it now overlays the next row; see M1 below. |
| M4 danger outline | **Fixed** | `cancel-party.tsx:48`. Visible in all shots. |
| M5 red Save | **Fixed** | `page.tsx:236`, `btn-secondary`. |
| P1 form name | **Fixed** | `page.tsx:180/199`. The parent confirmed the form's accessible name is "Add a party". |
| P2 pill / Ban | **Fixed** | `globals.css:1751`, `page.tsx:143`. The pill is now distinct on the sunken row in light and dark. |
| P3 field spacing | **Fixed** | 1440 shot. |
| P4 rail token | **Fixed** | `var(--rail-width)`. |
| P5 column tokens | Not fixed (accepted) | Still Polish; see P4 below. |
| P6 shared date helpers | Deferred | Out of scope. |

## cancel-party.tsx regression review

- **details/summary semantics:** sound.
  - The summary has its implicit button role and expanded state.
  - Its name is "Cancel party <customer>", with the customer name in a `.vh` span.
  - The summary contains no nested interactive content (only text and a span).
  - `role="group"` sits on the inner `div`, not the `form`.
- **Hydration-only Keep:** sound. The initial render is `hydrated=false` on both server and client, so it cannot cause a hydration mismatch. Before hydration, the open fold shows only "Yes, cancel party", and the user backs out by pressing the summary again. That is acceptable.
- **Focus:**
  - `onToggle` focuses Keep when the fold opens, and `close()` returns focus to the summary.
  - Closing with a second summary press leaves focus on the summary.
  - `close()` sets `open=false`, which fires `onToggle` again; that call is a no-op.
  - All of this is correct.
- **Escape:** the handler is on `details`, so it works from the summary, Yes and Keep. Limitation: once focus leaves the fold, Escape no longer closes it. See M1.
- **Is the confirm text announced?**
  - With JS: yes. Focus lands on Keep inside a group labelled by "Cancel this party? This cannot be undone. Customer: X."
  - Without JS: the summary announces "expanded", and the group label is read when Tab enters "Yes, cancel party". This is acceptable.
- **Parity:** counts are equal to main for:
  - `name="` (11/11), `required` 5/5, `maxLength` 2/2, `min`/`max` 1/1, `defaultValue` 7/7
  - `role="status"`, `role="alert"`, "No parties.", "Could not load parties."
  - `?week=` 2/2, `requireSalesAccess`, and create/update/cancel 2/2 each

  The cancel form still posts `id` and `week` to the unchanged `cancelParty`. Cancelled rows still render no Edit and no Cancel. **Parity: 5 of 5 (items 5, 11, 13, 14, 15).**

## Judging the three manual-check items

1. **Ultrawide header not aligned with the capped content:** valid. See M2.
2. **The confirm popover overlays the next row:** valid, but not an AA failure.
   - The next row's "Cancel party" button is only partly covered (in the dark shot, its lower edge shows below the popover), so 2.4.11 (minimum) is met.
   - The popover is still a non-modal overlay that stays open after focus leaves it, and it hides another row's data. See M1.
3. **Two cancelled throwaway parties in the test DB:** not a design issue. Jeff should confirm whether "Design QA test" and id 16 "Design QA test 2" should stay. I did not touch data.

## Remaining items (ranked)

### Medium

**M1. The confirm popover stays open when focus or a pointer leaves it, and it covers the next row's Kids/Type and its Cancel button. Several popovers can be open at once.**
- Location: `cancel-party.tsx:40-47` and `globals.css:1889-1897`. Evidence: the 1440 dark confirm-open shot.
- What's wrong: a non-modal popover should dismiss on focus-out or an outside click (as in Linear and Stripe). As it stands:
  - Tabbing from Keep to the next row leaves the box hiding that row's data.
  - Escape stops working once focus has left the fold.
- Exact fix:
  - In `cancel-party.tsx`, add `name="cancel-party"` to `<details>` (a native exclusive group, so only one fold is open at a time).
  - Add `onBlur={(e) => { if (detailsRef.current?.open && !detailsRef.current.contains(e.relatedTarget as Node | null)) detailsRef.current.open = false; }}` to `<details>`. React's `onBlur` bubbles like focusout. Do not refocus here.
  - Add a `useEffect` that, while open, listens for `pointerdown` on `document` and closes the fold when the target is outside `detailsRef.current`. Track open state through `onToggle` with `useState`.
  - Leave the no-JS behaviour as it is.

**M2. At 1920px and up, the title and week nav sit at the 2000px container edges while the list and rail are capped and centred at about 1824px, so the page has two left edges.**
- Location: the 2560 shot and `globals.css:1960-1965`.
- Spec: grid alignment, and ultrawide (design-system.md:292).
- Exact fix: in the existing `@media (min-width: 1920px)` sales block, add `.sales.sched { max-width: calc(var(--list-max) + var(--space-6) + var(--rail-width)); }`.
  - This caps the header, the banners and the layout together. `.sched` already has `margin: 0 auto`.
  - `justify-content: center` then has no effect and can stay or go.

**M3. The trigger is 44px tall at desktop while its own confirm buttons and the Edit summary are 32px. Active rows are about 60px tall versus about 40px for cancelled rows.**
- Location: the 1440 shot and `globals.css:1918`.
- Spec 3.4 (design-system.md:348): "sm 32px (dense table rows, desktop only)".
- Exact fix: change the selector at `globals.css:1918` from `.cancel-form button {` to `.cancel-fold > summary, .cancel-form button {`. This applies `min-height: var(--control-sm)`, `padding: 0 var(--space-3)` and `font-size: var(--text-small)` to the trigger at 1024px and up. Phones keep 44px.

### Polish

- **P1.** Unverified captures: phone (375) with the confirm open, cancelled row at 375 in dark, 200% zoom at 1440, and an axe run. Capture these at the next screenshot pass. They are not expected to fail, because the phone confirm is in flow and the tokens pass.
- **P2.** `icons.tsx:119` `CircleX` is now unused. Remove it, or keep it only if another phase will use it. The spec icon list (design-system.md:304) has `x` and `ban`, not `circle-x`.
- **P3.** `globals.css:585` `.user-row.cancelled { opacity: 0.6 }` now matches nothing, and opacity dimming is banned by spec 3.13. Delete the rule.
- **P4.** Carried over from round 1 P5: magic track widths (150, 64 and 92px at 1024px and up) and the 140px min-widths. Move them to `--col-time`, `--col-kids`, `--col-type` and `--btn-min`.

## Scores (1 to 5)

| Area | Before | R1 | R2 |
|---|---|---|---|
| Brand identity | 1 | 4 | 4 |
| Visual hierarchy | 1 | 4 | 5 |
| Consistency / tokens | 2 | 3 | 4 |
| Density and scanability | 1 | 4 | 4 (M3) |
| Responsive: phone | 2 | 4 | 4 |
| Responsive: ultrawide | 1 | 3 | 4 (M2) |
| Accessibility | 3 | 2 | 4 |
| States | 2 | 3 | 4 |
| Theming | 2 | 4 | 4 |
| Craft vs Linear/Stripe | 1 | 3 | 4 (M1) |

## Keep (don't "fix" these away)

- The native-disclosure cancel: safe without JS, focus goes to Keep, Escape and Keep close it, and the group label holds the question and the customer.
- The fixed `--actions-col` slot, which keeps the columns aligned on cancelled rows.
- The cancelled row's styling: sunken fill, dashed border, muted tokens, and a Ban pill with a surface fill. No opacity.
- One primary per view at 1440px and up, and a secondary Save inside the Edit fold.
- The Edit fold, the day headings with counts, and the Add panel after the list in DOM order.
