# Phase 3: Staff screen (/app, "Your schedule")

## What changed
- `web/src/app/app/page.tsx`: restyled. Same server component, same `my_schedule` RPC call (`p_from` today, `p_to` today + 14), same row type, same `/login` redirect. Added display-only grouping by day (database order kept) and a Today / Tomorrow chip.
- `web/src/app/globals.css`: one scoped "Staff: your schedule" block (`.staff*`) before the reduced-motion rule. Reuses existing tokens, `.day-group`, `.banner`, `.empty`, `.pill`, icons.
- Layout: single column capped at 44rem (readable at 375px, laptop and ultrawide; centred, top-aligned). From 640px each slot is time column + details; below that it stacks.
- The in-page Sign out form was removed because the shared header already renders a Sign out form (POST /auth/signout) for every active signed-in user. Header renders nothing only when there is no session or profile is not active.

## Parity
- Item 4/10 (own slots, next 14 days, `my_schedule` only): query untouched, no other fetch.
- Label "Party, <weekday, date> <start> to <end>": kept verbatim as visually hidden text in each slot (read by screen readers); the visible time is "2:00 p.m.–4:00 p.m." (aria-hidden) using the same `formatClock`. Weekday and date are also in the day heading.
- Before reveal: "Details shown on the morning of the party." unchanged text.
- After reveal: customer, kids, type, notes all shown (notes only when present, as before).
- Error "Could not load your schedule." (role="alert"). Empty "No upcoming parties." (only when no error).
- Item 14 sign-out: POST /auth/signout via shared header.

## States
- Hidden: sunken surface, dashed border, neutral lock pill "Details hidden", the morning-of text. Not opacity-dimmed.
- Revealed: normal surface, green "Details shown" open-lock pill, bold customer, "N kids · type", notes below a hairline.
- Empty: standard `.empty` card. Error: danger banner with alert icon.
- Today/Tomorrow: small info chip before the date in the day heading.

## Checks
- `tsc --noEmit`: clean.
- `vitest run`: 73/73 passed.
- Literal backslash-u grep in page.tsx: none. En dash typed literally.
- `next build` not run. Not visually screenshotted (no screenshot step requested).

## Spec deviation (P2)
Spec 3.9 names the pills "Details on the morning" (neutral, clock) and "Revealed" (info, eye). The build keeps "Details hidden" (neutral, lock) and "Details shown" (success, lock-open): clearer wording, and success avoids blue (decision 9). Deliberate; design-system.md not edited. Do not "fix" back.

## Round 2 (critic round 1 fixes)
Files: `web/src/app/app/page.tsx`, Staff block of `web/src/app/globals.css`.
- H1: `.staff-time, .staff-who` now `--text`; `.staff-who strong` weight 600.
- H2: removed `.staff-hidden` surface rule and its forced-colors block. Hidden and revealed cards share surface and solid border. Class kept in the markup as a hook.
- H3: `.staff-when` is now a neutral chip (`--surface-selected`, `--text`, border). No `--info-*` left in the Staff block.
- H4: in-page Sign out form (POST /auth/signout, `btn btn-secondary`, class `staff-signout`) added once at the end of the section, after the day list and after the empty/error state, so it is always present. Full width below 640px. Header Sign out kept.
- M1: day heading now has a visually hidden ", " after Today/Tomorrow (`<span className="vh">, </span>`), so text reads "Today, Monday, Nov 23".
- M2: `.staff-body` grid with `--space-1-5` gap; margin-top removed from meta/notes; notes get margin-top `--space-1-5`, padding-top `--space-3`.
- M3: `.staff-list` gap `--space-3`; max width 40rem.
- P1: visible time now "2:00 p.m. to 4:00 p.m." (aria-hidden; screen-reader slot label unchanged).
- P4: `--staff-max` and `--staff-time-col` set on `.staff`.
- Not done (deferred): P3 (h1 size), header wrap.
- Untouched: `my_schedule` call, state texts, slot label, other screens' CSS.

Results: `tsc --noEmit` clean; `vitest run` 73/73; no `\u` escapes in page.tsx; no `next build`; not browser-verified (no screenshots this round).
