## Context

Phase 0 step 03 delivered `@unveiled/web` with HeroUI v3, Tailwind v4, brand tokens, and a theme-check scaffold at `/`. Step 04 replaces that scaffold with the URL-based locale model and guest app shell so staging demos match the product spec before Phase 1 marketing pages exist.

Current files to extend:
- `apps/web/app/routes/index.tsx` — theme-check Card/Button (becomes redirect-only)
- `apps/web/app/routes/_renderer.tsx` — bare HTML shell, static `lang="en"`
- `apps/web/app/client.ts` — stub entry (Vite client input already configured)

Constraints from `AGENTS.md`, `sitemap.md`, and `app-shell.md`:
- All pages under `/:locale/*`; `/` → 302 based on `Accept-Language` (fallback `de`).
- Language switch navigates to same path under other locale prefix — no client-side locale state.
- Guest shell only — no credits badge, profile, logout, or signed-in nav variants.
- Footer copy verbatim DE/EN; legal links present (routes may 404 until Phase 1).
- Shell components live in `apps/web/app/components/` for now (extract to `@unveiled/ui` in Phase 4).
- Logo SVGs copied in step 05 — Logo component references expected paths; text fallback acceptable until assets land.

HonoX conventions (alpha, zerover semver):
- Dynamic segments: `[locale]/index.tsx`
- Nested layout: `[locale]/_renderer.tsx` (not `_layout.tsx` — iteration doc name is conceptual)
- Directory middleware: `[locale]/_middleware.ts`
- Not found: `_404.tsx` at `app/routes/`

## Goals / Non-Goals

**Goals:**

- `/` returns 302 to `/de` or `/en` via `Accept-Language` parsing (fallback `de`).
- `[locale]` route group validates `locale ∈ {de, en}`; invalid → 404.
- Guest shell (sticky Navbar + Footer) wraps all locale pages.
- Placeholder home at `/:locale` with Logo + CTA to `/:locale/discover`.
- Language toggle uses `<a href>` navigation to swapped locale path.
- 404 page with `noindex` meta; shell where applicable.
- `<html lang>` reflects current locale.
- `bun run dev`, `build`, `typecheck`, `lint` pass.

**Non-Goals:**

- Marketing page content (Phase 1).
- Cookie banner (Phase 1).
- Auth/session navbar variants (Phase 2+).
- SEO hreflang/canonical (Phase 1).
- Copying logo SVGs and favicon (step 05).
- Extracting shell to `@unveiled/ui` (Phase 4).

## Decisions

### 1. HonoX route layout — `[locale]/_renderer.tsx` + `_middleware.ts`

Map the iteration doc's `_layout.tsx` to HonoX's nested renderer pattern:

```
app/routes/
├── index.tsx              # GET / → 302 redirect
├── _renderer.tsx          # root HTML shell (lang, CSS, client script)
├── _404.tsx               # not-found handler
└── [locale]/
    ├── _middleware.ts     # validate locale param; set c.set('locale', locale)
    ├── _renderer.tsx      # wrap children in AppShell (Navbar + Footer)
    └── index.tsx          # placeholder home
```

`[locale]/_renderer.tsx` uses `@hono/react-renderer` nested `<Layout>` pattern to wrap page content in shell components while inheriting root HTML from `app/routes/_renderer.tsx`.

`[locale]/_middleware.ts` rejects invalid locale segments early:

```ts
const LOCALES = ['de', 'en'] as const
export default createRoute(async (c, next) => {
  const locale = c.req.param('locale')
  if (!LOCALES.includes(locale as Locale)) {
    return c.notFound()
  }
  c.set('locale', locale)
  await next()
})
```

**Alternative considered:** validate locale inline in each route. Rejected — duplicated logic; middleware runs once for all child routes.

### 2. Locale helpers — `app/lib/locale.ts`

Centralize locale types and path utilities (not route middleware — helpers are pure functions):

```ts
export type Locale = 'de' | 'en'
export const LOCALES: Locale[] = ['de', 'en']
export const DEFAULT_LOCALE: Locale = 'de'

export function parseAcceptLanguage(header: string | undefined): Locale
export function switchLocalePath(pathname: string, target: Locale): string
export function localizedPath(locale: Locale, segment: string): string
export function isActiveNavPath(currentPath: string, navPath: string): boolean
```

`parseAcceptLanguage`: scan `Accept-Language` for `en` or `de` q-values; fallback `de`. Simple prefix/q-value parse — no full BCP47 library needed for two locales.

`switchLocalePath('/de/discover', 'en')` → `/en/discover`; preserves path suffix after locale segment.

Copy strings (nav labels, footer, CTA) in a `copy.ts` map keyed by locale — keeps components declarative.

**Alternative considered:** `app/middleware/locale.ts` as Hono middleware module. Acceptable but IMPLEMENTATION-PLAN lists it as middleware; split helpers (`lib/locale.ts`) from route middleware (`[locale]/_middleware.ts`) for clarity.

### 3. Root redirect — `index.tsx`

Replace scaffold render with redirect:

```ts
export default createRoute((c) => {
  const locale = parseAcceptLanguage(c.req.header('Accept-Language'))
  return c.redirect(`/${locale}`, 302)
})
```

No HTML body — pure redirect response.

### 4. Guest Navbar — SSR links + client island for mobile drawer

HeroUI `Navbar` menu toggle requires client interactivity for the hamburger drawer. Minimal island approach:

- `app/components/GuestNavbar.tsx` — SSR wrapper; renders desktop nav links as `<a>` elements; embeds island for mobile menu.
- `app/islands/GuestNavbarMenu.tsx` — client island with `'use client'`; HeroUI Navbar + NavbarMenu for mobile drawer only.

Desktop nav (`lg+`): plain SSR anchor links with active-state classes (`bg-accent border-2 border-brand-dark`).
Language toggle: two SSR `<a href={switchLocalePath(...)}>` links styled as DE | EN pill — no React state.
Guest CTA "Mitglied werden" / "Become a member" → `/:locale/membership`; hidden on locale root (`/:locale` exactly) per `app-shell.md`.

Enable client hydration in root `_renderer.tsx`:

```tsx
import { Script } from 'honox/server'
// ...
<Script src="/app/client.ts" />
```

Existing Vite config already lists `/app/client.ts` as client input.

**Alternative considered:** CSS-only mobile menu (`<details>`/checkbox hack) to avoid islands. Rejected — spec and `app-shell.md` explicitly call for HeroUI NavbarMenu drawer; island scope is minimal (one component).

### 5. Footer — SSR-only component

`app/components/GuestFooter.tsx` — pure SSR, no island. Three-column desktop layout (`max-w-7xl`, brand left wide, Navigation + Contact + Legal clustered right); stacks on mobile.

Copy verbatim from `app-shell.md`:
- Brand eyebrow, tagline, body paragraph
- Navigation links: Discover, How it works, Membership, FAQ
- Legal links: Impressum, Datenschutz/Privacy, AGB/Terms
- Contact: support@unveiled.berlin mailto, Berlin location line

All links use `localizedPath(locale, segment)`.

### 6. Logo component — `app/components/Logo.tsx`

Props: `tone?: 'black' | 'white' | 'yellow'`, `className?: string`.

Renders `<img src="/logos/unveiled-logo-{tone}.svg" alt="Unveiled" className="h-[1.1em] w-auto" />`.

If SVG files absent (step 05 not merged), render styled text fallback "UNVEILED" so layout is testable without asset 404 blocking dev.

Default tone: `black`.

### 7. App shell composition — `AppShell.tsx`

```tsx
export function AppShell({ locale, pathname, children }: Props) {
  return (
    <>
      <GuestNavbar locale={locale} pathname={pathname} />
      <main className="pt-16 md:pt-20">{children}</main>
      <GuestFooter locale={locale} />
    </>
  )
}
```

Navbar height offset: `pt-16 md:pt-20` per `design-tokens.md` navbar height tokens.

`[locale]/_renderer.tsx` reads locale from context and current pathname from request to pass active-state props.

### 8. 404 page — `_404.tsx`

HonoX custom not-found at `app/routes/_404.tsx`:

```ts
const handler: NotFoundHandler = (c) => {
  return c.render(<NotFoundPage />, {
    title: 'Not Found',
    robots: 'noindex',
  })
}
```

Extend root `_renderer.tsx` to render `<meta name="robots" content="noindex">` when `robots` prop is set.

404 content: brief DE/EN message (detect locale from path prefix if present, else `de`); include shell when locale is valid, bare message otherwise.

Return HTTP 404 status via `c.notFound()` or equivalent HonoX pattern.

### 9. Placeholder home — `[locale]/index.tsx`

Minimal centered layout:
- `<Logo tone="black" />` at display scale
- Primary `<Button asChild>` or styled link: "Entdecken" / "Discover" → `/:locale/discover`

Remove step 03 theme-check Card from root `/` (redirect replaces it).

### 10. `_renderer.tsx` lang attribute

Root renderer accepts `locale` prop forwarded from nested renderer:

```tsx
<html lang={locale ?? 'de'}>
```

Nested `[locale]/_renderer.tsx` passes `locale` to `<Layout locale={locale}>`.

## Risks / Trade-offs

- **[HonoX alpha API drift]** → Pin honox version in `apps/web/package.json`; follow README patterns exactly.
- **[Mobile drawer requires client island]** → Minimal scope: one island file; language toggle stays SSR navigation per spec.
- **[Nav/footer links 404 until Phase 1]** → Expected; links must exist in shell for layout verification.
- **[Logo SVGs missing until step 05]** → Text fallback in Logo component; step 05 replaces with real assets.
- **[Invalid locale on nested 404]** → Middleware rejects before shell; `_404.tsx` handles unmatched routes under valid locale with full shell.
- **[Accept-Language edge cases]** → Two-locale simple parser sufficient for Phase 0; no full i18n negotiation library.

## Migration Plan

1. Add locale helpers and shell components.
2. Add `[locale]/_middleware.ts`, `[locale]/_renderer.tsx`, `[locale]/index.tsx`.
3. Replace `index.tsx` redirect; add `_404.tsx`.
4. Wire client island + Script in `_renderer.tsx`.
5. Remove scaffold theme-check from old `/` behavior.
6. Verify with curl checks from iteration doc.
7. No rollback complexity — revert branch if staging fails.

## Open Questions

- None blocking — iteration doc and spec delta resolve scope. Legal column layout: four columns (brand + nav + legal + contact) vs three with legal folded into nav — use four stacked groups on mobile, brand wide left + three narrow columns right on desktop per `app-shell.md` Column 4 decision.
