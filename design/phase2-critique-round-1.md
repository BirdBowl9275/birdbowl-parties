# Phase 2 critique, round 1: Sales parties (`/sales/parties`)

Date: 2026-11-23. Critic: design critic. Worktree `.worktrees/redesign-pilot`, branch `redesign/pilot`. Phase 2 is uncommitted on top of `62e8c50`. I was read-only on app code.

## Verdict: FAIL

There are two blockers:

1. **H1** is a WCAG 2.2 AA failure (1.4.3). The cancelled-row text renders at 2.77:1 in light and 3.14:1 in dark, because a legacy `opacity: 0.6` rule still applies. The builder's note says "no opacity", but the cascade says otherwise.
2. **H2** is an approved-behaviour gap. Before hydration or without JS, the first "Cancel party" press cancels the party with no confirmation. The action cannot be undone, and Jeff approved a confirm step (decisions.md item 1).

Parity is intact: 5 of 5 sales items are verified. The layout direction is right and consistent with the approved manager schedule. Fix H1 and H2, then recapture the cancelled row and the confirm flow in both themes, and this should pass.

## Evidence and method

- **Before:** 375 `…1795417982015-z8rkev.jpg`, 1280 `…1795417982232-uprbw2.jpg`, 2560 `…1795417982140-7zvao8.jpg` (all light, main branch).
- **After:** A = 1440 light `…1795418074766-zsabui.jpg`, B = 1440 Edit open `…1795418109322-o7w2pu.jpg`, C = 1440 confirm open `…1795418123639-zp4a88.jpg`, D = 1440 after cancel `…1795418142270-bs5z4l.jpg`, E = 375 light `…1795418152835-er0tvn.jpg`, F = 1280 dark `…1795418152950-c35jkb.jpg`, G = 2560 light `…1795418153053-ej0a01.jpg`. All files are in `~/.claude/projects/-Users-jeffgeb-Documents-UI-UX-Parties/e867c792-…/tool-results/`. I opened and compared every one.
- **Parent's live functional test** (phase2-manual-checks.md): I treated it as evidence. Add, Edit, Cancel-confirm, Keep and the cancelled state all passed.
- **Parity:** grep counts in `page.tsx` + `cancel-party.tsx` against `git show main:web/src/app/sales/parties/page.tsx`:
  - `name="` 11/11, `role="status"` 1/1, `role="alert"` 1/1, "No parties." 1/1, "Could not load parties." 1/1, `?week=` 2/2, `requireSalesAccess` 2/2.
  - `cancelParty` (actions.ts:90) is unchanged and still reads `id` and `week`.
- **Contrast:** computed from the `globals.css` tokens with WCAG relative luminance, composited for `opacity: 0.6` over `--bg`.
- **Type check:** `tsc --noEmit --incremental false` exits 0.
- **Not done:** no axe run, no headless browser or 200% zoom capture in this session (no sales session available to me), and no 1024 or 1920 capture.

## Parity: 5 of 5 verified

| Item | Result |
|---|---|
| 5 (add, edit, cancel; cancelled dimmed, not editable) | All 7 fields, names, defaults, `min`/`max`/`maxLength`/`required` and hidden `id`/`week` are identical (page.tsx:187-237 vs main). Edit is inside a fold. Cancel posts the same form plus a confirm step. Cancelled rows render no Edit and no Cancel (page.tsx:151, 157). Live-tested by the parent. |
| 11 (`?week=`, `?msg=` + status) | Prev/next links page.tsx:73, 78. `msg` is in `role="status"` (page.tsx:89). |
| 13 (active + cancelled, host pill on each) | Pills at page.tsx:130-146, also shown on cancelled rows (D). |
| 14 ("No parties." per day) | page.tsx:116. |
| 15 (load error `role="alert"`) | page.tsx:95-98, verbatim. |

One non-functional regression: main's `aria-label` on each `PartyForm` was dropped. See P1.

## Ranked fix list

### High (blocking)

**H1. Cancelled rows fail text contrast in both themes (WCAG 1.4.3).** Screens D and F; concern 1.
- Code: `globals.css:583-585` is the legacy rule `.cancelled { opacity: 0.6; }`. It still matches `<li class="party-item cancelled">` (page.tsx:122). The new rule at `globals.css:1635-1650` only adds colour on top of it.
- Measured (small text, so 4.5:1 is required):

| Element | Light | Dark | Without the opacity |
|---|---|---|---|
| `--text-muted` on `--surface-sunken` | **2.77:1** | **3.14:1** | 7.03 / 6.50 |
| "Not assigned" pill | **2.58:1** | **4.22:1** | |
| "Host assigned" pill | **2.52:1** | **4.04:1** | |
| "Cancelled" pill | **2.77:1** | **3.14:1** | |

- This also breaks spec 3.13 (design-system.md:419): "No opacity dimming (it fails contrast)".
- Exact fix: in `globals.css`, change line 583 from `.cancelled {` to `.user-row.cancelled {`. Admin and staff do not use `.cancelled`. A grep of `web/src` finds it only in sales `page.tsx`, and main used it only on `.user-row`. Do not add opacity anywhere else.
- Verify: recapture D and F. Computed `opacity` on `.party-item.cancelled` must be `1`.

**H2. Before hydration or without JS, one press cancels the party with no confirmation.** Concern 4.
- Code: `cancel-party.tsx:60-70`. The server-rendered trigger is `type="submit"` inside a form whose action is `cancelParty`, and only `onClick` (JS) intercepts it.
- What's wrong: on a phone over a slow connection, the page is visible and tappable for one or more seconds before hydration. A tap in that window cancels the party for good. The app has no un-cancel, and the copy itself says "cannot be undone". Decision 1 approved a confirm step, not a confirm step that only exists after JS loads. This is not acceptable as progressive enhancement, because the fallback is the dangerous path.
- Minimal fix that still allows cancelling without JS: make the server HTML a native disclosure. The confirmation then exists in markup, and JS only adds focus handling and Escape. In `cancel-party.tsx`, render:

```tsx
<details className="cancel-fold" ref={detailsRef} onToggle={onToggle}
  onKeyDown={(e) => { if (e.key === 'Escape' && detailsRef.current?.open) close(); }}>
  <summary ref={triggerRef} className="btn btn-secondary btn-danger-outline">
    Cancel party<span className="vh"> {customer}</span>
  </summary>
  <form action={action} className="cancel-form">
    <input type="hidden" name="id" value={id} />
    <input type="hidden" name="week" value={week} />
    <div role="group" aria-labelledby={textId} className="confirm-box">
      <p id={textId} className="confirm-text">Cancel this party? This cannot be undone.<span className="vh"> Customer: {customer}.</span></p>
      <div className="confirm-actions">
        <button type="submit" className="btn-danger">Yes, cancel party</button>
        {hydrated ? <button type="button" ref={keepRef} className="btn-secondary" onClick={close}>Keep party</button> : null}
      </div>
    </div>
  </form>
</details>
```

- How the pieces behave:
  - `hydrated` is a `useState(false)` that a mount `useEffect` sets to `true`.
  - `onToggle` focuses `keepRef` when the disclosure opens.
  - `close()` sets `detailsRef.current.open = false` and focuses `triggerRef`.
  - Keep `role="group"` on the inner `div`, not on the `form` (critique round 3 lesson).
  - Without JS: press Cancel party, which opens the disclosure; then press "Yes, cancel party", which submits. Pressing the summary again closes it. That is two deliberate presses in every case.
- CSS:
  - Add `.cancel-fold > summary { list-style: none; }` and `.cancel-fold > summary::-webkit-details-marker { display: none; }`.
  - Move the existing `.cancel-form button` sizing to `.cancel-fold > summary, .cancel-form button`.
- Verify: with JS disabled (Playwright `javaScriptEnabled: false`), the first press must not send a POST. Do not complete the submit against real data.

### Medium

**M1. The header "Add a party" button is never hidden, so 1440+ shows two red primaries for the same form.** Screens A, G; concern 3.
- Code: page.tsx:83 `className="btn hide-lg"`. `.hide-lg { display:none }` (globals.css:272) loses to `.btn { display:inline-flex }` (globals.css:382). Both have the same specificity, and `.btn` comes later.
- Spec 3.4: one primary per view region.
- Intended behaviour: the rail sits below the list up to 1439px, so the jump button is useful only below 1440.
- Exact fix: change the class to `btn add-jump` and add `@media (min-width: 1440px) { .sales .add-jump { display: none; } }` to the Sales block.
- Also fix the stale note in `phase2-sales-notes.md:12`, which says "below 1024px".

**M2. Ultrawide rows stretch to about 2000px, leaving a large gap between the customer and the Kids/Type columns.** Screen G; concern 2.
- Spec 4.3 (design-system.md:497) says the week list is max 1400px. The ultrawide rule (line 298) says "never wider text".
- Code: `globals.css:1886-1889` uses `minmax(0, 1fr) 380px` with no cap.
- Exact fix: add `--list-max: 1400px;` beside `--rail-width` (globals.css:103). Then add `@media (min-width: 1920px) { .sales-layout { grid-template-columns: minmax(0, var(--list-max)) var(--rail-width); justify-content: center; } }`.

**M3. Laptop columns don't line up across rows, and opening the confirm shifts the row.** Screens D and C.
- Cancelled rows have no Cancel cell, so Kids/Type sit about 70px further right than active rows (D, Wednesday).
- With the confirm open, the 270px box squeezes `.party-who`. Kids/Type jump about 110px left and the row grows (C, Wednesday).
- Exact fix, in the `@media (min-width: 1024px)` block (globals.css:1804):
  - Give `.party-cancel { flex: 0 0 var(--actions-col); display: flex; justify-content: flex-end; position: relative; }` and add the token `--actions-col: 120px`.
  - In page.tsx:151, render `<div className="party-cancel" />` for cancelled rows instead of `null`.
  - Make the open confirm a popover so it stops reflowing the row: `.cancel-fold[open] .confirm-box { position: absolute; right: 0; top: calc(100% + var(--space-1)); z-index: 2; width: max-content; max-width: 320px; box-shadow: var(--shadow-md); }`.
  - Below 1024px, leave it in flow as it is now (E is fine).

**M4. "Cancel party" is styled as a neutral secondary button, not the spec's danger outline.** Screens A, E, F.
- Spec 3.4 (design-system.md:345) says Danger (outline) is for "Cancel party (in-row)": `--surface` fill, `--danger-fg` text, `--danger-border` border, `--danger-bg` on hover.
- Code: `cancel-party.tsx:63` uses `secondary btn-secondary`.
- Exact fix: add `.btn-danger-outline { background: var(--surface); color: var(--danger-fg); border-color: var(--danger-border); } .btn-danger-outline:hover { background: var(--danger-bg); }` and apply it to the trigger (already shown in the H2 snippet).
- Contrast is fine: `--danger-fg` on `--surface` is 6.57:1 light and 7.85:1 dark.
- Also drop the `secondary` class from both buttons. Its `margin-top` (globals.css:432) is cancelled only by `.cancel-form button { margin:0 }`.

**M5. "Save party" inside each Edit fold is a red primary.** Screen B shows Save party, Add party and the header button as three red primaries.
- Spec 3.4 (line 343) says Secondary is for "Save (per row)".
- Code: page.tsx:234.
- Exact fix: `<button type="submit" className={party ? 'btn-secondary' : undefined}>`.

### Polish

- **P1 (concern 5).** The forms lost their accessible names (main had `aria-label` on `PartyForm`). This is not an AA failure, because the aside is labelled "Add a party" and the Edit fold is named by its summary. Restore it without landmark noise: add an optional `labelledBy` prop to `PartyForm` and pass `labelledBy="add-title"` for the add form only (`<form aria-labelledby={labelledBy}>`).
- **P2.** The "Cancelled" pill disappears into its row. `--neutral-bg` equals `--surface-sunken` in both themes (#f4f4f5 / #1d1e22), so only a 1.24:1 border shows (D, F). Spec 3.12 (line 397) also names the `ban` icon, not `circle-x`. Fix: for `.party-item.cancelled .pill-neutral`, use `background: var(--surface); border-color: var(--border-strong, var(--border));`, and swap `CircleX` for Lucide `Ban` in icons.tsx.
- **P3.** Field rows in the Add panel and the Edit fold are loose (A, B: about 28px between rows). The global `input { margin-bottom: var(--space-4) }` (globals.css:367) stacks on the grid gap. Fix: `.sales .party-form .fields input { margin-bottom: 0; }`.
- **P4.** The rail is 380px (globals.css:1888), while the manager rail uses `var(--rail-width)` (400px). Use the token so both screens share one rail width.
- **P5.** Magic numbers: 150, 64 and 92px track widths (globals.css:1811, 1820, 1826) and the 140px min-widths (lines 1617, 1708). Move them into `--col-time`, `--col-kids`, `--col-type` and `--btn-min` beside `--rail-width`.
- **P6.** `dayHeading` and `weekLabel` are copied from the manager page (page.tsx:12-30). Export them once from `@/lib/parties` (follow-up; display only).

## Concern rulings (phase2-manual-checks.md)

| # | Ruling |
|---|---|
| 1 | Real WCAG failure, but the cause is the legacy opacity, not the tokens. See H1. The tokens alone pass (7.03 and 6.50). |
| 2 | Valid, and it breaks the spec's 1400px cap. See M2. |
| 3 | Valid, and it's a CSS cascade bug, not a design choice. See M1. |
| 4 | Not acceptable. See H2 for a no-JS-safe fix. |
| 5 | Valid but not an AA failure. See P1. |

## Confirm-cancel implementation (after hydration)

Sound. The first press is intercepted. Focus moves to "Keep party", the safe default (C). Keep and Escape (handled on the form, so it works from either button) return focus to the trigger. The `role="group"` is labelled by the question text plus the customer name, so screen readers announce it on focus entry. The submit reuses the same action, `id` and `week`. The solid danger button inside the confirm matches spec 3.4. White on `--danger` is 6.57:1. The focus ring on `--danger-bg` is 4.69:1 light and 6.51:1 dark. Keep all of this through the H2 change.

## Responsive and consistency

- **375 (E):** clean cards, 44px controls, full-width week bar and "Add a party". Same pattern as the manager phone cards.
- **1280 (F):** list first, Add panel after the list, jump button visible (correct at this width).
- **1440 (A):** list plus a sticky rail, matching the manager layout.
- **2560 (G):** see M2.
- **200% zoom:** not captured. At 1440 it resolves to the 720px tablet layout, which is not verified here.

## Scores (1 to 5)

| Area | Before | After R1 |
|---|---|---|
| Brand identity | 1 | 4 |
| Visual hierarchy | 1 | 4 (3 primaries when Edit is open, M1/M5) |
| Consistency / tokens | 2 | 3 (M4, P4, P5) |
| Density and scanability | 1 | 4 |
| Responsive: phone | 2 | 4 |
| Responsive: ultrawide | 1 | 3 (M2) |
| Accessibility | 3 | 2 (H1 fails AA; H2) |
| States (empty, error, status, cancelled) | 2 | 3 (cancelled state, H1/P2) |
| Theming (light/dark) | 2 | 4 |
| Craft vs Linear/Stripe | 1 | 3 (4 or more once M1 to M3 are fixed) |

## Keep (don't "fix" these away)

- The Edit fold: a native `details`/`summary` named "Edit <customer>", ghost style with a rotating chevron, and the unchanged form inside. It is exactly what decision 4 asked for, and it turns a wall of inputs (the before screenshots) into a scannable week.
- Day headings ("Monday, Nov 23" plus a muted count) and 12-hour times that match the manager schedule.
- The Add panel after the list in the DOM, with a jump link below 1440, so tab order follows reading order.
- The focus default on "Keep party" and the return of focus to the trigger.
- The cancelled-row treatment in principle (sunken fill, dashed border, muted tokens, a pill with a word). Only the stray opacity is wrong.
- No colour literals in the new Sales CSS block.

## Round 2 changes (builder)

Fixed: H1 (legacy rule scoped to `.user-row.cancelled`; only sales page.tsx used `cancelled` on `.party-item`; no opacity remains, tokens give 7.03/6.50 text; cancelled neutral pill uses `--surface` fill and `--border-input` border), H2 (native `details.cancel-fold` with confirmation and the unchanged cancelParty form in server HTML; JS adds focus to Keep party, Escape/Keep close and refocus the summary; Keep button renders after hydration only), M1 (`.add-jump` hidden from 1440px), M2 (`--list-max` 1400px cap from 1920px), M3 (fixed `--actions-col` slot also rendered for cancelled rows; confirm is an absolute popover from 1024px, inline on phones), M4 (`.btn-danger-outline`), M5 (Save party uses `btn-secondary`), P1 (`labelledBy="add-title"` on the add form), P2 (Ban icon, pill fill/border), P3, P4 (rail uses `--rail-width`), stale note in phase2-sales-notes.md.
Not fixed: P5 (column-width tokens) and P6 (shared date helpers in src/lib, out of scope).
Not verified here: no screenshots or no-JS browser run (dev server and builds off limits); needs a recapture of cancelled and confirm-open rows in both themes.
