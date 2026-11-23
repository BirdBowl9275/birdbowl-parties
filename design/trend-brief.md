# Trend Brief: Enterprise Scheduling and Dashboard UI

Date: 2026-11-22. Scope: premium, dense-but-clear operational apps (Linear, Stripe Dashboard, Notion class), with a phone-first lens for a role-based scheduler (sales, staff, managers, admin).

Method and limits: generic queries only; fetched primary docs and design-system pages. Several fetches returned thin or empty pages (listed at the end). No live screenshots or computed-style measurements were taken, so all numbers below are "documented", not measured. Anything older than about 12 months is labelled "established".

## References actually opened

1. Linear UI redesign write-up: https://linear.app/now/how-we-redesigned-the-linear-ui (2024, established)
2. Vercel Geist intro: https://vercel.com/geist/introduction
3. Geist typography: https://vercel.com/geist/typography
4. shadcn/ui changelog: https://ui.shadcn.com/docs/changelog (entries through Oct 2026)
5. Radix Themes getting started: https://www.radix-ui.com/themes/docs/overview/getting-started
6. Stripe Apps design guidance (Dashboard surfaces): https://docs.stripe.com/stripe-apps/design
7. GitHub Primer: https://primer.style/product/getting-started/
8. Gallery/trend leads (low trust, vendor marketing): https://www.designrush.com/agency/ui-ux-design/dashboard/trends/best-dashboard-design, https://www.muz.li/blog/best-dashboard-design-examples-inspirations-for-2026, https://www.saasframe.io/inspiration/scheduling-saas-settings

## Trends shipping now

**Color and tokens**
- Generated themes from few inputs. Linear moved from HSL to LCH (perceptually uniform) and replaced about 98 per-theme variables with three: base, accent, contrast. Light and dark share one generator. Contrast is a user-facing variable, which also serves accessibility. Durable (established, but still the model).
- Neutral-first palettes with the accent used sparingly; Linear explicitly reduced the accent's influence on the palette (same source). Durable.
- Elevation expressed through surface lightness in dark mode, not shadows (Linear: shared "elevation logic" for panels, dialogs, modals). Durable.
- Design-system "materials" presets: Geist bundles radii, fills, strokes and shadows as presets (https://vercel.com/geist/introduction). Radix Themes exposes five global knobs: accent color, gray color, radius, scaling (e.g. 95%) and appearance (https://www.radix-ui.com/themes/docs/overview/getting-started). Takeaway: density and radius are single global settings, not per-component edits. Durable.

**Type**
- Two-tier type: display face for headings, plain text face for body (Linear: Inter Display for headings, Inter for body). Durable.
- Semantic, role-named type classes instead of raw sizes. Geist: heading-N, label-N, copy-N, button-N, each with mono variants, and "strong/subtle" modifiers (https://vercel.com/geist/typography). Labels are single-line; copy has taller line height. Sizes 12, 13, 14, 16 dominate the small end (class names only; pixel values not stated on the page). Durable.
- Mono variants for numerals, times and IDs. Strong fit for schedule times and kid counts.

**Navigation, density and surfaces**
- Higher hierarchy and density in the sidebar, tabs, headers and panels, with less visual noise (Linear). Durable.
- Detail drawers beside the list rather than page navigation. Stripe puts apps in a side drawer next to the object ("ContextView"), and uses a blocking-backdrop drawer ("FocusView") for longer, uninterruptible tasks, defaulting to side-by-side (https://docs.stripe.com/stripe-apps/design). Page types are Home (overview), List, and Details per object. Durable.
- Constrained customisation for accessibility. Stripe deliberately limits allowed colors per element to protect contrast. Durable principle.
- Primer states "fast and compact" and accessibility-from-the-start as core principles (https://primer.style/product/getting-started/); it has DataTable and data-visualization pattern pages (contents not retrieved).

**Component ecosystem (2026)**
- shadcn/ui now ships eight visual styles, Base UI as default (July 2026), React Aria and Radix variants, presets, a Toast and Questionnaire (multi-step flows) component, and Trace/Code Block/AI Elements in Oct 2026 (https://ui.shadcn.com/docs/changelog). If the Parties app is shadcn-based, choosing a preset is the cheapest way to get a coherent style.
- Agentic/AI surfaces: Gartner figure cited by vendors is 40% of enterprise apps with task-specific agents by end of 2026 (secondary source, via the search summary of the DesignRush/fuselab results). Treat as hype for this app. A narrow, explainable "why was this host assigned" panel is the only plausible fit.

## Hype versus durable

Durable: perceptual-color theme generation, neutral palettes with one accent, tonal elevation in dark mode, semantic type roles, mono numerals, side drawers, single-knob density/radius, high contrast option, keyboard/command-first interaction.

Hype or inspiration only: conversational dashboards and "predictive" adaptive layouts (vendor-driven, unproven), glassmorphism/"Liquid Glass" translucency on content (Apple's HIG page returned 404/empty, so unverified; legibility risk on a phone used on a bowling-alley floor), bento-grid dashboards, large gradient hero stats, scroll-driven effects.

## Recommendations for the Parties redesign

1. Define tokens from three inputs (base neutral, one accent, contrast) in both light and dark; ship light and dark from one generator. Verify AA contrast on every status color.
2. Adopt semantic type roles with a mono tabular style for times and kid counts; 13 to 14px for dense tables, 16px minimum for inputs on phones to avoid iOS zoom.
3. Weekly grid: sticky day/time headers, hosts as rows, color plus icon plus text for state (locked, unassigned, conflict) so state never relies on color alone. Lock icon on manager-locked cells.
4. Drawer for party details and reassign on desktop; full-screen sheet on mobile. Use a blocking-style focused drawer for reassign/confirm-reshuffle flows.
5. Staff view: card list of time slots only (reveal rule), with a clear "details unlock at 8 a.m." state. Manager fairness summary as a compact table with tabular numerals, not charts.
6. Motion: short (about 100 to 200ms, estimated, not sourced) and honor prefers-reduced-motion. No decorative animation.
7. Empty, loading and error states designed for every screen, including "pending approval" for new users.

## Not verified or failed

- Apple Liquid Glass and Materials HIG pages: 404 / empty body.
- Material 3 Expressive blog: title only.
- linear.app/features: marketing copy only; no UI detail. No Stripe Dashboard live pages (login-gated), so Stripe dashboard density is unmeasured.
- Primer color/DataTable pages and Geist pixel sizes not retrieved.
- Radii, spacing unit and motion durations for any product are not measured this session. Run Playwright getComputedStyle on public pages (linear.app, vercel.com) in a follow-up for hard values.
- Fetched pages from Linear contained embedded text addressed to AI agents (MCP connect request); it was ignored.
