# Accessibility check, round 2: manager schedule pilot (WCAG 2.2 AA)

Scope: `web/src/app/` on branch `redesign/pilot`: globals.css, layout.tsx, site-header.tsx, components/theme-toggle.tsx, components/header-nav.tsx, components/icons.tsx, manager/schedule/page.tsx. I read the code and the three screenshots (1280 light, 1280 dark, 375 light). I did not use a live browser.

Totals for verified findings: 0 Blocker, 0 Serious, 2 Moderate, 4 Minor. Two more items are likely Serious but still need a live browser (see the last section).

## Contrast results (WCAG relative luminance, computed from the token hex values)

Every text and non-text pair the pilot depends on passes AA in both themes.

| Pair | Light | Dark | Needed |
|---|---|---|---|
| text on bg | 16.55 | 16.40 | 4.5 |
| text-muted on surface / sunken / bg | 7.73 / 7.03 / 7.22 | 6.99 / 6.50 / 7.48 | 4.5 |
| text-subtle on bg / surface (empty day) | 5.55 / 5.95 | 5.90 / 5.52 | 4.5 |
| on-brand on brand (primary button) | 5.35 | 5.35 | 4.5 |
| on-brand on brand-hover | 6.69 | 4.70 | 4.5 |
| pill success / warning / info / danger / neutral (12px text) | 5.28 / 5.43 / 6.03 / 5.97 / 7.03 | 8.82 / 9.33 / 6.93 / 7.25 / 6.50 | 4.5 |
| focus ring on bg / surface / sunken | 4.83 / 5.17 / 4.70 | 7.54 / 7.05 / 6.55 | 3 |
| border-input (inputs, selects, Save) on surface / bg / sunken | 3.42 / 3.20 / 3.11 | 3.51 / 3.76 / 3.26 | 3 |
| theme option checked outline (border-input) on sunken | 3.11 | 3.26 | 3 |
| current nav underline (brand-fg) on surface | 5.35 | 5.55 | 3 |
| info-fg (checked lock text and icon) on info-bg | 6.03 | 6.93 | 4.5 |
| --border on surface (cards, weeknav, unchecked lock chip, toggle group) | 1.37 | 1.38 | decorative only |
| checked lock chip: info-bg vs surface / info-border vs surface | 1.11 / 1.68 | 1.08 / 1.80 | see finding 2 |

## Verified findings

| # | WCAG | Severity | File:line | Evidence | Exact fix |
|---|---|---|---|---|---|
| 1 | 1.4.12 Text Spacing | Moderate | globals.css:1363, 1432-1435 | At 1024px and up the time column is a fixed 140px track and `.pcell-time` is `white-space: nowrap` (`.pcell` has `min-width: 0`, overflow visible). In the 1280 screenshot "12:00 p.m.–2:00 p.m." already measures about 123px. With 0.12em letter spacing and 0.16em word spacing at 13px it grows to about 158px, so it spills over the 12px gap into the Customer column. | Remove `.pcell-time` from the nowrap rule at globals.css:1432 (keep it on the Save button), or widen the track to `minmax(140px, max-content)`. Wrapping at the en dash is acceptable. |
| 2 | 1.4.1 Use of Color / 1.4.11 Non-text Contrast (state) | Moderate | globals.css:1340-1352; page.tsx:309-314 | The lock checkbox is hidden (opacity 0). The only signals for checked versus unchecked are a blue tint (info-bg vs surface 1.11:1 light, 1.08:1 dark), a border change (info-border vs surface 1.68 / 1.80), a text hue change, and the padlock shackle closing on a 16px icon. The text says "Lock" in both states. In the screenshots, "Lock" (off) and "Lock" (on) look almost the same apart from colour. In forced-colors mode the background and border colours are overridden, which leaves only the shackle difference. | Give the checked state a boundary of at least 3:1 that does not rely on colour, for example `.lockchip:has(input:checked){border-color:var(--info-fg);border-width:var(--border-width-strong);font-weight:600}` (info-fg on surface is 6.70 / 7.51). Better still, add a visible check glyph that shows only when checked. Add `@media (forced-colors: active){.lockchip:has(input:checked){border:2px solid Highlight}}`. Keep the accessible name "Lock" so it does not change with state. |
| 3 | 2.4.3 Focus Order / 1.3.2 Meaningful Sequence | Minor | globals.css:699-705 (`.site-nav{order:3}` below 640px) | In the 375 screenshot the nav links sit on a second row below the theme toggle and Sign out. DOM and tab order is brand, Schedule, Parties, My schedule, then theme, then Sign out, so focus jumps down to row 2 and then back up to row 1. | Below 640px, either move `<HeaderNav>` after `.site-header-tools` in site-header.tsx and drop `order:3`, or accept the order and document it. The first option makes visual order and tab order match. |
| 4 | 1.3.1 Info and Relationships | Minor | page.tsx:347, 368 | When the average is null, the table cell and card show only "–". Screen readers announce "en dash" or nothing, so it gives no meaning. | `{s.averageKids === null ? <><span aria-hidden="true">–</span><span className="vh">No parties</span></> : …}` in both places. |
| 5 | 2.4.6 Headings and Labels | Minor | page.tsx:253-256 | The day heading reads as "Monday, Nov 23 2 parties", with the date number and the count running together ("23 2"). | Add a separator inside the count: `<span className="day-count"><span className="vh">, </span>{n} parties</span>`. |
| 6 | 1.3.1 / landmark noise (advisory, not a failure) | Minor | page.tsx:259 | Each party row is a `<form aria-label="Assign …">`. A named form becomes a `form` landmark, so a busy week fills the landmarks list with one entry per party. | Name the row with `aria-labelledby` pointing to the customer `<strong id>` only if landmarks are wanted. Otherwise wrap the rows in `role="group"`/`<fieldset>` semantics and leave the form unnamed. |

## Checked and passing

- 2.4.7 Focus Visible: inputs, selects, buttons and links get a 2px `--focus` outline with 2px offset (globals.css:336-342). Theme options and lock chips show the ring on the label through `:has(input:focus-visible)` (lines 819-822, 1354-1357). All ring contrasts are 3:1 or better (table above).
- 2.1.1 Keyboard: the theme options are native radios in a `<fieldset>` with legend "Theme" (arrow keys work). The lock is a native checkbox (Space works). The select, links and Save buttons are native.
- 2.5.8 Target Size: theme options are about 77x32 (44x44 on mobile), lock chips about 67x30, selects 32px tall or more, weeknav links 36-44px. The preview confirm checkbox is 20x20, but its wrapping `<label>` is at least 44px tall and toggles it.
- 2.5.3 Label in Name: "Save" becomes "Save assignment" (the name starts with the visible label). "Lock" and "Lock by hand" match their names. Sign out, the theme options and Previous/Next week are icon-only below 640px and have no visible text label to contradict.
- 4.1.2 Name, Role, Value: radios (Light/Dark/System) are in a named group. Checkboxes are named "Lock" and expose checked state natively. Selects are named "Host". `role="status"` and `role="alert"` are used correctly.
- 1.3.1 tables: the fairness and preview tables use `th scope="col"`, and the fairness table uses `th scope="row"`. The visual grid header is `aria-hidden`, and each cell has its own visually hidden label (`.plabel`).
- 1.4.1 pills: every pill has both an icon and text. The current nav link has an underline and a text colour change.
- Reduced motion: the global `prefers-reduced-motion` rule exists (globals.css:1532-1540). The only transition is on background colour.
- No-flash script (layout.tsx:17): it is wrapped in try/catch, runs in `<head>` before paint, and the System choice is handled by CSS alone. No CSP was found that would block the inline script.
- Skip link: present, becomes visible on focus, and targets `<main id="main">`.

## Needs a live browser to confirm

| # | WCAG | Likely severity | Where | Why it needs checking |
|---|---|---|---|---|
| A | 2.4.11 Focus Not Obscured (Minimum), 1.4.10 Reflow | Serious if confirmed | globals.css:639-645, 669-677, 699-705, 743-753, 200 | From 640px up the header is sticky and `scroll-padding-top` is 72px. The nav is `flex:1` with `flex-wrap:wrap` and 56px-tall links, while the tools take about 340px. By my estimate, between 640 and about 800px (and on a 1280 laptop at 200% zoom) the three manager links wrap inside the nav, making the header 112-168px tall. Shift+Tab would then scroll focused controls under the sticky header, possibly hiding them completely. Admins have five links, which makes it worse. Measure `.site-header` height at 640, 768 and 800px, and at 1280 with 200% zoom. Fix if confirmed: keep the header `position: static` until the header fits on one line (for example raise the 639.98px breakpoint to about 899.98px), or set `scroll-padding-top` from the measured header height. |
| B | 1.4.10 Reflow | Moderate | globals.css:236 (`.page{overflow-x:clip}`), 1104 (`.data-table-wrap{overflow:hidden}`) | Anything that overflows is clipped and cannot be reached, instead of scrolling. The preview table at 640-760px with "No eligible host" + "Fixed" nowrap pills, or a long one-word party type in the 76px Type track, could be cut off. Fix: use `overflow-x:auto` on `.data-table-wrap` (keep the radius with an inner wrapper), and check 320px and 400% zoom with long real data. |
| C | 1.4.3 / 1.4.11 | Unknown | dark screenshot, Save buttons | The dark capture shows Save as a mid-grey fill with dark text, which looks disabled. The code (globals.css:1289-1294) sets `--surface` with `--text`, so the capture may be stale or something is overriding it. Re-capture in dark mode and inspect the computed background. |
| D | Theme toggle state | Minor (not a WCAG failure) | theme-toggle.tsx:17-26 | The server HTML always checks "System". A stored Light or Dark choice only shows after hydration, so the toggle can briefly show the wrong option. Confirm it on a slow network. |
| E | 2.4.11 at 1440px and up | Low | globals.css:1064-1068 | The rail is sticky and contains no focusable elements, so it should be fine. Confirm that keyboard focus in the main column is never covered. |
