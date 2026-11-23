# Phase 6: party-type colour coding

DB values stay `bowling` and `other` (no schema, query, action or validation change). `other` is displayed as "Arcade".

## Where the chip is used
- Manager schedule: preview table Type cell, preview card line ("12 kids · chip"), and the week list Type cell.
- Sales parties list: `.party-type` cell (92px column, chip is ~84px).
- Staff revealed slot: "N kids · chip".
- Sales add/edit select: option values unchanged (`bowling`, `other`); visible text "Bowling" / "Arcade".
- Unknown values render the raw value in a neutral pill. The chip carries visible text, so screen readers read "Bowling" / "Arcade"; the icon is aria-hidden.

## Tokens (globals.css, light, dark via media query and data-theme)
| Token | Light | Dark |
|---|---|---|
| --type-bowling-fg / bg / border | #b00023 / #fdecef / #e0546c | #ff8a9a / #3a0f17 / #c4344d |
| --type-arcade-fg / bg / border | #6a1fd0 / #f4edff / #9b6bf0 | #d9b8ff / #2a1450 / #8e5ae0 |

Contrast (WCAG): text on chip background, border against surface (#ffffff light, #16171a dark).
| | Text | Border vs surface |
|---|---|---|
| Bowling light | 6.42 | 3.71 |
| Arcade light | 6.77 | 3.65 |
| Bowling dark | 7.42 | 3.37 |
| Arcade dark | 9.32 | 4.00 |

Border vs chip background also stays at or above 3.13. Arcade uses violet only (no cyan); blue remains the focus ring.

## Files
- web/src/app/globals.css (tokens, .pill-bowling, .pill-arcade)
- web/src/app/components/icons.tsx (CircleDot, Gamepad2 from Lucide)
- web/src/app/components/party-type.tsx (new)
- web/src/app/manager/schedule/page.tsx, web/src/app/sales/parties/page.tsx, web/src/app/app/page.tsx

Checks: tsc --noEmit clean; vitest 73/73. No next build, no screenshots taken.

## Round 2 (critic fixes)
- M1: `.pill-bowling` and `.pill-arcade` use `border-radius: var(--radius-xs)` (square tags = type, round pills = status). `CircleDot` replaced by hand-drawn `BowlingBall` in icons.tsx (Lucide has none); logged in decisions.md.
- M2: cancelled sales rows show muted chips (muted text, surface background, input border), next to the cancelled neutral pill rule.
- P1: `PartyType` returns nothing for null or empty type; unknown strings still show a neutral pill.
- P2: one exported `PARTY_TYPE_LABEL` map in party-type.tsx, used by the chip and the sales select option text. Option values remain `bowling` / `other`.
- Skipped: P3 (message change needs Jeff: suggested "Pick Bowling or Arcade."), P4, P5.
- Checks: see final run (tsc, vitest).
