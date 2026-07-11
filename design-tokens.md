# Design Tokens — Unveiled Berlin

**Read this before any UI work.** This is the git-tracked source of truth for visual design. Implementation lives in [`apps/web/app/styles/globals.css`](apps/web/app/styles/globals.css).

For page copy, section structure, and component inventory, also read [`docs/product/ui/`](docs/product/ui/design-tokens.md) and root [`DESIGN.md`](DESIGN.md).

---

## Quick rules (non-negotiable)

1. **HeroUI markup only** — `Card`, `Link`, `Button`, `Heading`, `Paragraph`, `Surface`, `Chip`, `Drawer`, etc. No raw `<section>`, `<p>`, `<button>`, `<a>`, headings in routes or components. Exception: `<script type="application/ld+json">` for SEO.
2. **Theme-only visual styling** — colors, borders, radius, shadows, typography, hover states → `globals.css` (`@theme` + `@layer components`). **Never** Tailwind color/border/shadow/hover utilities on routes or components.
3. **Tailwind for layout only** — flex, grid, gap, padding, max-width, positioning on HeroUI nodes.
4. **Yellow page background everywhere** — `#FAFF86` on every route. White/cream cards float on top.
5. **Neo-brutalist shape** — 2px dark borders, **zero radius** on cards/buttons, **no drop shadows**.
6. **Work Sans only** — one font family; headings use weight 900 + uppercase + tight tracking.
7. **Light mode only** — no dark theme in v1.

---

## Brand palette

| Token | CSS variable | Hex | Usage |
|---|---|---|---|
| Brand yellow | `--color-brand-yellow` | `#FAFF86` | Page background, primary CTAs, active nav, accent |
| Brand dark | `--color-brand-dark` | `#202621` | Text, borders, inverted panels, hover backgrounds |
| Brand cream | `--color-brand-cream` | `#FEFFE2` | Secondary light surface, text on dark panels |
| Brand grey | `--color-brand-grey` | `#F5F5F5` | Form fields, muted surfaces — **not** page background |
| White | `--surface` | `#FFFFFF` | Cards, navbar, footer, secondary buttons |

**Critical:** `--background` and `--accent` both resolve to brand yellow. Yellow controls **must** keep a visible **2px dark border** so they don't disappear into the page.

---

## Typography

| Element | Rules |
|---|---|
| Font | Work Sans (variable 100–900), `--font-sans` in `@theme` |
| Headings (`Heading`, `.typography--h1`–`h6`) | `font-weight: 900`, `uppercase`, `letter-spacing: -0.05em`, `line-height: 0.9` |
| Body / descriptions | Normal case, `--muted` for secondary text |
| Eyebrows / labels | `Paragraph` with `color="muted"`, `size="sm"`, `uppercase`, wide tracking |
| Micro labels | Small sizes only with semibold/bold weight — never thin text on yellow |

Heading sizes are scaled in `globals.css` (e.g. `.card.page-hero`, `.faq-hero`). Add page-specific heading scale there, not inline Tailwind font sizes.

---

## Shape & surfaces

| Property | Value |
|---|---|
| Border width | `2px` (`--border-width`); navbar/footer top border `4px` |
| Border color | `--border` → brand dark |
| Border radius | `0` on cards, buttons, inputs (`--radius: 0`) |
| Shadows | **None** — `--surface-shadow`, `--overlay-shadow`, `--field-shadow` all `none` |
| Cards | White background, 2px border, no shadow; padding `1.5rem` / `2rem` at `md+` |
| Inverted panels | `Card variant="secondary"` — dark bg, cream text (e.g. "Why this works") |

**Do not** reintroduce hard offset shadows from the old Firebase app. Flat bordered blocks on yellow is the brand.

---

## HeroUI theme

- **Base:** HeroUI v3 **Uber** preset structure (semantic CSS variables in `@layer theme`).
- **Override:** Only color-bearing slots mapped to brand palette (see `globals.css` `:root` block).
- **Components:** Brand overrides in `@layer components` **after** `@import "@heroui/styles"` and `@import "@better-auth-ui/heroui/styles"`.

### Semantic mapping (summary)

| HeroUI slot | Brand value |
|---|---|
| `--background` | Brand yellow |
| `--foreground` | Brand dark |
| `--surface` | White |
| `--accent` | Brand yellow |
| `--border` / `--separator` | Brand dark |
| `--muted` | Brand dark @ ~50% opacity |
| `--field-background` | Brand grey |

---

## Interactive controls

Use these class names on HeroUI `Button` or `Link` — hover/press handled in theme, not per-component Tailwind.

| Pattern | Classes | Default | Hover |
|---|---|---|---|
| Primary CTA | `button button--primary button--md` | Yellow bg, dark text, dark border | Dark bg, white text |
| Secondary CTA | `button button--secondary button--md` | White bg, dark text, dark border | Dark bg, white text |
| Full width | add `button--full-width` | | |
| Nav link | `nav-link` on `Link` | White; active = yellow fill | Inverts like buttons |
| Footer link | `footer-link` on `Link` | Uppercase, underline on hover | |

Active nav: `aria-current="page"` — styled via `.link.nav-link[aria-current="page"]`.

Language toggle: `.lang-toggle` / `.lang-toggle__option` — pill container; selected option = dark bg + yellow text.

---

## Layout patterns

| Pattern | Classes / values |
|---|---|
| Page container | `mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8` |
| Section vertical rhythm | `gap-8` / `lg:gap-12` between major blocks |
| Narrow content column | `max-w-3xl` (hero copy, conversion cards) |
| Navbar offset | Main content `pt-16 md:pt-20` (header height 4rem / 5rem) |
| Breakpoints | Tailwind defaults; `md` (768px) is primary step for type/padding |

### Marketing page structure

Most static pages follow:

1. **Hero** — eyebrow + large `Heading` + supporting `Paragraph`. Either on yellow directly (FAQ) or inside `PageHero` card (how-it-works).
2. **Content cards** — `Card` or `SectionCard` with bordered white (or inverted dark) panels.
3. **CTAs** — primary/secondary button classes; links via `localizedPath()`.

Reuse existing components before inventing new ones: `PageHero`, `SectionCard`, `HelpSection`, `LandingPage`, etc. in `apps/web/app/components/marketing/`.

### Auth page structure (Phase 2+)

Login, signup, forgot-password, and reset-password follow a different pattern from marketing heroes:

1. **Page chrome** — `AuthPageLayout`: localized `Heading` + `Paragraph` on yellow (no extra hero card).
2. **Form card** — `@better-auth-ui/heroui` view inside a client island, `className="auth-form"`, **`Card variant="default"`** (white). Do **not** use `variant="secondary"` here — that variant is for inverted marketing panels only.
3. **Library chrome** — hide the library’s duplicate card header via `.auth-form .card__header { display: none }`. Footer cross-links (sign up, forgot password) come from the library — do not duplicate them in the layout.
4. **Theme block** — scoped rules in `globals.css` under `.auth-form`: social OAuth buttons (`.button--tertiary` → secondary-button look), footer links on white (`--foreground`, not `text-accent` yellow).
5. **Copy** — page titles in `auth-content.ts`; form strings via `AuthProvider` + `auth-localization.ts` for DE.

---

## Adding new UI

When building a new page or component pattern:

1. **Compose** from HeroUI primitives + existing marketing components.
2. **Copy** from content modules (`apps/web/app/lib/content/`) — no inline string literals for user-facing text.
3. **Style** by adding scoped rules to `globals.css` `@layer components` (e.g. `.help-section`, `.faq-accordion`). Use a BEM-style block name tied to the component.
4. **Islands** only when SSR cannot handle interactivity (accordion, drawer, map). Defer React Aria hydration with a static SSR fallback if needed (see `FaqAccordion`).
5. **Do not** add `text-brand-*`, `border-*`, `shadow-*`, or hover color classes in TSX.

### Example: scoped component theme

```css
@layer components {
  .my-block .accordion__trigger[aria-expanded="true"] {
    background-color: var(--color-brand-dark);
    color: var(--color-brand-cream);
  }
}
```

---

## Accessibility baseline

- Dark-on-yellow/white/grey for all body text — WCAG AA minimum.
- Keep HeroUI focus rings — do not remove for aesthetics.
- Icon-only buttons need `aria-label`.
- Form fields need visible labels (not placeholder-only).
- Respect `prefers-reduced-motion`.
- Set `<html lang="de|en">` per locale route.

---

## Related docs

| Topic | Location |
|---|---|
| **Agent UI doc index** | [`docs/README.md`](docs/README.md) |
| **This file (tokens & theme rules)** | `design-tokens.md` (repo root) |
| **Machine-readable tokens** | [`docs/DESIGN_TOKENS.json`](docs/DESIGN_TOKENS.json) |
| **Live CSS implementation** | `apps/web/app/styles/globals.css` |
| **Components catalog** | [`docs/COMPONENTS.md`](docs/COMPONENTS.md) |
| **UI patterns** | [`docs/PATTERNS.md`](docs/PATTERNS.md) |
| **Agent hard rules** | `AGENTS.md` § UI & design |
| **Page copy & sections** | [`docs/product/ui/static-pages-content.md`](docs/product/ui/static-pages-content.md) |
| **Component → route map** | [`docs/product/ui/ui-component-map.md`](docs/product/ui/ui-component-map.md) |
| **Navbar / footer** | [`docs/product/ui/app-shell.md`](docs/product/ui/app-shell.md) |
| **i18n keys (checkout, etc.)** | [`docs/product/extras/content-i18n-inventory.md`](docs/product/extras/content-i18n-inventory.md) |
| **Visual identity (DESIGN.md format)** | [`DESIGN.md`](DESIGN.md) |
| **HeroUI skill** | `.agents/skills/heroui-react/SKILL.md` |

Phase scope: [`.dev-plan/IMPLEMENTATION-PLAN.mvp.md`](.dev-plan/IMPLEMENTATION-PLAN.mvp.md).
