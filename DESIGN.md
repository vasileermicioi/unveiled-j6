---
version: alpha
name: Unveiled Berlin
description: Neo-brutalist cultural-membership UI — yellow page field, flat bordered surfaces, Work Sans display.
colors:
  primary: "#202621"
  secondary: "#F5F5F5"
  tertiary: "#FAFF86"
  neutral: "#FFFFFF"
  cream: "#FEFFE2"
  on-primary: "#FEFFE2"
  on-tertiary: "#202621"
  on-neutral: "#202621"
  muted: "#20262180"
  border: "#202621"
  page: "#FAFF86"
  field: "#F5F5F5"
  accent: "#FAFF86"
  accent-foreground: "#202621"
typography:
  h1:
    fontFamily: Work Sans
    fontSize: 3.5rem
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: -0.05em
  h2:
    fontFamily: Work Sans
    fontSize: 2.75rem
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: -0.05em
  h3:
    fontFamily: Work Sans
    fontSize: 2.25rem
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: -0.05em
  body-md:
    fontFamily: Work Sans
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Work Sans
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  label-caps:
    fontFamily: Work Sans
    fontSize: 0.75rem
    fontWeight: 600
    letterSpacing: 0.08em
  button:
    fontFamily: Work Sans
    fontSize: 0.875rem
    fontWeight: 700
    letterSpacing: 0.02em
rounded:
  none: 0px
  sm: 0px
  md: 0px
  lg: 0px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 96px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    rounded: "{rounded.none}"
    padding: 12px
    typography: "{typography.button}"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
  button-secondary:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-neutral}"
    rounded: "{rounded.none}"
    padding: 12px
    typography: "{typography.button}"
  button-secondary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
  card:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-neutral}"
    rounded: "{rounded.none}"
    padding: 24px
  card-inverted:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.none}"
    padding: 24px
  chip:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: 8px
  field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.primary}"
    rounded: "{rounded.none}"
    padding: 12px
  caption:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.muted}"
    typography: "{typography.body-sm}"
  border-frame:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.border}"
    rounded: "{rounded.none}"
  accent-fill:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    rounded: "{rounded.none}"
  nav-link-active:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    rounded: "{rounded.none}"
  page-shell:
    backgroundColor: "{colors.page}"
    textColor: "{colors.primary}"
---

## Overview

Neo-brutalist cultural membership UI for Berlin. The brand signal is a full-bleed **brand-yellow** page field (`#FAFF86`) with flat white (or cream) cards floating on top — thick dark borders, **zero radius**, **no drop shadows**. Typography is **Work Sans only**: display headings are uppercase Black (900) with tight tracking; body stays normal case.

Implementation lives in HeroUI’s Uber preset re-skin (`apps/web/app/styles/globals.css`). Agents must compose `@heroui/react` primitives — never invent a parallel palette or reintroduce offset shadows from the old Firebase app.

Product UI ownership and Theme Overview story: [`docs/product/ui/design-system.md`](docs/product/ui/design-system.md). Expanded token narrative: [`docs/product/ui/design-tokens.md`](docs/product/ui/design-tokens.md).

## Colors

Four brand colors plus white. Yellow is both the **page background** and the **accent** — that overlap is intentional. Yellow interactive controls therefore keep a visible **2px dark border** so they do not dissolve into the page.

- **Primary (#202621):** Brand dark — headlines, body text, borders, inverted panels, hover fills.
- **Secondary (#F5F5F5):** Brand grey — form fields and muted surfaces only. **Not** the page backdrop.
- **Tertiary (#FAFF86):** Brand yellow — app-wide page background, primary CTAs, active nav, accent fills.
- **Neutral (#FFFFFF):** White card/navbar/footer surfaces and secondary button defaults.
- **Cream (#FEFFE2):** Soft secondary light surface (badges, alternate cards); also text on dark inverted panels.
- **Page / Accent:** Same yellow as tertiary — HeroUI `--background` and `--accent` both map here.
- **Muted:** Brand dark at ~50% opacity for captions and metadata.

Light mode only — no dark theme in MVP.

## Typography

One family: **Work Sans** (variable 100–900). Do not load EK Notice Sans.

- **Headings (h1–h3):** weight 900, uppercase, `letter-spacing: -0.05em`, `line-height: 0.9`. Scale up at `md` breakpoints in theme CSS, not ad-hoc Tailwind font sizes.
- **Body:** normal case, weight 400; secondary copy uses muted color.
- **Labels / eyebrows:** small caps-style treatment — uppercase, semibold, wider tracking.
- **Buttons:** semibold/bold Work Sans; keep labels short and scannable.

## Layout

Yellow field edge-to-edge. Content sits in bordered white/cream blocks with generous padding.

- Page container: `max-w-7xl` with horizontal padding `16px → 24px → 32px` (sm/lg).
- Section rhythm: `24px`–`48px` gaps between major blocks; marketing heroes may use larger vertical padding (`48px`–`96px`).
- Navbar offset: main content clears a `64px` / `80px` (md) sticky header.
- Primary breakpoint for type and padding steps: `768px` (`md`).
- Tailwind on components is **layout only** (flex, grid, gap, padding, max-width, positioning) — never colors, borders, shadows, or typography that belong in the theme.

## Elevation & Depth

**None.** Surfaces are flat. Depth comes from contrast (yellow field vs white card) and **2px–4px dark borders**, not shadows.

- HeroUI shadow tokens stay `none` (`--surface-shadow`, `--overlay-shadow`, `--field-shadow`).
- Do not use Tailwind `shadow-*` or hard offset box-shadows (`.unveiled-shadow` from the legacy app).
- Navbar/footer may use a thicker top/bottom border (`4px`) as chrome weight, still flat.

## Shapes

Neo-brutalist rectangles.

- **Cards, buttons, inputs, drawers:** `border-radius: 0` (`rounded.none` / `sm` / `md` / `lg` all `0px`).
- **Borders:** `2px` brand-dark by default; chrome may go `4px`.
- **Pills only** where the product already uses chips/badges or the language toggle (`rounded.full`) — do not round cards or primary CTAs.
- Inverted marketing panels: dark fill + cream text, still zero radius and bordered.

## Components

Compose HeroUI primitives (`Card`, `Button`, `Link`, `Heading`, `Paragraph`, `Surface`, `Chip`, `Select`, `Input`, …). Theme owns look; routes stay thin.

- **Primary CTA** (`button button--primary`): yellow bg, dark text, dark border → hover/press inverts to dark bg + white text.
- **Secondary CTA** (`button button--secondary`): white bg, dark text, dark border → same invert on hover.
- **Cards:** white (or cream) on yellow; inverted `Card variant="secondary"` for dark callout panels — not for auth forms.
- **Fields:** grey fill (`colors.field`), dark text, zero radius, dark border.
- **Nav:** inactive links behave like secondary controls; `aria-current="page"` fills yellow like primary.
- **Auth forms:** white default card on yellow chrome; do not use inverted secondary cards for login/signup.
- Prefer **Select** over Radio/Checkbox groups for MVP choice UIs.
- Design-system primitives and the **Theme Overview** Ladle story live in `@unveiled/ui` — see [`docs/product/ui/design-system.md`](docs/product/ui/design-system.md).

## Do's and Don'ts

**Do**

- Keep the yellow page background on **every** route (guest, member, admin).
- Put visual changes in `globals.css` (`@theme` + `@layer components` after `@import "@heroui/styles"`).
- Use HeroUI markup only; match static copy from product UI docs verbatim.
- Give yellow CTAs a dark border so they stay visible on the yellow field.
- Adjust theme via the Theme Overview story before inventing one-off page styles.

**Don't**

- Use grey (`#F5F5F5`) or cream as the page backdrop.
- Add drop shadows, soft elevation, or legacy hard-offset shadows.
- Round cards/buttons or introduce a second display font.
- Style with Tailwind color/border/shadow/hover utilities in TSX.
- Drop raw HTML (`<section>`, `<p>`, `<a>`, `<button>`, headings) into routes or UI components.
- Gate public `/events/:id` behind auth or invent a third “home” besides Discover locale home.
