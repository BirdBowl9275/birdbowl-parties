# Phase 2: Sales parties screen (notes)

## What changed
- web/src/app/sales/parties/page.tsx: rebuilt layout on pilot patterns (sched-head, weeknav, banners with icons, day-group headings with counts, `.empty` "No parties.", pills with icons, `.panel` for Add a party). Same queries, actions, field names, defaults and validation attributes.
- web/src/app/sales/parties/cancel-party.tsx (new client component): confirm step before cancel.
- web/src/app/components/icons.tsx: added Lucide `CircleX` (Cancelled pill).
- web/src/app/globals.css: "Sales parties" block (party-list, party-item, edit-fold, confirm-box, btn-danger), before the reduced-motion block.
- Laptop (1024+): one row per party (time, customer + pills, kids, type, Cancel), Edit fold under each row, Add panel as right rail (380px at 1440+, stacked above 1024-1439 below the list). Phone/tablet: cards. At 1920+ the day list stays single-column (no 7-column grid).
- Edit: native details/summary, accessible name "Edit <customer>". Contains the unchanged PartyForm (updateParty, hidden id + week).
- Cancelled: dashed, sunken surface and muted text (no opacity, keeps contrast), "Cancelled" neutral pill with icon, no Edit or Cancel.
- Time now shows "5:00 p.m.–7:00 p.m." (formatClock, as the manager screen) instead of "17:00–19:00". Display only.
- Add panel is after the list in the DOM so tab order matches reading order; below 1440px a header button "Add a party" jumps to it (#add-party).
- Critique-round-3 lessons applied: no ARIA role on form or label; en dash typed as a character.

## Confirm before cancel
First "Cancel party" press is preventDefault and reveals "Cancel this party? This cannot be undone." with "Yes, cancel party" (submit, same form/action/id/week) and "Keep party". Focus moves to "Keep party" (safe default); Escape or Keep returns focus to the trigger; the text labels a role="group". No JS (or before hydration): the server-rendered form is the original single-step form, so the first press submits (progressive enhancement).

## Parity mapping
- 5: Add (all 7 fields, same names/defaults), Edit (folded), Cancel (confirmed); cancelled dimmed and not editable.
- 11: ?week= in prev/next links; ?msg= in role="status"; load error in role="alert".
- 13: Shows active and cancelled; "Host assigned"/"Not assigned" pill on each (also on cancelled).
- 14: "No parties." per day.
- 15: "Could not load parties." kept in role="alert" (banner-danger). Roles and guard (requireSalesAccess) untouched.

## Unsure / not verified
- No browser screenshots: /sales/parties redirects (307) without a sales session and I did not create one. Layout, dark mode, 390px and 200% zoom are unverified visually; please capture before approving.
- dayHeading/weekLabel are duplicated from the manager page (not exported there); a shared helper would be a follow-up.
- Cancel text "cannot be undone" is true today (no restore action exists).
- No axe run.
