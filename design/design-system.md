# Bird Bowl Parties: Design System

Version 1.0, 2026-11-23. Owner: art direction. Status: proposal for Jeff's approval. No app code has been changed.

Inputs: `design/audit.md` (authoritative parity checklist), `design/trend-brief.md`, `design/baseline.md`, `design/user-context.md`, `SPEC.md`, `web/src/app/globals.css`, and the page sources under `web/src/app`.
Preview: `design/preview/index.html` (static, self-contained, about 73 KB). Not screenshotted by the author: headless Chromium is blocked by the sandbox. Open it in a browser to review.

---

## 0. Direction in one paragraph

Calm, neutral and fast. A near-white (light) or near-black (dark) canvas, cool zinc greys, one brand red used only where it means "Bird Bowl" or "do this": the logo mark, the primary button, the active nav marker. Errors get their own deeper, browner red and always travel with an icon and words. Density follows the work: Stephanie's weekly schedule and Mady's party entry are compact, keyboard-friendly tables on desktop; the staff view is a big-type card list on a phone. Light and dark are equal citizens, follow the system by default, and can be overridden from the header.

Stack stays as is: Next.js 15 App Router, React 19, one global CSS file with custom properties. No CSS framework, no component library, no new runtime dependency is required by this spec.

---

## 1. Principles (each tied to an audit finding)

1. **Brand red means Bird Bowl, not trouble.** Brand red (`--brand`) is for the logo, primary actions and the current-location marker. Errors use `--danger`, a separate token with a different hue and always an icon plus text. (Audit: brand section, findings 1 and 10.)
2. **State is never colour alone.** Every status (assigned, not assigned, locked, cancelled, pending, removed, preview) is a pill with an icon and a word. (Finding 8.)
3. **Scan the week, then act in place.** On desktop the schedule is one table per week with inline host, lock and save. No long stacked forms. (Finding 5.)
4. **Phones get cards, not squeezed tables.** Any table with more than three columns becomes stacked cards below 640px. (Finding 4.)
5. **One header, everywhere.** Logo, role-appropriate links, theme toggle and sign out on every signed-in screen. (Findings 1, 3, 11; parity item 10.)

---

## 2. Tokens

All values are hex as requested. Paste into `globals.css` when the build is approved. The theme attribute contract already exists in `globals.css` (`data-theme="light" | "dark"` on `<html>`, system preference otherwise) and is kept.

### 2.1 Colour: light theme

```css
:root {
  /* Surfaces */
  --bg: #F7F7F8;              /* page canvas */
  --surface: #FFFFFF;         /* cards, tables, header */
  --surface-sunken: #F4F4F5;  /* table header row, row hover, cancelled row */
  --surface-selected: #EDEDEF;/* selected nav item, pressed ghost button */
  --surface-overlay: #FFFFFF; /* menus, dialogs (with shadow) */

  /* Borders */
  --border-subtle: #E7E7EA;   /* row dividers */
  --border: #DCDCE0;          /* card and panel edges */
  --border-input: #8A8A93;    /* inputs, selects, checkboxes: 3:1 for WCAG 1.4.11 */

  /* Text */
  --text: #18181B;
  --text-muted: #52525B;      /* secondary text, labels */
  --text-subtle: #63636C;     /* meta, placeholder, captions */
  --text-disabled: #A1A1AA;   /* disabled only (exempt from contrast) */

  /* Brand */
  --brand: #D7002A;           /* primary button fill, logo, active marker */
  --brand-hover: #BB0025;
  --brand-active: #9E001F;
  --on-brand: #FFFFFF;
  --brand-fg: #D7002A;        /* brand-coloured text or icons on light surfaces */
  --brand-subtle-bg: #FDECEF;
  --brand-subtle-border: #F7B9C4;
  --brand-subtle-fg: #B00023;

  /* Focus (deliberately not red: a red ring reads as an error) */
  --focus: #2563EB;

  /* Semantic */
  --success-fg: #137538;  --success-bg: #EDF7F0;  --success-border: #A7D7B5;
  --warning-fg: #A14E00;  --warning-bg: #FFF6E5;  --warning-border: #EBC77A;
  --info-fg:    #1D4ED8;  --info-bg:    #EEF3FE;  --info-border:    #B3C8F5;
  --danger-fg:  #B42318;  --danger-bg:  #FEF1F0;  --danger-border:  #F4B8B2;
  --danger: #B42318;      --danger-hover: #9A1C13; --on-danger: #FFFFFF;
  --neutral-fg: #52525B;  --neutral-bg: #F4F4F5;  --neutral-border: #DCDCE0;
}
```

### 2.2 Colour: dark theme

Elevation in dark mode is a lighter surface, not a shadow.

```css
:root[data-theme='dark'] {            /* repeat inside @media (prefers-color-scheme: dark) { :root:not([data-theme='light']) { ... } } */
  --bg: #0E0F11;
  --surface: #16171A;
  --surface-sunken: #1D1E22;  /* also "raised" in dark: table header, row hover */
  --surface-selected: #2A2C31;
  --surface-overlay: #24262B;

  --border-subtle: #26282D;
  --border: #2F3137;
  --border-input: #6B6E76;

  --text: #EDEDEF;
  --text-muted: #A1A1AA;
  --text-subtle: #8E8E97;
  --text-disabled: #5A5C63;

  --brand: #D7002A;           /* button fill stays true brand red; white text is surface-independent */
  --brand-hover: #E4143C;     /* lightens on dark so hover is visible */
  --brand-active: #BB0025;
  --on-brand: #FFFFFF;
  --brand-fg: #FF4D64;        /* the lighter brand tone for text, icons, nav marker on dark */
  --brand-subtle-bg: #3A0F17;
  --brand-subtle-border: #6E1A2A;
  --brand-subtle-fg: #FF7A8B;

  --focus: #60A5FA;

  --success-fg: #4ADE80;  --success-bg: #0F2A1A;  --success-border: #1F5133;
  --warning-fg: #FBBF24;  --warning-bg: #2E2208;  --warning-border: #5C4512;
  --info-fg:    #7AA7FF;  --info-bg:    #101E3A;  --info-border:    #24417A;
  --danger-fg:  #FF8A80;  --danger-bg:  #351513;  --danger-border:  #6B2621;
  --danger: #B42318;      --danger-hover: #C62D20; --on-danger: #FFFFFF;
  --neutral-fg: #A1A1AA;  --neutral-bg: #1D1E22;  --neutral-border: #2F3137;
}
```

`color-scheme: light` / `color-scheme: dark` must be set with each theme so native date, time and select pickers match.

### 2.3 Brand red decisions

| Use | Light | Dark | Why |
|---|---|---|---|
| Primary button fill | `#D7002A` | `#D7002A` | True brand red in both; white label is 5.35:1 on any surface. |
| Brand text, icons, active-nav bar | `#D7002A` | `#FF4D64` | `#D7002A` on `#16171A` is only 3.35:1 (fails body text). `#FF4D64` is 5.55:1. |
| Error / danger | `#B42318` text, `#B42318` fill | `#FF8A80` text, `#B42318` fill | Different hue (about 4 degrees, brick) from brand (about 350 degrees, crimson), darker in light mode, salmon in dark. Kept from current `globals.css` for continuity. Always paired with an icon and words. |
| Focus ring | `#2563EB` | `#60A5FA` | Functional only. A red ring next to red buttons and red errors would be ambiguous. |

Brand red is not used for: links in body text (use `--text` with underline), large backgrounds, table headers, charts, or warning/error states.

### 2.4 Contrast results (computed with a WCAG 2.x relative-luminance script, not eyeballed)

Thresholds: 4.5:1 body text, 3:1 large text (18.66px bold / 24px) and UI component boundaries (WCAG 2.2 SC 1.4.3 and 1.4.11).

**Light**

| Foreground | Background | Ratio | Use | Result |
|---|---|---|---|---|
| `#FFFFFF` on-brand | `#D7002A` brand | 5.35 | Primary button label | AA pass |
| `#FFFFFF` | `#BB0025` brand-hover | 6.69 | Hover | AA pass |
| `#FFFFFF` | `#9E001F` brand-active | 8.49 | Pressed | AA pass |
| `#D7002A` brand-fg | `#FFFFFF` surface | 5.35 | Brand text/icon | AA pass |
| `#D7002A` brand-fg | `#F7F7F8` bg | 5.00 | Brand text on canvas | AA pass |
| `#D7002A` brand-fg | `#F4F4F5` sunken | 4.87 | Brand text in table header | AA pass |
| `#B00023` brand-subtle-fg | `#FDECEF` brand-subtle-bg | 6.42 | Brand tint chip | AA pass |
| `#18181B` text | `#FFFFFF` / `#F7F7F8` / `#F4F4F5` | 17.72 / 16.55 / 16.12 | Body | AA pass |
| `#52525B` text-muted | `#FFFFFF` / `#F7F7F8` / `#F4F4F5` | 7.73 / 7.22 / 7.03 | Labels, secondary | AA pass |
| `#52525B` text-muted | `#EDEDEF` selected | 6.61 | Selected nav | AA pass |
| `#63636C` text-subtle | `#FFFFFF` / `#F7F7F8` / `#F4F4F5` | 5.95 / 5.55 / 5.41 | Meta, placeholder | AA pass |
| `#2563EB` focus | `#FFFFFF` / `#F7F7F8` / `#F4F4F5` | 5.17 / 4.83 / 4.70 | Focus ring (needs 3:1) | pass |
| `#8A8A93` border-input | `#FFFFFF` / `#F7F7F8` | 3.42 / 3.20 | Input boundary (needs 3:1) | pass |
| `#D7002A` brand fill | `#F7F7F8` bg | 5.00 | Button boundary (needs 3:1) | pass |
| `#137538` success-fg | `#EDF7F0` / `#FFFFFF` / `#F4F4F5` | 5.28 / 5.79 / 5.26 | Assigned, Active | AA pass |
| `#A14E00` warning-fg | `#FFF6E5` / `#FFFFFF` / `#F4F4F5` | 5.43 / 5.82 / 5.30 | Not assigned, Pending | AA pass |
| `#1D4ED8` info-fg | `#EEF3FE` / `#FFFFFF` / `#F4F4F5` | 6.03 / 6.70 / 6.10 | Preview, Locked | AA pass |
| `#B42318` danger-fg | `#FEF1F0` / `#FFFFFF` / `#F4F4F5` | 5.97 / 6.57 / 5.98 | Errors, Removed | AA pass |
| `#FFFFFF` on-danger | `#B42318` / `#9A1C13` | 6.57 / 8.24 | Destructive button | AA pass |

**Dark**

| Foreground | Background | Ratio | Use | Result |
|---|---|---|---|---|
| `#FFFFFF` on-brand | `#D7002A` brand | 5.35 | Primary button label | AA pass |
| `#FFFFFF` | `#E4143C` brand-hover | 4.70 | Hover | AA pass |
| `#FFFFFF` | `#BB0025` brand-active | 6.69 | Pressed | AA pass |
| `#D7002A` brand fill | `#16171A` / `#0E0F11` | 3.35 / 3.58 | Button boundary (needs 3:1) | pass |
| `#D7002A` as text | `#16171A` | 3.35 | **Not allowed** for text in dark | fail, hence `#FF4D64` |
| `#FF4D64` brand-fg | `#0E0F11` bg | 5.93 | Brand text on canvas | AA pass |
| `#FF4D64` brand-fg | `#16171A` surface | 5.55 | Brand text/icon, nav marker | AA pass |
| `#FF4D64` brand-fg | `#1D1E22` sunken | 5.15 | In table header | AA pass |
| `#FF4D64` brand-fg | `#24262B` overlay | 4.68 | In menus/dialogs | AA pass |
| `#FF4D64` brand-fg | `#2A2C31` selected | 4.32 | **Not allowed** as text; OK as the 3:1 marker bar | UI only |
| `#FF7A8B` brand-subtle-fg | `#3A0F17` brand-subtle-bg | 6.67 | Brand tint chip | AA pass |
| `#EDEDEF` text | `#0E0F11` / `#16171A` / `#1D1E22` / `#24262B` / `#2A2C31` | 16.40 / 15.33 / 14.24 / 12.95 / 11.95 | Body | AA pass |
| `#A1A1AA` text-muted | `#0E0F11` / `#16171A` / `#1D1E22` / `#24262B` / `#2A2C31` | 7.48 / 6.99 / 6.50 / 5.91 / 5.45 | Labels | AA pass |
| `#8E8E97` text-subtle | `#16171A` / `#1D1E22` / `#24262B` | 5.52 / 5.13 / 4.66 | Meta | AA pass (not on `#2A2C31`, 4.30) |
| `#60A5FA` focus | `#0E0F11` / `#16171A` / `#24262B` | 7.54 / 7.05 / 5.95 | Focus ring | pass |
| `#6B6E76` border-input | `#16171A` / `#0E0F11` / `#1D1E22` | 3.51 / 3.76 / 3.26 | Input boundary | pass |
| `#4ADE80` success-fg | `#0F2A1A` / `#16171A` | 8.82 / 10.29 | Assigned, Active | AA pass |
| `#FBBF24` warning-fg | `#2E2208` / `#16171A` | 9.33 / 10.74 | Not assigned, Pending | AA pass |
| `#7AA7FF` info-fg | `#101E3A` / `#16171A` | 6.93 / 7.51 | Preview, Locked | AA pass |
| `#FF8A80` danger-fg | `#351513` / `#16171A` | 7.25 / 7.85 | Errors | AA pass |
| `#FFFFFF` on-danger | `#B42318` | 6.57 | Destructive button | AA pass |

Two hard rules from the table: in dark mode never set `--brand` (`#D7002A`) as text colour, and never put `--brand-fg` or `--text-subtle` text on `--surface-selected`.

Disabled controls are exempt from contrast (SC 1.4.3) but must still read as disabled through the `not-allowed` cursor, the `disabled` attribute and muted fill, not opacity on the whole row.

### 2.5 Typography

No external fonts. Default stack is the system UI face, which renders as SF Pro on Apple devices and Segoe UI on Windows, both excellent at small sizes.

```css
:root {
  --font-sans: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
}
```

Option for Jeff (not required): self-host Inter (SIL Open Font License) as a local `woff2` via `next/font/local`, which ships with Next.js and adds no npm dependency. It gives identical rendering on every platform. See section 7.

Type roles (rem at a 16px root). Use roles, not raw sizes.

| Role | Size / line height | Weight | Letter spacing | Use |
|---|---|---|---|---|
| `display` | 28px / 36px | 650 | -0.02em | Login heading on laptop+, staff "Your schedule" on phone |
| `title-1` | 22px / 28px | 600 | -0.015em | Page titles (Schedule, Parties, Users, Settings) |
| `title-2` | 17px / 24px | 600 | -0.01em | Section headings (Fairness, Add a party, Pending approval) |
| `title-3` | 15px / 22px | 600 | -0.005em | Day headings, card titles |
| `body` | 15px / 22px desktop; 16px / 24px below 640px | 400 | 0 | Default text |
| `body-strong` | as body | 550 | 0 | Customer names, host names |
| `small` | 13px / 18px | 400 | 0 | Table cells on desktop, meta |
| `label` | 13px / 16px | 500 | 0.005em | Form labels, table column headers (sentence case, no all-caps) |
| `caption` | 12px / 16px | 500 | 0.01em | Pill text, helper text |
| `numeric` | inherits | inherits | 0 | `font-variant-numeric: tabular-nums;` on every time, kid count, average, date |
| `mono` | 13px / 18px | 500 | 0 | Rarely: IDs, week keys. Times use `numeric`, not mono |

Rules:
- Inputs, selects and the code field are always at least 16px font size below 640px (prevents iOS zoom).
- Times are formatted the way the app already formats them (`formatClock`), with an en dash for ranges in tables ("5:00–7:00 PM") and "to" in sentences ("Saturday 2:00 to 4:00 p.m.", the staff wording from `SPEC.md`).
- Max line length for prose: 68ch.

### 2.6 Spacing, radius, borders, elevation, focus, layers

```css
:root {
  /* 4px base */
  --space-0: 0; --space-0-5: 2px; --space-1: 4px; --space-1-5: 6px; --space-2: 8px;
  --space-3: 12px; --space-4: 16px; --space-5: 20px; --space-6: 24px;
  --space-8: 32px; --space-10: 40px; --space-12: 48px; --space-16: 64px;

  /* Radius */
  --radius-xs: 4px;   /* checkbox, tiny chips */
  --radius-sm: 6px;   /* buttons, inputs, selects */
  --radius-md: 10px;  /* cards, panels, table containers */
  --radius-lg: 14px;  /* dialogs, sheets (top corners on phone) */
  --radius-full: 999px; /* pills, avatar, logo */

  /* Borders */
  --border-width: 1px;
  --border-width-strong: 2px; /* active tab/nav marker, error input */

  /* Elevation: borders first, shadow only for things that float */
  --shadow-sm: 0 1px 2px rgb(16 17 20 / 0.06);
  --shadow-md: 0 4px 12px rgb(16 17 20 / 0.08), 0 1px 2px rgb(16 17 20 / 0.06);
  --shadow-lg: 0 16px 40px rgb(16 17 20 / 0.16), 0 2px 6px rgb(16 17 20 / 0.08);
  /* In dark: shadows are set to none for sm/md; floating layers use --surface-overlay + --border. lg keeps rgb(0 0 0 / 0.5). */

  /* Focus ring */
  --focus-ring: 0 0 0 2px var(--surface), 0 0 0 4px var(--focus);

  /* Control heights */
  --control-sm: 32px;  /* desktop dense table controls */
  --control-md: 36px;  /* desktop default */
  --control-lg: 44px;  /* phone default, and the minimum touch target */

  /* Layers */
  --z-base: 0; --z-sticky: 10; --z-header: 20; --z-dropdown: 30;
  --z-backdrop: 40; --z-dialog: 50; --z-toast: 60;
}
```

Focus: every interactive element uses `:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }` (outline, not box-shadow, so Windows High Contrast keeps it). The `--focus-ring` box-shadow form is only for elements whose outline is clipped by `overflow: hidden` (table rows). Never remove focus without a replacement. The ring must not be hidden by the sticky header (SC 2.4.11): set `scroll-padding-top: 72px` on `html`.

Touch targets: minimum 24x24 CSS px everywhere (SC 2.5.8), and 44px on phones for every primary control.

### 2.7 Motion

```css
:root {
  --dur-fast: 120ms;   /* hover, press, colour */
  --dur-base: 180ms;   /* menus, popovers, disclosure */
  --dur-slow: 240ms;   /* sheets and dialogs entering */
  --ease-out: cubic-bezier(0.2, 0, 0, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 1ms !important; transition-duration: 1ms !important; scroll-behavior: auto !important; }
}
```

Motion explains state change only: a menu growing from its trigger, a sheet sliding from the bottom. No page-load animation, no skeleton shimmer longer than the request, no parallax.

### 2.8 Breakpoints and grid

| Name | Range | Columns / gutter | Page padding | Content max width |
|---|---|---|---|---|
| phone | 0 to 639px | 4 / 12px | 16px | full |
| tablet | 640 to 1023px | 8 / 16px | 24px | full |
| laptop | 1024 to 1439px | 12 / 24px | 32px | 1280px |
| desktop | 1440 to 1919px | 12 / 24px | 40px | 1440px |
| ultrawide | 1920px and up | 12 / 32px | 48px | 2000px for schedule and parties; 1200px for admin; forms never wider than 720px |

```css
--bp-tablet: 640px; --bp-laptop: 1024px; --bp-desktop: 1440px; --bp-ultrawide: 1920px;
```

Ultrawide rule: data gets more columns, never wider text. Text blocks keep 68ch; tables gain a side rail rather than stretching cells.

---

## 3. Components

Icons: Lucide (ISC licence), 16px in dense UI, 20px on phone, 1.75px stroke, `currentColor`, `aria-hidden="true"` when next to text. Copy only the SVGs used into a local `icons.tsx` (keeps the ISC notice; avoids adding `lucide-react` as a dependency unless Jeff prefers it). Icons used: `chevron-left`, `chevron-right`, `calendar`, `lock`, `lock-open`, `check`, `circle-alert`, `triangle-alert`, `info`, `x`, `ban`, `user-round`, `users`, `settings`, `sun`, `moon`, `monitor`, `log-out`, `menu`, `plus`, `pencil`, `eye`, `clock`, `loader-circle`.

Every component below is plain HTML plus CSS classes in `globals.css`, keeping today's server-action forms. Nothing requires client-side state unless marked.

### 3.1 App shell and header (updated 2026-11-23)

**As shipped:** below 1024px the header is static (not sticky) and has two rows: logo and tools (theme toggle, Sign out), then the nav links on their own full-width row. From 1024px it is one sticky row (`--header-height`) with logo, links, then tools. Link labels never break mid-word (`white-space: nowrap`); whole links wrap instead. Below 1024px, when the nav holds a single link that is the current page (staff: "My schedule"), the row is hidden because it is redundant. There is no account menu or phone menu sheet; the theme toggle and a labelled Sign out sit directly in the header. The logo is the inline pin-candles mark (3.19). The anatomy below is the original proposal; where it differs, this note wins.

Anatomy (signed-in screens): sticky header, 56px, `--surface`, bottom `--border`, `z: --z-header`.
- Left: logo mark (32px red circle asset, supplied by Jeff) + "Parties" in `title-3`. Links to the role's home (`homePathForRole`).
- Centre-left: primary nav links for routes the role's guard already admits (see table). Active link: `--text`, 2px bottom bar in `--brand-fg`, `aria-current="page"`. Others: `--text-muted`, hover `--text` on `--surface-sunken`.
- Right: theme toggle (3.12), then an account button (initials avatar, 28px) opening a menu with the person's name, role as a neutral pill, and "Sign out" (posts to `/auth/signout`, as today).

| Role | Header links (all already reachable today; display only) |
|---|---|
| staff | My schedule |
| sales | Parties, My schedule |
| manager | Schedule, Parties, My schedule |
| admin | Users, Settings, Schedule, Parties, My schedule |

Login and pending use a minimal header: logo + theme toggle only (pending also shows Sign out).

Phone (below 640px): header 52px. Logo, current page title, then a menu button (44x44) opening a full-height sheet from the right with the nav links, theme toggle and Sign out. Staff have only one destination, so staff get no menu button: the header shows logo, page title and a theme icon button, and the existing "Sign out" button stays at the bottom of the staff page as today.

Keyboard: Tab order logo, links, theme, account. Account menu opens with Enter/Space/Down, closes on Escape and returns focus to the trigger; arrow keys move between items. A "Skip to content" link is the first focusable element.

### 3.2 Page header

Inside content: `title-1` page title, optional one-line description in `--text-muted`, actions aligned right (wrap below on phone). The week switcher lives here on Schedule and Parties.

### 3.3 Week switcher (parity item 11)

Anatomy: `[<] Week of Nov 23 – 29, 2026 [>]`. Prev/next are icon buttons rendered as the existing `<Link>`s with `?week=YYYY-MM-DD` (URL contract unchanged), visible text "Previous week" / "Next week" at laptop and up (icon-only below, with the same accessible names). The label is `title-3`, `numeric`.
States: hover `--surface-sunken`; focus ring; active `--surface-selected`. While a server navigation is pending, the label shows a 14px spinner (no layout shift).
Phone: full-width bar, 44px buttons at each end, label centred, shortened to "Nov 23 – 29".

### 3.4 Buttons

| Variant | Fill / text / border | Use |
|---|---|---|
| Primary | `--brand` / `--on-brand` / none | One per view region: Add party, Save these assignments, Sign in, Preview assignment |
| Secondary | `--surface` / `--text` / `--border-input` | Save (per row), Use a different email, Sign out |
| Ghost | transparent / `--text-muted` / none | Week nav, icon buttons, Edit disclosure |
| Danger (outline) | `--surface` / `--danger-fg` / `--danger-border` | Cancel party (in-row) |
| Danger (solid) | `--danger` / `--on-danger` | Only inside a confirm dialog, if Jeff approves confirmations |

Sizes: sm 32px (dense table rows, desktop only), md 36px (desktop default), lg 44px (phone default, login). Padding x: 10 / 14 / 16px. Label `label` role at 14px weight 550 (16px on phone). Icon gap 6px. Radius `--radius-sm`. Width: auto on desktop; full width on phone for the single primary action of a form.

States (all variants):
- Default: as above.
- Hover: primary `--brand-hover`; secondary `--surface-sunken`; ghost `--surface-sunken` + `--text`; danger outline `--danger-bg`.
- Focus-visible: 2px `--focus` outline, 2px offset.
- Active (pressed): primary `--brand-active`; others `--surface-selected`. `transform: translateY(0.5px)`, no scale.
- Disabled: `--surface-sunken` fill, `--text-disabled` text, `--border-subtle` border, `cursor: not-allowed`. Never opacity on the button.
- Loading: keeps width, label replaced by spinner + existing busy text ("Sending...", "Checking...", "Saving..."), `aria-busy="true"`, disabled. Server-action forms use `useFormStatus` only if Jeff approves a small client wrapper; otherwise there is no loading state for those (same as today).
- Error: buttons have no error state; the error shows on the field or as a banner.

Keyboard: Enter and Space activate. Never use a `<div>` as a button.

### 3.5 Text input, number, date and time

Anatomy: label above (`label` role, `--text-muted`), control, helper or error line below (`caption`). Height 36px desktop, 44px phone. Padding 0 10px. Border 1px `--border-input`, radius `--radius-sm`, fill `--surface`, text `body`, placeholder `--text-subtle`.
States:
- Hover: border `--text-subtle`.
- Focus-visible: border `--focus` + 2px `--focus` outline (offset 0).
- Disabled / read-only: fill `--surface-sunken`, text `--text-muted`.
- Error: border 2px `--danger-fg`, error line below with `circle-alert` icon and text, `aria-invalid="true"` and `aria-describedby` pointing at the line.
- Loading: not applicable.
Date and time use the native pickers (`type="date"`, `type="time"`) as today, styled only by border, height and `color-scheme`. Kids is `type="number"` with `numeric` and right-aligned text in tables. Code field: `inputmode="numeric"`, `autocomplete="one-time-code"`, letter-spacing 0.2em, `numeric`, 20px on phone.

### 3.6 Select

Native `<select>` (keeps behaviour, accessible on phones). Same box as input, with a 16px `chevron-down` drawn as a background SVG (data URI) in `--text-muted`, `appearance: none`, right padding 32px. States as input. In dense tables, height 32px and 13px text on desktop. Host select options keep today's text: "Name (tier N)" and "Not assigned".

### 3.7 Checkbox and lock toggle

Checkbox: 16px box (hit area 24px through the label), radius `--radius-xs`, border `--border-input`; checked fill `--text` (light) / `--text` (dark) with a check icon in `--surface`. Deliberately not brand red, so a checked box never reads as an error or a call to action. Label text to the right, the whole label clickable (keeps today's `<label class="check">` pattern). Focus ring on the box via `:has(:focus-visible)`.

"Lock by hand" on the schedule is the same checkbox, rendered as a compact toggle-chip: `lock-open` icon + "Lock" when unchecked (ghost), `lock` icon + "Locked" in `--info-fg` on `--info-bg` when checked. It is still a real `<input type="checkbox" name="locked">` (visually styled label), so the form contract is unchanged.

### 3.8 Tabs (login email/phone, segmented)

Segmented control, 36px (44px phone), `--surface-sunken` track, selected segment `--surface` with `--shadow-sm` and `--text`; unselected `--text-muted`. ARIA fixed per audit finding 14: `role="tablist"`, each tab `role="tab"`, `aria-selected`, `aria-controls` pointing at a `role="tabpanel"` wrapper with `aria-labelledby`. Left/Right arrow moves selection, Home/End jump; roving tabindex. Admin Users/Settings move into the header, so the admin tab strip is retired (links are unchanged).

### 3.9 Status pills (updated 2026-11-23)

**As shipped:** staff pills read "Details hidden" (neutral, lock) before the reveal and "Details shown" (success, lock-open) after it, replacing "Details on the morning" and "Revealed" in the table. Read-only viewers see a neutral "View only" pill beside the page title (3.19). **Party type tags** are not status pills: they are square tags (`--radius-xs`) with an icon and word, Bowling in brand red and Arcade (database value `other`) in violet. Round pills (`--radius-full`) mean status only.

22px tall, padding 0 8px, `caption`, radius full, 1px border, 12px icon. Always icon + word.

| Status | Tone | Icon | Where |
|---|---|---|---|
| Assigned | success | `check` | Sales rows, manager rows |
| Not assigned | warning | `circle-alert` | Sales rows, manager rows |
| Locked | info | `lock` | Manager rows (in addition to the checkbox) |
| Fixed (preview) | neutral | `lock` | Preview table: locked or revealed parties |
| No eligible host | danger | `triangle-alert` | Preview table |
| Cancelled | neutral | `ban` | Sales rows |
| Pending | warning | `clock` | Admin users |
| Active | success | `check` | Admin users |
| Removed | danger | `ban` | Admin users |
| Details on the morning | neutral | `clock` | Staff cards before reveal |
| Revealed | info | `eye` | Staff cards after reveal |
| Preview, not saved | info | `info` | Preview banner |

Assigned/not-assigned text keeps today's wording ("host assigned" / "not assigned").

### 3.10 Tables (desktop) and the grid-row form pattern

Container: `--surface`, 1px `--border`, `--radius-md`, overflow clip. Header row: `--surface-sunken`, `label` role, `--text-muted`, sticky (`top: 56px`) when the table is taller than the viewport. Rows: 44px min (40px dense), divider `--border-subtle`, cells padding 8px 12px, `small` text at 13px on laptop, 14px at desktop+. Numbers right-aligned with `numeric`. Row hover `--surface-sunken`. Day group header row: `title-3` on `--bg`, with the day's party count in `--text-muted`.

Because each editable row is its own server-action `<form>` (and `<form>` cannot wrap a `<tr>`), editable tables are built as CSS grid: a header `div role="row"` and one `<form role="row" aria-label="...">` per party/user with `display: grid` and the same `grid-template-columns`. Cells use `role="cell"`; column headers `role="columnheader"`; container `role="table"`. Each control keeps a real `<label>` (visually hidden at laptop+, visible on phone cards). Read-only tables (fairness, preview) stay as real `<table>`.

Empty: one row spanning all columns with the empty state (3.16). Loading: 5 placeholder rows of `--surface-sunken` bars, static (no shimmer under reduced motion). Error: banner above the table (3.14), table hidden.

Phone: every table with more than three columns becomes a card list (3.11). Never horizontal scroll for core data.

### 3.11 Cards and list rows (phone)

`--surface`, 1px `--border`, `--radius-md`, padding 16px, gap 12px between cards. Title line `body-strong`, meta line `small` `--text-muted` with `numeric`, pills top-right. Edit forms inside cards stack fields in one column (two columns for paired fields: Start/End, Kids/Type). Cancelled card: `--surface-sunken` fill, text `--text-muted`, Cancelled pill, no form (parity item 5). No opacity dimming (it fails contrast).

### 3.12 Theme toggle (new control, audit finding 3) (updated 2026-11-23)

**As shipped:** a three-option control (Light, Dark, System) as specified. Segments are 44px tall; 32px only at 1024px and up with a fine pointer. On the sign-in card the toggle is icon-only at every width and the labels stay available to assistive technology.

Three-option segmented control: Light (`sun`), Dark (`moon`), System (`monitor`). Each segment is a radio with a visible text label at laptop+ and icon + `aria-label` on phone. Default System. Setting writes `data-theme` on `<html>` and stores the choice in `localStorage` (key `theme`); System removes the attribute. An inline script in `<head>` applies the stored value before paint to avoid a flash. Requires a small client component; no data, role or server change. Keyboard: arrow keys within the radio group.

### 3.13 Dialogs and sheets

Dialog: centred, max 440px, `--surface-overlay`, `--radius-lg`, `--shadow-lg`, backdrop `rgb(0 0 0 / 0.45)`. Title `title-2`, body `body`, actions right-aligned (cancel left of confirm). Native `<dialog>` with `showModal()`: focus trap, Escape closes, focus returns to trigger. Phone: bottom sheet, full width, top radius `--radius-lg`, actions full width stacked, primary last.

**Proposal, pending Jeff's approval (not part of the restyle):** confirm dialogs for "Cancel party" (sales) and for saving a user whose status changes to removed (admin). Copy, if approved: "Cancel this party? Cancelled parties can't be edited. To restore it, add it again." / "Remove access for this person? They are signed out right away." Confirm button: danger solid. Until approved, both actions stay one click exactly as today.

### 3.14 Banners (status messages)

The app's `?msg=` messages and errors are server-rendered and stay inline, not floating toasts (they must survive a reload and screen readers already get `role="status"` / `role="alert"`). Anatomy: full-width within content, 1px border, `--radius-md`, padding 12px 14px, 16px icon, text `body`. Tones: info (msg), success (when the message is a confirmation), danger ("Could not load parties.", `role="alert"`), warning. Optional dismiss button (ghost, `x`) is client-only and optional.

Login and pending error lines use the danger banner style compactly beneath the field (same text as today, all four sign-in errors in parity item 1 kept verbatim). The removed notice ("Your access has ended...") is a danger banner above the form (parity item 3).

### 3.15 Disclosure (edit in place)

Sales rows show a summary; "Edit" (ghost, `pencil`) expands the existing edit form beneath the row using native `<details>`/`<summary>` (no JS). Open state: row gets `--surface-sunken` and a 2px left bar in `--border-input`. Escape is not bound (native behaviour). This is a layout change only: the form, fields and server action are unchanged. Listed for Jeff's sign-off in section 7.

### 3.16 Empty, loading and error states (updated 2026-11-23)

**As shipped:** the staff empty state is the single line "No upcoming parties." (class `empty`); the extra guidance sentence in the table was not built. Loading: `loading.tsx` for `/app`, `/manager/schedule`, `/sales/parties` and `/admin` shows short skeleton bars (`--surface-sunken`) inside `role="status"` with a visually hidden "Loading…"; the pulse stops under `prefers-reduced-motion`.

| Screen | Empty copy (existing text kept, next step added as text only) | Loading | Error |
|---|---|---|---|
| Staff | "No upcoming parties." + "When you're assigned a party it shows here. Details appear on the morning of the party." | 3 card placeholders | Danger banner "Could not load your schedule." |
| Sales day | "No parties." (muted, in the day group) | row placeholders | Banner "Could not load parties." |
| Manager day | "No parties." | row placeholders | Banner "Could not load parties." |
| Fairness | "No hosts yet." if there are no hosts; averages show "–" as today | row placeholders | inherit page banner |
| Admin pending | "No requests waiting." | card placeholders | Banner "Could not load users." |

Empty state style: `--text-muted`, centred in its container, 32px padding, optional 20px icon in `--text-subtle`. No illustrations.

Loading: Next.js `loading.tsx` per route is optional (would be new files; harmless). Placeholders are static `--surface-sunken` bars.

### 3.17 Charts

None. The fairness summary is a table with tabular numerals (trend brief recommendation 5). If a chart is ever added: neutral bars, brand red only for the highlighted host, axis labels `caption` in `--text-muted`, no gradients, no 3D, and the table remains the accessible source.

### 3.18 Command menu

Deliberately omitted. The app has at most five destinations; a command palette adds a new interaction without a matching need.

---

### 3.19 Logo and read-only viewer mode (updated 2026-11-23)

- **Logo:** the pin-candles mark (a cake whose candles are bowling pins, on a Bird Bowl red tile), drawn as inline SVG in `web/src/app/components/party-logo.tsx` (`PartyLogo`, decorative; the name is always beside it). The same SVG is the favicon (data URL). The PNG logo is not used.
- **View only:** where the signed-in person cannot change anything (viewers on the sales and manager screens), the add rail and edit, cancel, assign, lock and save controls are not shown, the list takes the full width, and a neutral "View only" pill sits beside the page title. Display only; permissions are unchanged.

## 4. Screen layouts

Each screen at phone (390px), laptop (1280px) and ultrawide (2560px; rules apply from 1920px).

### 4.1 Login `/login` (parity 1, 3) (updated 2026-11-23)

**As shipped:** the card is 400px wide and sits 12vh from the top on laptops (not 30%). There is no "Bird Bowl" footer line, because the card's brand row already carries the logo and name. The theme toggle is icon-only. The heading is 28px (`--auth-display`). Each route has its own page title ("Sign in · Parties").

- Primary action: "Email me a code" / "Text me a code", then "Sign in".
- Hierarchy: logo mark (48px), `display` "Sign in", description, removed banner (if `reason=removed`), segmented Email/Phone tabs, field, error line, primary button, secondary "Use a different email/number" on the code step.
- Phone: header with logo and theme icon only. Card is edge-to-edge (no border, `--bg`), content padding 16px, controls 44px, button full width. Code field 20px with wide letter spacing.
- Laptop: centred card 400px wide, `--surface`, 1px border, `--radius-lg`, padding 32px, vertically centred at 30% from top. Small footer line "Bird Bowl" in `--text-subtle`.
- Ultrawide: identical to laptop; the card never grows.
- All error strings, the 429 message, the unconfigured message and the neutral "If that email can sign in, a code is on its way." stay verbatim.

### 4.1b Pending `/pending` (parity 2; screen not reviewed in the audit)

Same frame as login. `display` "Request received", explanation text, "Your name" field + "Save name" (secondary), status line, then "Sign out" (ghost). Phone: full width controls. No nav links.

### 4.2 Staff `/app` (parity 4, 10) (updated 2026-11-23)

**As shipped:** empty state is "No upcoming parties." Below 1024px the header nav row is hidden for staff (3.1); the in-page Sign out button stays. Page title "My schedule · Parties".

- Primary task: "When am I working?" No primary button.
- Hierarchy: `display` "Your schedule", one-line description (existing text), then a list grouped by day ("Saturday, Nov 28" as `title-3`). Each slot card: time range in `title-2` with `numeric` ("2:00 to 4:00 p.m."), then either the neutral pill "Details on the morning" or, after reveal, the info pill "Revealed" and a details block: customer (`body-strong`), kids and type (`small`), notes (`body`, wraps). Nothing else is shown before reveal (the `my_schedule` function controls this; the design adds no field).
- Phone (primary): full-width cards, 16px padding, 12px gap, sign-out button at the end of the list (as today) and also in the header.
- Laptop: single column, max 640px, centred. Header shows "My schedule" as the only link for staff.
- Ultrawide: same 640px column, centred. No stretching.

### 4.3 Sales parties `/sales/parties` (parity 5, 10, 11)

- Primary action: "Add party".
- Hierarchy: `title-1` "Parties" + week switcher; status/error banner; "Add a party" panel; then the week, grouped by day.
- Add form (laptop): one panel, `--surface`, one row of fields in a 12-col grid: Date (2), Start (1.5), End (1.5), Kids (1), Type (1.5), Customer (4.5); second row Notes (10) + "Add party" primary (2). Defaults unchanged (date = Monday of the week, 17:00, 19:00, kids 0, bowling).
- Week list (laptop): grid-row table per day. Columns: Time (`numeric`), Customer, Kids (right, `numeric`), Type, Host status pill, Actions (Edit disclosure, Cancel party danger-outline sm). Edit opens the full existing edit form inline beneath the row (3.15). Cancelled rows: sunken, muted, Cancelled pill, no actions.
- Phone: add form collapses to one column (Date; Start + End; Kids + Type; Customer; Notes; full-width "Add party"). Party rows become cards: time + kids on line one, customer, type, pill; actions as two full-width buttons in a row (Edit, Cancel party).
- Ultrawide: two panes. Left, sticky "Add a party" panel 400px with fields in one column. Right, the week list, max 1400px. At 2560 the remaining space is page gutter.

### 4.4 Manager schedule `/manager/schedule` (parity 6, 7, 10, 11)

- Primary action: "Preview assignment" (primary button, links to `?week=…&preview=1` as today). When the preview is shown, the primary action becomes "Save these assignments" inside the preview panel.
- Hierarchy: title + week switcher + Preview button; status banner; preview panel (only when `preview=1`); the week; fairness summary.
- Preview panel: info-tone panel ("Preview only. Nothing is saved. Locked and revealed parties keep their host." verbatim), read-only table Date / Time / Kids / Type / Proposed host (+ Fixed pill or No eligible host pill), then the confirmation checkbox with its existing sentence and the "Save these assignments" primary button. Nothing about the confirmation changes.
- Laptop (1280): two columns. Main (fluid): the week as one grid-row table with day group headers. Columns: Time (110px, `numeric`), Customer (fluid), Kids (56px, right), Type (80px), Host (select, 220px), Lock (toggle-chip, 96px), Save (secondary sm, 72px). Each row is the existing `reassignParty` form. Status pill (Assigned/Not assigned) sits under the customer name in `caption`. Right rail (320px, sticky under the header): "Fairness, last N days" table: Host, Parties, Kids, Avg (all `numeric`, right-aligned). At 1024 to 1279 the rail moves above the week as a collapsible panel (open by default).
- Phone: week switcher bar; Preview button full width; fairness as stacked cards (finding 4): host name, then three stat pairs in a row (Parties, Kids, Avg), no horizontal scroll. Each party is a card: time + kids + type on one line, customer, then Host select (full width), Lock checkbox, and Save (secondary, full width). Preview table becomes cards too; the confirm checkbox and save button stay at the end, full width.
- Ultrawide (1920+): true weekly grid. Seven day columns (Mon to Sun) of min 220px, each a vertical stack of compact party cards (time, customer, kids, type, host select, lock chip, save). Fairness rail stays on the right at 360px. Content max width 2000px, centred. Day columns with no parties show "No parties." in `--text-subtle`. This is the "weekly schedule grid" from `SPEC.md`.
- Open question (not designed): whether the "manager (viewer)" users should see the controls disabled. Section 7.

### 4.5 Admin users `/admin/users` (parity 8, 10) (updated 2026-11-23)

**As shipped:** rows use the list pattern (`ul`/`li` with labelled controls and an `aria-hidden` visible header), not the table-role grid. Pending users sit together in one warning-toned frame at the top of the page, not a left bar on each row; with nobody pending the frame is dropped and a quiet empty line shows. The "removed" status option stays disabled until JavaScript loads, and choosing it asks for a confirm.

- Primary action: Save on a pending row (approve by setting Status to active).
- Hierarchy: `title-1` "Users"; banners; "Pending approval (N)" section, highlighted with a warning-tone left bar on each row; "Everyone else (N)".
- Laptop: grid-row table. Columns: Person (name `body-strong`, contact under it in `small` `--text-muted`, status pill), Status (select), Role (select), Host tier (select, existing option text "1: Party hostess" etc.), Daily cap (select 0 to 3), Save (secondary sm; primary on pending rows). Max width 1200px.
- Phone: cards. Name and status pill, contact line, then a 2x2 grid of selects (Status, Role / Host tier, Daily cap) with visible labels, full-width Save.
- Ultrawide: same 1200px table, centred, so the eye doesn't travel 2000px across a row.
- Contact details are shown as today (admin only). Not reproduced in the preview.
- Proposal pending approval: confirm when the saved status is "removed" (3.13). Not part of the restyle.

### 4.6 Admin settings `/admin/settings` (parity 9, 10)

- Primary action: Save on the setting being changed.
- Hierarchy: `title-1` "Settings"; banner; a settings list grouped as: Availability (cutoff day, cutoff time), Assignment (bowling-to-servers time, fairness window, hostess allowance), Reveal (morning reveal time). Each setting is its own row and its own form with its own Save, exactly as today. Row: label (`body-strong`) + one-line explanation in `--text-muted` on the left; input (160px) + Save (secondary sm) on the right.
- Note: the page code supports six keys (`fairness_window_days`, `hostess_avg_allowance_pct`, `availability_cutoff_dow`, `availability_cutoff_time`, `reveal_time`, `bowling_server_only_after`) and shows those present in the database. The audit saw four. All six are mapped; only rows that exist render. Inputs stay `type="text"` as today (switching to `type="time"`/`number` would change validation, so it is not part of the restyle).
- Phone: each setting is a card: label, explanation, input full width, Save full width.
- Laptop and ultrawide: single column, max 720px, centred.

### 4.7 Parity checklist mapping

| # | Item | Where it lives in the new design |
|---|---|---|
| 1 | Email and phone code sign-in; wrong/expired, 429, unconfigured errors | Login (4.1): segmented tabs (3.8), code step, error lines (3.14), strings verbatim |
| 2 | Pending users see only the pending screen; can set a name | Pending (4.1b), minimal header without nav |
| 3 | Removed users sent to login with notice | Login (4.1): danger banner when `reason=removed` |
| 4 | Staff see only own slots; details hidden until morning | Staff (4.2): slot cards, "Details on the morning" pill; data unchanged |
| 5 | Sales add/edit/cancel; cancelled dimmed and not editable | Sales (4.3): add panel, Edit disclosure, Cancel party button, cancelled rows sunken + muted + pill, no actions |
| 6 | Manager week nav, fairness table, host dropdown, Lock by hand, save | Manager (4.4): week switcher (3.3), fairness rail/cards, grid-row form per party with select, lock chip (3.7), Save |
| 7 | Preview (nothing saved), then save with confirm checkbox; locked/revealed keep host | Manager (4.4): preview panel with verbatim notice, Fixed pills, checkbox + Save these assignments |
| 8 | Admin: status, role, tier, daily cap per user | Admin users (4.5): grid-row table / cards with four selects |
| 9 | Admin settings with separate saves | Admin settings (4.6): one form per setting |
| 10 | Sign out from every role | Header account menu on every signed-in screen (3.1), plus the existing in-page buttons on staff and pending |
| 11 | Week in the URL | Week switcher keeps `?week=` links (3.3) |

Unmapped items: none. Removed or merged: the admin tab strip (`admin/nav.tsx`) merges into the shared header; same two links, same sign-out. Flagged for sign-off.

---

## 5. Data display rules

- Numbers: `tabular-nums`, right-aligned in tables, one decimal for averages (as today), "–" for no value.
- Times: `formatClock` output; ranges with an en dash in tables.
- Dates: weekday + short month + day in headings ("Saturday, Nov 28"); ISO stays only in URLs.
- Never colour a number to show "good" or "bad" in the fairness table; it's a neutral summary.

---

## 6. Do and don't

Do:
- Use `--brand` for one primary action per region, the logo and the active-nav marker.
- Pair every status colour with an icon and a word.
- Use borders and surface steps for hierarchy; shadows only on floating layers.
- Keep every control reachable and visibly focused by keyboard.
- Collapse tables to cards below 640px.

Don't (stale or risky patterns from the trend brief, banned):
- Glassmorphism, translucent "liquid glass" panels or backdrop blur over content.
- Bento-grid dashboards, big gradient hero stats, scroll-driven animation, parallax.
- Conversational or "predictive" adaptive layouts.
- Brand red for errors, warnings, links in body text or large fills.
- Opacity to dim cancelled or disabled content (fails contrast); use muted tokens.
- All-caps labels, letter-spaced overlines, more than two font weights in a single row.
- Horizontal scrolling for core data on phones.
- Placeholder text as the only label.
- Decorative illustrations, emoji or stock imagery.

---

## 7. Needs Jeff's call

1. **Confirm dialogs** for Cancel party and Remove user (audit findings 2 and 7). Designed (3.13), not part of the restyle until approved.
2. **Header links for admin and sales** include routes the guards already admit (admin: Schedule, Parties, My schedule; sales: My schedule). Display only, but it surfaces pages admin can open today without a link. Approve the link list in 3.1, or keep admin to Users and Settings.
3. **Sign out in the header for sales and manager.** Today the sales and manager pages have no sign-out button in their page code; the header adds one (posts to the existing `/auth/signout`). Fulfils parity item 10.
4. **Edit disclosure on sales rows** (3.15): edit forms are collapsed behind "Edit" instead of always open. Layout only; same form and action.
5. **Manager viewers** (Dion, Susie, Sophia): read-only or not is unresolved in `user-context.md`. This spec changes nothing; if they should be read-only, that is a permissions change for a separate approval.
6. **Font:** system stack (default, zero cost) vs self-hosted Inter via `next/font/local` (no npm dependency; adds about 100 KB of font files).
7. **Icons:** inline Lucide SVGs copied into a local file (default) vs adding `lucide-react` (dependency, needs approval).
8. **Logo asset:** a clean SVG of the Bird Bowl mark is needed; confirm `#D7002A` against the source file with a colour picker.
9. **Loading state for server-action Save buttons** needs a tiny client wrapper (`useFormStatus`). Optional.
10. **Theme toggle** stores the choice in `localStorage` on the device (no account data). Confirm that per-device is acceptable.
