# Design Architecture

How the Unveiled Berlin web app is structured for UI development.

## Stack

| Layer | Technology | Location |
|---|---|---|
| Framework | HonoX + React 19 SSR | `apps/web/` |
| UI library | HeroUI v3 (`@heroui/react`) | Components + theme |
| Styling | Tailwind v4 + `@heroui/styles` | `apps/web/app/styles/globals.css` |
| Hydration | HonoX islands | `apps/web/app/islands/` |
| i18n | URL locale prefix (`/de`, `/en`) | `apps/web/app/lib/locale.ts` |

Single deployable app — no separate admin/partner apps. Role-based routes in one codebase.

## Directory layout (UI-relevant)

```text
apps/web/app/
├── routes/                    # HonoX file-based routes (thin — wire data + c.render)
│   ├── _renderer.tsx          # HTML shell, SEO head, globals.css
│   ├── index.tsx              # / → 302 locale redirect
│   └── [locale]/
│       ├── _renderer.tsx      # AppShell wrapper
│       ├── _middleware.tsx    # Locale validation
│       ├── index.tsx          # Discover (home)
│       ├── how-it-works.tsx
│       ├── faq.tsx
│       ├── membership.tsx
│       └── [...slug].tsx      # 404 catch-all
├── components/                # SSR React components
│   ├── AppShell.tsx           # Navbar + main + footer
│   ├── AppNavbar.tsx
│   ├── GuestFooter.tsx
│   ├── Logo.tsx, NavLink.tsx
│   ├── NotFoundPage.tsx
│   └── marketing/             # Page-level marketing compositions
├── islands/                   # Client-hydrated components only
│   ├── FaqAccordion.tsx
│   └── AppNavbarMenu.tsx
├── lib/
│   ├── content/               # Page body copy (typed, DE/EN)
│   ├── copy.ts                # Shell chrome copy (nav, footer)
│   ├── locale.ts              # Routing helpers
│   └── seo.ts                 # Meta + JSON-LD builders
└── styles/globals.css         # Theme tokens + component overrides
```

Business logic for future phases lives in `packages/*` — never in route files.

## Rendering model

```text
Request
  → route handler (createRoute)
  → fetch data (content modules, DB in later phases)
  → c.render(<PageComponent />, { locale, title, description, canonicalPath })
  → [locale]/_renderer wraps in AppShell
  → _renderer emits HTML head (SEO from lib/seo.ts)
  → islands hydrate on client (accordion, drawer, map)
```

### Route responsibilities

Routes should **only**:

1. Parse `locale` from params
2. Load data (`getPageContent`, DB queries, session in later phases)
3. Build SEO props (`faqPageMeta`, etc.)
4. Return `c.render(<Component />, metaProps)`

All layout and markup belong in `components/`.

## Content architecture

Two copy systems — do not mix them:

| System | File | Contains |
|---|---|---|
| **Shell copy** | `lib/copy.ts` | Nav labels, footer, CTAs, 404 strings |
| **Page copy** | `lib/content/*.ts` | Full page body text per `PageKey` |

Access page copy via `getPageContent(locale, "faq")` — never hardcode user-facing strings in routes or components.

## Locale model

- All pages under `/:locale/*` where locale is `de` or `en`
- `/` redirects 302 to `/de` or `/en` via `Accept-Language`
- Language toggle uses `switchLocalePath()` — same path, swapped prefix
- Links use `localizedPath(locale, "faq")` → `/de/faq`

## Mutation model (future phases)

**SSR-only mutations.** Every create/update/delete is:

1. A dedicated route page with a form
2. Submitted via HTTP POST to a handler route
3. Redirect on success — **no client-side modals** for mutations

Booking, admin CRUD, profile edits, onboarding steps all follow this. See `UX_RULES.md` and `examples/`.

## Package rollout (shared UI)

| Phase | Package | UI impact |
|---|---|---|
| 4 | `@unveiled/ui` | `EventCard`, catalog components |
| 2 | `@better-auth-ui/heroui` | Login/signup pages |
| 4+ | `@unveiled/images` | Image upload + srcset |

Packages never import from `apps/web`. App imports from packages.

## SEO architecture

Public pages pass metadata to `c.render()`:

- `title`, `description`, `canonicalPath`, optional `ogImage`, `robots`
- Renderer calls `buildPageMeta()` → canonical, hreflang, Open Graph
- JSON-LD injected in route JSX as `<script type="application/ld+json">` (allowed exception)

See `PATTERNS.md` § SEO.

## Related docs

- [`../DESIGN.md`](../DESIGN.md) — visual identity (Google Labs DESIGN.md format)
- [`../design-tokens.md`](../design-tokens.md) — visual rules narrative (root mirror)
- [`product/ui/design-tokens.md`](product/ui/design-tokens.md) — product SoT token narrative
- [`COMPONENTS.md`](COMPONENTS.md) — what exists today
- [`../AGENTS.md`](../AGENTS.md) — agent hard rules and phase scope
- [`product/sitemap/sitemap.md`](product/sitemap/sitemap.md) — full MVP route map
