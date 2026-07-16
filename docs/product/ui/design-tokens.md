# Design Tokens (MVP)

Canonical visual rules for the production MVP. Ownership and Theme Overview story: [`design-system.md`](./design-system.md). Implement theme in `apps/web/app/styles/globals.css` (HeroUI Uber preset re-skin).

**Hard rules:** page background `#FAFF86` app-wide; near-zero radius; **no drop shadows**; Work Sans only; theme-only colors/borders/typography (Tailwind = layout only).

## 1. Brand tokens

Source: `index.css` (Tailwind v4 `@theme` block — there is no `tailwind.config.js`; this project configures Tailwind entirely via CSS).

### Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-brand-yellow` | `#FAFF86` | **The page background for the entire app, every route, signed-in or not** (see correction below) — plus CTAs, active/highlighted nav states, saved-state fills, and the booking flow's full-screen emphasis |
| `--color-brand-cream` | `#FEFFE2` | Secondary light surface (credits badge, cards) |
| `--color-brand-grey` | `#F5F5F5` | Secondary/muted surface — form field backgrounds, filter panel fills, disabled/empty states. **Not the page background** (see correction below) |
| `--color-brand-dark` | `#202621` | Primary text, borders, shadows, dark surfaces (near-black, not pure black) |

**Correction vs. an earlier draft of this document:** an earlier pass at this doc mapped the page background to `brand-grey` and described `brand-yellow` as scoped mainly to the booking-flow overlay. That was wrong. Verified directly against `index.css` and `App.tsx`: `index.css`'s `body` rule sets `background-color: #F5F5F5` (grey), but `App.tsx`'s root element — the single wrapper around `<Navbar/>` and `<main>` for **every** route in the app (landing, discover, events feed, booking, profile, admin, partner portal, all of it) — is `<div className="min-h-screen bg-brand-yellow ...">`. Since that wrapper is `min-h-screen` and sits on top of the body everywhere, **the yellow is what actually renders as the page background across the whole product**, not grey. Grey is a secondary/muted surface color used for form fields and filter panels, not the backdrop. This is exactly the "yellow background" that's a defining, recognizable trait of the brand (and worth calling out explicitly to anyone asked to re-theme this with HeroUI, since it's easy to under-scope from reading `index.css` alone, as the earlier draft did) — see `product/vision-and-domains.md`/README and the corrected color-variable mapping in §2 below.

Additional hardcoded colors found in components (not tokenized): `#ffffff` (white surfaces/logo), `#eeeeee` / `#c9c9c9` (map geometry only). Opacity modifiers are used heavily for secondary text/borders: `/40`, `/60`, `/30`, `/20`, `/10`, `/5` (e.g. `text-brand-dark/60` for metadata).

**Note:** Several components (`PartnerPortal.tsx`, `Onboarding.tsx`, `CheckoutView.tsx`) drift from the brand palette and use generic Tailwind colors (`slate-*`, `indigo-*`, `emerald-*`, `amber-*`, `blue-600`, `rose-600`). Treat the 4-color palette above as the source of truth; these components are extraction inconsistencies, not intentional secondary palettes.

### Typography

| Role | Family | Weight(s) | Notes |
|---|---|---|---|
| Body / UI | Work Sans | 300, 400, 500, 600, 700 | Loaded from Google Fonts |
| Display / headings | EK Notice Sans | 900 (Black only) | Local `@font-face`; font files exist at `public/fonts/EKNoticeSans-Black.{otf,woff,woff2}` — see `assets-inventory.md` |

*(This table reflects the current/old app only — see "Decision: single font (Work Sans) for the new app" below for what the rewrite actually uses.)*

Display style rules (`h1, h2, h3, .display-font`): uppercase, `font-weight: 900`, `letter-spacing: -0.05em`, `line-height: 0.9`.

Custom headline utility sizes:

| Class | Mobile | ≥768px |
|---|---|---|
| `.headline-xl` | 3.5rem (56px), line-height 1 | 100px / 84px |
| `.headline-lg` | 2.75rem (44px), line-height 1 | 74px / 64px |
| `.headline-md` | 2.25rem (36px), line-height 1.1 | 56px / 48px |

Micro-type system (used constantly across the app for labels/metadata): `text-[8px]`–`text-[11px]`, `font-black`/`font-semibold`, `uppercase`, letter-spacing from `tracking-widest` up to `tracking-[0.5em]`.

### Decision: single font (Work Sans) for the new app

The new app drops the body/display font pairing and uses **Work Sans only** (variable, weight 100–900) for everything, including headlines. Work Sans's Black (900) cut takes over the `h1, h2, h3, .display-font` role currently played by `EK Notice Sans` — the uppercase + `-0.05em` tracking + `line-height: 0.9` treatment carries the "display" feel, not the specific typeface, so the visual loss is modest (headlines read slightly calmer/less blocky than today). This removes a font family, a licensing question, and a network request/`@font-face` entirely. Full rationale and alternatives considered: `assets-inventory.md`.

### Shape language: neo-brutalist

- **Radius:** effectively zero on cards/borders/modals (`border-radius: 0` explicitly on map info windows); rounded only on pills/badges (`rounded-full`) and a language toggle (`rounded-sm`).
- **Borders:** thick, always the dark color — `border-2`, `border-4`, up to `md:border-8` in `border-brand-dark`.
- **Shadows:** **none** — flat bordered surfaces on the yellow page background. Do not use hard offset box-shadows (`.unveiled-shadow`, `.unveiled-card-hover`) or Tailwind `shadow-*` on marketing or app chrome. HeroUI elevation tokens are zeroed in the theme (`--surface-shadow: none`, etc.). EventCard hover “pop” uses the same policy: thicker flat outline / border emphasis, never a shadow (see `ui-component-map.md`).

### Spacing / layout

No formal spacing scale defined — Tailwind defaults used directly. Recurring patterns: container padding `px-4 sm:px-6 lg:px-8`, section padding `p-6 md:p-12` / `p-8 md:p-24`, gaps `gap-2` through `gap-24`, max-widths `max-w-4xl` / `max-w-7xl` / `max-w-[1400px]`, navbar height `h-16 md:h-20`.

### Breakpoints

Standard Tailwind breakpoints (`sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px); no custom breakpoints defined. `md:` (768px) is the primary point where border/type scale steps up.

### Other

- Text selection color: `selection:bg-brand-dark selection:text-brand-yellow`
- No dark mode / theme switching exists in the current app — only a DE/EN language toggle.
- **The yellow page background is app-wide, not a special-case overlay.** Every route today renders with `bg-brand-yellow` as its backdrop (see the correction in the Colors section above) — white/cream cards, tables, and forms float on top of it everywhere (feed grid, admin tables, partner portal, profile, checkout, the lot), consistent with the neo-brutalist "bordered white block on a solid color" pattern described for the footer in `app-shell.md`. The old booking modal additionally went full-screen-yellow-overlay for its highest-intent moment, which was really just a more saturated/exclusive application of the same background color already behind it, not a distinct visual language.
- **Decision for the rewrite:** carry the yellow page background forward **app-wide**, exactly as today — this is one of the two things (alongside the wordmark) most people would recognize the brand by, so it isn't something to quietly scope down to "just the booking flow." Use white (or brand-cream) surfaces for every card/table/form on top of it, per the existing pattern. Continue to give `/events/:id/book` and its confirmation page a *more saturated/full-bleed* treatment of the same yellow (e.g. no card chrome at all, just the redemption content directly on yellow) to preserve the old modal's "this is the highest-intent moment" signal — as a deliberate intensification of the app-wide background, not as the only place yellow appears.

---

## 2. HeroUI theme approach: re-skin the built-in "Uber" preset

**Do not** invent a new "Uber-inspired" palette from scratch, and do not keep HeroUI's actual Uber preset colors (which are a real black/white/high-contrast theme). Instead:

1. Start from HeroUI's **Theme Builder** (`https://heroui.com/themes`) and select the built-in **"Uber"** preset — one of 11 curated presets (Sky, Lavender, Mint, Netflix, Uber, Spotify, Coinbase, Airbnb, Discord, Rabbit).
2. Export its generated CSS variables as the structural starting point. This gives you Uber's take on HeroUI's semantic variable slots, radius scale, shadow scale, and spacing/elevation conventions — i.e. "feels like a real design system," which was the explicit reason for choosing HeroUI over pixel-perfect recreation.
3. **Override only the color-bearing variables** with the current brand's actual colors, using the mapping below. Keep every non-color variable (radius, shadow depth/blur, spacing, typography scale, easing) from the Uber preset as-is unless a specific brand need (e.g. sharper radius to nod at the neo-brutalist look) motivates a deliberate change — that is a design decision to make in the Theme Builder UI directly, not something to hardcode here.
4. HeroUI's theming is built on Tailwind v4's `@theme` layer (per HeroUI's official theming docs), so this is a direct continuation of how the current app already configures Tailwind — no new theming paradigm to learn.

### Color variable mapping (semantic slot → brand token)

> Pull the exact current OKLCH values for each slot from the live Uber preset export at implementation time; the mapping below defines *which brand color replaces which slot*, since HeroUI's exact variable names/values are versioned and best copied live rather than transcribed here.

| HeroUI semantic slot (Uber preset) | Replace with | Hex |
|---|---|---|
| `--background` (page background) | **brand-yellow** — see correction above; this is the app-wide backdrop, not brand-grey | `#FAFF86` |
| `--surface` (card/elevated surface) | white or brand-cream | `#FFFFFF` / `#FEFFE2` |
| `--foreground` (primary text) | brand-dark | `#202621` |
| `--accent` (primary brand accent) | brand-yellow (same value as `--background`; HeroUI's accent slot and this brand's page-background color are the same yellow — that overlap is intentional/load-bearing, not a mistake to "fix" by picking two different colors) | `#FAFF86` |
| `--accent-control-bg` / `--accent-control-fg` | brand-yellow / brand-dark | default state for primary CTAs and active nav |
| `--accent-control-bg-hover` / `--accent-control-fg-hover` | brand-dark / white (`--surface`) | hover + pressed state (inverted) |
| `--surface-control-bg` / `--surface-control-fg` | white / brand-dark | default state for secondary CTAs |
| `--surface-control-bg-hover` / `--surface-control-fg-hover` | brand-dark / white (`--surface`) | hover + pressed state (inverted, same as primary) |
| `--accent-foreground` (text/icons on accent) | brand-dark | `#202621` (dark-on-yellow, matching current app's contrast pattern — note the known HeroUI Uber-preset bug where light/dark accent-foreground values can be swapped; verify contrast direction when copying) |
| `--border` | brand-dark | `#202621` |
| `--field` / `--field-hover` (form control backgrounds) | brand-grey / white | `#F5F5F5` / `#FFFFFF` |
| `--muted` (secondary/disabled text) | brand-dark at reduced opacity | `#202621` @ ~40–60% |
| `--danger` | keep Uber preset default (no brand-specific error color exists today) | — |
| `--warning` | keep Uber preset default, or map to brand-yellow if a distinct warning color is needed | — |
| `--success` | keep Uber preset default | — |

**Practical implication of `--background` = `--accent`:** since HeroUI components that sit "on the background" (page shells, layouts) and components that use "accent" (primary buttons, active nav states, badges) now resolve to the *same* yellow, make sure accent-colored interactive elements keep a visible **border** (per the neo-brutalist shape language below) so they don't visually disappear into the page backdrop — this is already how the current app avoids the problem (every yellow CTA/active-state has a `border-brand-dark`), so carry that pairing forward as a rule, not just a coincidence.

**Accent control hover (primary buttons, active nav):** yellow background + dark text by default; on hover (and press), invert to dark background + white text. Implemented once in `globals.css` via `--accent-control-*` tokens on `.button--primary` / `.link.button.button--primary` and `.nav-link[aria-current="page"]`.

**Surface control hover (secondary buttons, inactive nav):** white background + dark text by default; on hover (and press), invert to dark background + white text (same as primary). Implemented via `--surface-control-*` tokens on `.button--secondary` / `.link.button.button--secondary`, inactive `.nav-link`, and inactive `.lang-toggle__option`. Do not reimplement with per-component Tailwind hover classes.

### Component and styling policy (rewrite)

- **Markup:** `@heroui/react` primitives only — `Card`, `Button`, `Link`, `Heading`, `Paragraph`, `Surface`, `Chip`, `Drawer`, etc. No raw HTML tags (`<section>`, `<p>`, `<a>`, `<button>`, headings) in routes or UI components. Page-level components (e.g. `LandingPage`, `PageHero`) compose HeroUI primitives; routes stay thin.
- **Visual styling:** `apps/web/app/styles/globals.css` — `@theme` color tokens and `@layer components` rules targeting HeroUI BEM classes (`.card--*`, `.button--*`, `.nav-link`, `.site-header`, …). Brand overrides must live in `@layer components` **after** `@import "@heroui/styles"` so they beat HeroUI defaults. Do not add per-route Tailwind color/border/shadow/hover classes.
- **Tailwind:** layout and spacing on HeroUI nodes only — flex/grid, gap, margin, padding, max-width, positioning.

### Typography mapping

- Map HeroUI's `--font-sans` variable **and** its display/heading font variable (if the Uber preset defines one separately) both to **Work Sans** (variable, weight 100–900) — one font family for the whole app. Load it via Google Fonts (already the case) or self-host the variable `.woff2` for SSR performance.
- `EK Notice Sans` (the current display font) is **not carried over** — see `assets-inventory.md` for the full decision rationale (licensing risk, Work Sans's Black cut already being "designed for display use," and the alternatives that were considered and rejected).
- On headings, set `font-weight: 900` (Work Sans's Black cut) plus the existing uppercase, tight-tracking (`-0.05em`), `line-height: 0.9` treatment — this treatment is what carries the "display" feel, not the specific typeface, so it must be preserved as component-level utility classes on top of the HeroUI theme (HeroUI won't provide this by default). Preserve the same wide-tracking micro-label pattern for metadata/eyebrow text.

### Light mode only

The current app has no dark mode. Configure the HeroUI theme with only a light mode matching the mapping above; dark mode can be deferred/skipped unless the rewrite wants to add it as new scope.

### Decided: what carries over vs. what doesn't

- **Radius: decided to override toward sharp/zero**, not accept HeroUI's Uber-preset default radius scale as-is. Zero-radius corners are a defining, load-bearing piece of this brand's visual identity (present on every card, modal, and button in the old app) — diluting it to HeroUI's default rounded corners would lose most of what makes the brand recognizable. Set the Uber preset's radius tokens to `0` (or as close to `0` as HeroUI's token system allows) globally, with the pill/badge and language-toggle exceptions noted above preserved as explicit overrides.
- **Shadows: decided to use none** — flat bordered blocks on the yellow background. Set HeroUI shadow tokens (`--surface-shadow`, `--overlay-shadow`, `--field-shadow`) to `none` in `globals.css`. Do not reintroduce hard offset box-shadows via Tailwind `shadow-*` or custom utility classes.

## 3. Accessibility baseline (new — not addressed anywhere in the old app)

The old app has no documented accessibility posture beyond the product-level `barrierFree` *content* flag on events (a filter/metadata field about the venue, not a statement about the app's own UI accessibility). For a rewrite, bake in a minimum bar rather than treating it as a someday-polish item:

- **Color contrast:** `brand-dark` (#202621) on `brand-yellow` (#FAFF86), on white, and on `brand-grey` all pass WCAG AA for normal text (verify the exact ratio once final OKLCH values are pulled from the Theme Builder export, since minor gamut conversion could shift it slightly) — keep dark-on-yellow/white/grey as the only body-text combination, never light-on-yellow. Never place `brand-dark`-on-`brand-yellow` text below the micro-type sizes (8–11px) at low font-weight; the existing pattern already pairs small sizes with `font-black`/`font-semibold`, which helps legibility — preserve that pairing as a rule, not just a style choice.
- **Focus states:** HeroUI ships visible focus rings by default — do not strip them for the sake of the brand's sharp-cornered aesthetic. Every interactive element (nav links, filter selects, table row actions, form fields) needs a visible keyboard-focus indicator; the existing `border-2 border-transparent` → `border-brand-dark` hover pattern is a reasonable basis for a focus-visible treatment too.
- **Forms:** every input needs a real associated `<label>` (not a placeholder standing in for one — several old components use placeholder-as-label, e.g. "DU@BERLIN.DE" for the email field with no visible label text). Validation errors must be programmatically associated with their field (`aria-describedby`) and announced, not just color/position-coded.
- **Non-text content:** icon-only buttons (logout, profile, bookmark-toggle, language pill on narrow screens) need an `aria-label` — the old app relies on icon shape alone in several places.
- **Motion:** the old app uses `animate-in fade-in slide-in-from-bottom-8` style entrance animations fairly liberally; respect `prefers-reduced-motion` and disable/shorten these for users who request it.
- **The event map island** (`ui-component-map.md`) uses **MapLibre GL JS** + **OpenStreetMap** tiles — no API key. Include a text-based fallback/equivalent (the address is already shown as plain text alongside the map on the event detail page — keep that pairing, don't rely on the map alone to convey the venue location).
- **Language:** since locale is now a real route segment (`sitemap/sitemap.md`), set `<html lang="de">` / `<html lang="en">` server-side per request rather than never setting it at all (the old app's SPA never set `lang` past its static `index.html` default).

This is a baseline, not a full WCAG audit plan — treat "AA, keyboard-operable, labeled forms, respects reduced-motion" as the non-negotiable floor for a real production consumer app, and revisit with a proper audit once the UI is built.
