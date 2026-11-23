# Phase 6 critique: party-type chips (Bowling red, Arcade violet)

Critic pass, 2026-11-23. Scope: `git diff HEAD` in the redesign-pilot worktree (party-type.tsx new; icons.tsx, globals.css, manager/schedule/page.tsx, sales/parties/page.tsx, app/page.tsx). Read-only on app code.

## Verdict: PASS (no blocking issues)

Two Medium items should be fixed before this goes to Jeff, because they are cheap and visible: the Bowling chip reads too much like the danger family (M1), and cancelled rows lose their dimmed look (M2).

Evidence used: the parent's four browser screenshots (listed in phase6-manual-checks.md), the code, my own contrast maths, and `tsc --noEmit` (exit 0) plus `vitest run` (73/73), both re-run by me. I could not take my own screenshots. Chromium will not start inside this session's sandbox (mach-port permission denied), so the staff line and the inline chip alignment are judged from the code only (see P5).

## Parity: verified, nothing changed

| Check | Result |
|---|---|
| Queries / selects | Unchanged. `git diff` touches no `.select(...)`, and `src/lib`, `sales/actions.ts`, `supabase/` have no diff |
| Engine | `lib/engine.ts` and `engine-data.ts` untouched. The `bowling` cutoff rule still keys on `'bowling'` |
| Form field | `<select name="party_type">`, `defaultValue={party?.party_type ?? 'bowling'}` unchanged (sales/parties/page.tsx:222) |
| Option values | Still `PARTY_TYPES` = `['bowling','other']`. Only the visible text changed (Bowling / Arcade), which Jeff approved (decisions.md answer 3) |
| Messages | None changed (but see P3) |
| Tests | tsc clean, vitest 73/73 |

## Contrast: builder's numbers verified (WCAG 2.x formula)

| | Text on chip | Border vs chip bg | Border vs surface | vs sunken (cancelled rows / sunken cells) |
|---|---|---|---|---|
| Bowling light #b00023 / #fdecef / #e0546c | 6.42 | 3.26 | 3.71 | 3.38 |
| Arcade light #6a1fd0 / #f4edff / #9b6bf0 | 6.77 | 3.20 | 3.65 | 3.32 |
| Bowling dark #ff8a9a / #3a0f17 / #c4344d | 7.42 | 3.13 | 3.37 | 3.13 |
| Arcade dark #d9b8ff / #2a1450 / #8e5ae0 | 9.32 | 3.57 | 4.00 | 3.72 |

All text is above 4.5:1 and every border is above 3:1. The chip is not a control and its meaning is carried by its text, so 1.4.11 does not strictly apply to the border; it passes anyway. The dark tokens are set in both the media-query block and the `[data-theme='dark']` block (globals.css:142-147, 190-195). Good.

## 1.4.1 Use of colour: pass

Each chip has visible text ("Bowling" / "Arcade") plus an icon, so colour is never the only cue. An unknown value shows its raw text.

## Screen-reader output (from markup; the Svg helper sets `aria-hidden="true" focusable="false"`, icons.tsx:17-30)

- Manager preview table: a plain `td`, read as "Type, Bowling" via the `th scope="col"`.
- Manager week list (`role="table"` rows): the visual `plabel` is `aria-hidden`, and the column header supplies the "Type" context, read as "Type, Arcade".
- Preview phone card: "12 kids · Bowling" (one paragraph).
- Sales row: "8 kids", then "Bowling" (separate paragraphs).
- Staff revealed slot: "12 kids · Bowling". Whether the middle dot is spoken depends on the screen reader's punctuation level; this is unchanged from before (previously "12 kids · bowling"). Nothing is lost. "Arcade" is clearer to listen to than "other".

## Issues

### Blocking
None.

### Medium (non-blocking; fix in this phase)

**M1. The Bowling chip is almost the same colour as the danger pills, and sits next to them.**
- Evidence: tokens `--type-bowling-fg/bg` #b00023 / #fdecef against `--danger-fg/bg` #b42318 / #fef1f0 (globals.css:38-39 vs 55-57). In dark: #ff8a9a / #3a0f17 against #ff8a80 / #351513. The hues are about 15 degrees apart, the tints are nearly the same, and the shape is identical (`.pill`, radius-full).
- Where they collide:
  - Preview table: a Bowling chip can sit in the same row as the red "No eligible host" `pill-danger` (manager/schedule/page.tsx:133 and :211-212).
  - Sales row: the chip is directly left of the red "Cancel party" outline button on desktop and directly above it on phones (screenshots `...e60gd2.jpg` and `...iiakvu.jpg`).
  - Admin: "Removed" uses `pill-danger` too.
  - The `CircleDot` icon is a circle with a central mark. At 12px it looks like `CircleAlert` (circle with "!"), which every red error banner uses.
- What it breaks: the system's rule that red tint means "problem". A manager scanning the preview for red trouble hits every bowling row.
- Why colour alone won't fix it: brand red and danger red are close by nature, and Jeff chose red for bowling (decisions.md answer 3). So keep the colour and separate the category by shape and icon:
  1. **Shape: type chips become tags, not status pills.** In globals.css, add to both `.pill-bowling` and `.pill-arcade`: `border-radius: var(--radius-xs);` (4px). Status pills stay fully round. The rule to record in design-system.md is "rounded rectangle = what kind of party it is; full pill = state". It applies on all three screens at once because they share `PartyType`.
  2. **Icon: replace `CircleDot` with a bowling-ball glyph** that cannot be mistaken for an alert. Same `Svg` wrapper, 24-unit grid, stroke style. Name it `BowlingBall`:
     `<circle cx="12" cy="12" r="10" /><circle cx="10" cy="8" r="1.25" /><circle cx="14.5" cy="8.5" r="1.25" /><circle cx="12" cy="12.5" r="1.25" />`
     This is a hand-drawn Lucide-style glyph, not a copied Lucide icon. Decision 7 says "copy Lucide SVGs", and Lucide has no bowling icon, so the design lead should add a one-line note to decisions.md. If you'd rather not deviate, `Trophy` is a weaker but acceptable Lucide fallback. Do not use the Bird Bowl PNG logo as the marker: at 12px it can't be read.
  3. Do not change the bowling tokens and do not touch the danger tokens.

**M2. Cancelled sales rows no longer dim the type.**
- Evidence: `.party-item.cancelled .party-type { color: var(--text-muted) }` (globals.css:1778-1781) used to mute the type text. The chip now sets its own colour, background and border, so cancelled rows ("Design QA test", "Design QA test 2" in `...e60gd2.jpg`) show a full-strength violet/red chip inside a dashed, sunken, otherwise muted row. A vivid red Bowling chip inside a cancelled row also adds to M1.
- Breaks: the approved cancelled-row treatment (dimmed with tokens, not opacity), and consistency with `.party-item.cancelled .pill-neutral` (globals.css:1884-1887).
- Fix: add next to the existing cancelled pill rule:
  ```css
  .party-item.cancelled .pill-bowling,
  .party-item.cancelled .pill-arcade {
    color: var(--text-muted);
    background: var(--surface);
    border-color: var(--border-input);
  }
  ```
  The text and icon still say which type it was. Muted text on surface measures 7.7:1 light and 7.0:1 dark, and the border is at least 3:1 in both.

### Polish (non-blocking)

**P1. The fallback renders an empty pill for null or empty values.** `party-type.tsx:21` returns `<span className="pill pill-neutral">{type ?? ''}</span>`, which draws an empty bordered capsule when the value is missing. `parties.party_type` is `not null` (0001_init.sql:209), and the staff view only renders the chip when revealed, so this is practically unreachable. Still: `if (!type) return null;` before the neutral fallback. Keep the raw-value neutral pill for unknown strings; that part is right.

**P2. The labels are defined in two places.** `sales/parties/page.tsx:224` hard-codes `t === 'bowling' ? 'Bowling' : 'Arcade'`, separately from `party-type.tsx`. Any future third value would silently show as "Arcade" in the select. Fix: export `PARTY_TYPE_LABEL: Record<string, string> = { bowling: 'Bowling', other: 'Arcade' }` from `components/party-type.tsx`, use it in `PartyType` and in the select as `{PARTY_TYPE_LABEL[t] ?? t}`.

**P3. The validation message uses the old words.** `lib/parties.ts:55` says "Pick bowling or other." The select constrains the value, so only a tampered request can reach this. Changing the message is a message change and needs Jeff's OK under the parity rules, so log it for him; don't change it in this phase. Suggested text: "Pick Bowling or Arcade."

**P4. The separator is inconsistent.** The staff line (app/page.tsx:89) and the preview card (manager/schedule/page.tsx:222) put " · " before the chip. The sales row (phone) puts the chip straight after "12 kids" with a flex gap (`...iiakvu.jpg`). The chip already marks the boundary, so the dot is redundant next to it. Optional fix for both lines: replace ` · ` with `<span className="vh">, </span>` and a `margin-left: var(--space-1-5)` on the chip in those two contexts (e.g. `.staff-meta .pill, .cards .muted .pill`). Screen readers then hear "12 kids, Bowling". Do this only if the parent confirms visually; it is taste-level.

**P5. Not seen in a browser: the staff revealed slot, and the inline baseline of the chip inside a text line.** `.pill` is `inline-flex` and starts with an SVG, so its baseline comes from the icon and can sit 1-2px high against "12 kids". The same pattern already exists for status pills inline with text (e.g. "Proposed host: " plus a pill), so it is consistent, but nobody has checked it. Ask the parent to capture /app with a revealed slot at 390 and 1440, light and dark, when a test assignment exists. If it looks off, add `vertical-align: middle` to `.staff-meta .pill`.

### Out of scope, logged
- The "Locked" pill in the manager week list is still `pill-info` blue (manager/schedule/page.tsx, `assignment_locked` branch), which conflicts with decision 9 ("blue only for the focus ring"). It predates this phase; raise it in a later pass.

## Consistency and layout

- **Three screens, one component.** All five render sites use `PartyType`, so the chips match everywhere (preview table, preview card, week list, sales row, staff line).
- **Sales 92px column.** The parent measured the chips at 76px and 80px with no overflow. The arithmetic agrees: 8+8 padding, 2 border, 12 icon, 4 gap, about 45px of text. At 200% browser zoom the layout drops to the phone layout, so the fixed 92px is not a problem. Fine.
- **Preview table and dark week list.** Chips sit centred in their cells and read clearly (`...dplf81.jpg`, `...hwi1kk.jpg`). Arcade violet in dark (9.3:1) is the nicest-looking chip in the set.
- **Phone cards.** "12 kids" plus the chip sit on one line with a sensible gap (`...iiakvu.jpg`).
- **Violet only for Arcade.** Correct reading of decision 9: Game Zone's cyan would collide with focus and info blue.

## Genuinely good (keep)

- The tokens live in their own `--type-*` group, separate from brand and semantic tokens, and are mirrored in both dark blocks. This is exactly how category colour should be added.
- The display label is kept apart from the database value, with no schema, engine or form change. That is the parity-safe way to rename "other".
- Text, icon and colour together on every chip. Contrast is comfortably AA in both themes.
- The Gamepad2 icon for Arcade is unambiguous and well chosen.

## Counts

Blocking 0. Medium 2 (M1, M2). Polish 5 (P1-P5). Parity: 6 of 6 checks verified, nothing missing.
