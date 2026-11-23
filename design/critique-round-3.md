# Critique, round 3 (final): Parties redesign pilot (tokens, header, manager schedule)

Date: 2026-11-23. Critic: design critic. Worktree `.worktrees/redesign-pilot`, branch `redesign/pilot`, rounds 1 to 3 uncommitted. Read-only on app code.

## Verdict: FAIL (one High item; a two-line fix)

Every round 2 item, and every round 2 accessibility item except one justified deferral, is fixed and verified. Parity is intact. There is no open WCAG 2.2 AA failure. One new High regression blocks: round 3's R2-P2 change prints a literal `–` in the preview's time column (R3-H1). **When R3-H1 is fixed and a `?preview=1` capture shows "2:00 p.m.–4:00 p.m.", the pilot passes.** That check is mechanical and needs no further critique round. Everything else below is Medium or Polish and does not block.

## Evidence and method

- Round 3 screenshots (manager role, test data): F = 1024x800 light (`…1795417500058-xpx1i6.jpg`), G = 1920x1080 dark (`…1795417504777-k088q0.jpg`), H = 1440x900 light (`…1795417505929-60186b.jpg`).
- The parent's live measurements after round 3 are treated as evidence. Header: 700px static at 117px with 16px scroll padding; 1024px sticky at 57px with 72px. Lock chip: 1.37:1 border when off; `rgb(29,78,216)` border plus a check when on; named "Lock" in both states. Four `role="table"` groups, each labelled by its h2. Dark Save: 15.33:1, enabled. The save, persist, status and `?week` retest passed.
- `tsc --noEmit --incremental false` ran here (`node node_modules/typescript/bin/tsc`): **exit 0, clean.** Nothing was written to the worktree.
- `typescript.transpileModule` on a JSX sample confirmed R3-H1: JSX text `–` compiles to the string `"\\u2013"`, so the backslash is printed. SWC and Babel follow the same JSX text rule.
- Parity was checked by grepping field names, actions and live regions in `page.tsx` against `main`. All counts are equal.
- **Not done:** no axe run and no headless browser in this session. No round 3 capture of `?preview=1`, 375px or 768px.

## Round 2 items: status

| Item | Status | Evidence |
|---|---|---|
| R2-H1 dark Save looks disabled | **Closed** | Parent's computed style: rgb(22,23,26) / rgb(237,237,239), 15.33:1. Screenshot G shows the dark Save correctly. |
| R2-M1 / a11y A (2.4.11) header at 640 to 1023px | **Fixed** | `globals.css:206-210, 650-654`. Header static and 16px scroll padding below 1024px; 700px is measured at 117px static. |
| R2-M2 week wraps at 1600 to 2199px | **Fixed** | `globals.css:1492-1498`. G: seven columns on one row plus the rail at 1920. |
| R2-M3 rail wraps names | **Fixed** | `globals.css:103, 1062, 1103-1106`. H: the names fit on one line at 1440. |
| R2-M4 fairness table stretched | **Fixed** | `globals.css:1108-1112`. F: the table is capped and readable. |
| R2-M5 / R1-M7 table semantics | **Fixed, but the markup is non-conforming** | `page.tsx:261-328`. See R3-M1. |
| R2-P1 Lock and Save heights on phone | Fixed in code | `globals.css:1318-1322`. Not recaptured at 375px. |
| R2-P2 preview dates and order | **Partly fixed; the time column regressed** | Dates and sorting are correct (`page.tsx:124, 207`). The times are broken, see R3-H1. |
| R2-P3 spec week label | Fixed | `design-system.md:334`. |
| R2-P4 repo hygiene | Open (the parent's job) | `git status` still lists `web/node_modules` and `web/src/app/brand-logo-128.png` as untracked. |
| a11y 1 (1.4.12) time nowrap | Fixed | `.pcell-time` is no longer in a nowrap rule. F and H show it on one line at the default spacing. |
| a11y 2 (1.4.1 / 1.4.11) lock state | **Fixed** | `globals.css:1360-1387`. A 6.7:1 border, an inset ring, weight 600, the padlock swap and a check glyph (`'\2713' / ''`). Forced-colors rule present. The name stays "Lock" (measured). |
| a11y 3 phone nav tab order | Deferred (justified) | Minor, not an AA failure at the current order. Carried as follow-up F2. |
| a11y 4 "No parties" average | Fixed | `page.tsx:358, 379`. |
| a11y 5 heading separator | Fixed | `page.tsx:257`. |
| a11y 6 form landmarks | Fixed | `role="row"` replaces the form landmark. See R3-M1 for its conformance problem. |
| a11y B clipped tables | Fixed | `globals.css:1118` uses `overflow-x: auto`. |
| a11y D toggle flash, E rail focus | Not a WCAG failure | The rail has no focusable children. D is carried as follow-up F5. |

## Parity: 7 of 7 manager items still present

`party_id`, `week` (x2), `host_id`, `locked`, `confirm`, `reassignParty`, `saveProposedAssignments`, `role="status"` and `role="alert"` all match `main` one for one. The `?week`, `?preview` and `?msg` contract is unchanged. The parent's round 3 retest confirmed that a save persists with the status message and `?week` kept. The preview save was not submitted (correctly).

## Remaining items

### High (blocking)

**R3-H1. The preview shows a literal "–" between start and end times.**
- Screen: `/manager/schedule?week=…&preview=1`, in both the table (640px and up) and the phone cards. No capture yet; the evidence is the code plus the transpile check.
- Code: `web/src/app/manager/schedule/page.tsx:208` and `:220`: `{formatClock(p.start)}–{formatClock(p.end)}`.
- What's wrong: JSX text is not a JavaScript string, so escape sequences are not processed. The page renders "2:00 p.m.–4:00 p.m.", and screen readers read "backslash u 2 0 1 3". This is the screen where a manager checks times before "Save these assignments". It was introduced in round 3 and was not caught because the preview was not recaptured. It is not a WCAG failure, but visibly corrupted data on a confirm step fails the "next to Stripe" bar and is a regression.
- Exact fix: on both lines, write the character directly, as the main grid already does at `:273`: `{formatClock(p.start)}–{formatClock(p.end)}`. `{'–'}` also works. Then capture `?preview=1` at 1440 and 375 and confirm "2:00 p.m.–4:00 p.m.". Do not submit the confirm form.

### Medium (follow-ups, not blocking)

**R3-M1. The new table markup puts ARIA roles on elements that do not allow them (ARIA in HTML).**
- Code: `page.tsx:268` `<form role="row">` (a form allows only `search`, `none` and `presentation`) and `page.tsx:306` `<label role="cell">` (a label allows no role). axe reports both as `aria-allowed-role` (best practice). Chromium currently exposes the intended row and cell, so this is not an AA failure, but support varies by browser and screen reader.
- Exact fix, with the same layout and field names:
  - `<form action={reassignParty} role="none" className="prow-form">` wrapping `<div role="row" className="prow" aria-label={`Assign ${p.customer_name}`}>`, which contains the hidden inputs and the cells.
  - Add `.prow-form { display: contents; }` to `globals.css`. Keep every `.prow` rule as it is; the `:last-child` rule at `:1485` must then target `.day-rows > .prow-form:last-child .prow`.
  - Change the host cell to `<div role="cell" className="pcell pcell-host"><label><span className="plabel">Host</span><select …></label></div>` and add `.pcell-host label { display: block; }`.
  - Re-check that each select's name is still "Host" and each checkbox's is still "Lock".

**R3-M2. The admin header may wrap at 1024 to about 1100px while sticky (2.4.11 risk, outside the manager pilot).**
- Code: `site-header.tsx:18-19` (admin adds "Users" and "Settings"), `globals.css:642-654`.
- What's wrong: estimated from F, the brand is about 90px, the three manager links about 297px and the tools about 358px. Adding about 155px for two more links gives about 950px against a 960px content box, or about 945px with a classic scrollbar. If the nav wraps, the header is about 113px tall, which exceeds the 72px scroll padding.
- Exact fix: before the admin screens roll out, measure `.site-header` height as admin at 1024, 1100 and 1280. If it is over 57px at any of those widths, raise the static breakpoint at `globals.css:206` and `:650` to `1279.98px`.

### Polish

- **R3-P1.** The row name "Assign Tomorrow Customer" (`page.tsx:268`) is announced on every row entry. Use just the customer name, or `aria-labelledby` on the `<strong>` with an id, for less noise. Optional.
- **R3-P2.** The 1440 empty days (H, "No parties.") render as full-width boxes 52px tall, which makes Wednesday and Thursday heavier than they need to be. At 1024 to 1919px, consider `.day-group .empty { padding-block: var(--space-2); }`.
- **R3-P3.** The `content: '\2713' / ''` alt-text syntax (`globals.css:1370`) is dropped on Safari before 17.4. Those users lose the check glyph but keep the border, weight and icon. Acceptable; noted so nobody "simplifies" it to `content: '\2713'`, which would leak "check mark" into the name.

## Follow-ups for the next screens (count: 7)

1. F1. Apply the R3-M1 row pattern (`form role="none"` wrapping a `div role="row"`) to any other per-row form, such as sales parties and admin users.
2. F2. Phone nav tab order (a11y 3): move `<HeaderNav>` after `.site-header-tools` in `site-header.tsx` and drop `order: 3`.
3. F3. Measure the admin header (R3-M2) before the admin rollout.
4. F4. Add an axe pass (scratch folder `@axe-core/playwright`) and recaptures at 375, 768, 1440 and 1920 in both themes, including `?preview=1`, to every round. The R3-H1 regression came from not recapturing.
5. F5. Toggle hydration flash (a11y D): render the server-side checked option from a cookie, or accept it and document it.
6. F6. Repo hygiene (R2-P4): stage files by name, include `brand-logo-128.png`, and add `/web/node_modules` (no trailing slash) to `.gitignore`.
7. F7. Long real-data stress test: a 40-character customer name, a long party type in the 76px Type track, and 400% zoom at 1280.

## Scores (1 to 5)

| Area | Before | R1 | R2 | R3 |
|---|---|---|---|---|
| Brand identity | 1 | 2 | 4 | 4 |
| Visual hierarchy | 2 | 4 | 4 | 4 |
| Consistency / tokens | 2 | 4 | 4 | 4 |
| Density and scanability | 2 | 3 | 4 | 5 |
| Responsive: phone | 2 | 3 | 4 | 4 |
| Responsive: ultrawide | 2 | 2 | 3 | 5 |
| Accessibility | 3 | 3 | 4 | 4 (R3-M1 conformance; no axe run) |
| States (empty, error, status) | 2 | 4 | 4 | 4 |
| Theming (light/dark) | 2 | 4 | 3 | 5 |
| Craft vs Linear/Stripe | 2 | 3 | 4 | 4 (5 once R3-H1 is fixed) |

## Keep (don't "fix" these away)

- 1920 dark (G): seven quiet day columns, compact cards, dashed empty days, and the rail on the right. It reads like Linear's cycle view.
- 1024 (F): the fairness table capped and placed above the grid; one line per party.
- The checked lock chip: the border, check glyph and padlock swap read clearly in both themes without depending on colour.
- A header that is static below 1024px, instead of a measured sticky offset. It is simple and robust.
- The per-day `role="table"` labelled by its h2, with a visually hidden header row. Keep the structure and fix only the host elements (R3-M1).
- No colour literals outside the token block; `--rail-width` is a token.

## R3-H1 resolved (parent session, 2026-11-23)

Lines 208 and 220 of web/src/app/manager/schedule/page.tsx now use a literal en dash instead of `–` in JSX text. Verified in a live browser with ?preview=1 at 1440 and 375: table cell and card title read "2:00 p.m.–4:00 p.m."; no literal "–" anywhere on the page. tsc clean. Per the critique's own condition, the pilot verdict is **PASS**.
