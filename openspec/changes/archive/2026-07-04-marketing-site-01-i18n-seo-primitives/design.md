## Context

Phase 0 archived the `platform-foundation` spec with locale routing, guest app shell, and a placeholder home at `/:locale`. Phase 1 step 01 lays the shared foundation for eight public marketing/legal routes: typed bilingual copy modules, reusable layout primitives, and server-rendered SEO metadata wired into the HTML renderer.

Current files to extend:
- `apps/web/app/lib/copy.ts` — shell copy only (nav, footer, 404); page-specific copy stays separate
- `apps/web/app/lib/locale.ts` — locale types and path helpers
- `apps/web/app/routes/_renderer.tsx` — bare `<title>` only; no description, canonical, hreflang, or OG tags
- `apps/web/app/routes/[locale]/_renderer.tsx` — passes `title` and `locale` to root Layout; no SEO props yet

Content sources:
- `docs/migration/ui/static-pages-content.md` — verbatim DE/EN marketing copy
- `docs/migration/extras/content-i18n-inventory.md` — structured keys (membership/checkout)
- `docs/migration/extras/seo-and-metadata.md` §2–3 — per-page metadata, canonical, hreflang

Constraints from `AGENTS.md`:
- Copy MUST match spec docs verbatim; no paraphrasing.
- SSR-only metadata — no client-side `document.title` injection.
- Yellow page background and neo-brutalist tokens on all marketing components.
- Business logic stays out of route files beyond rendering.

## Goals / Non-Goals

**Goals:**

- Typed DE/EN content modules for landing, how-it-works, FAQ, discover, membership, and placeholder legal section keys.
- `getPageContent(locale, pageKey)` (or equivalent) export for route consumption in steps 02–04.
- `PageHero` and `SectionCard` marketing layout primitives matching bordered-card + eyebrow + display-headline pattern.
- `buildPageMeta()` helper producing title suffix `{Page title} — Unveiled Berlin`, canonical, hreflang (`de`, `en`, `x-default` → `de`), and OG/Twitter fields.
- `SeoHead` output in initial SSR HTML via `_renderer.tsx`.
- Extended `c.render()` metadata contract: `description`, `canonicalPath`, `ogImage`.
- `SITE_URL` env var with dev fallback for absolute URLs.
- Smoke-test meta output on existing `/:locale` placeholder route.
- `bun run typecheck` and `bun run lint` pass.

**Non-Goals:**

- Individual route pages (steps 02–04).
- Cookie banner, robots.txt, sitemap.xml (step 05).
- JSON-LD structured data (steps 02–03).
- Auth, database, Stripe, `@unveiled/ui` EventCard package (Phase 4).

## Decisions

### 1. Content module layout — `app/lib/content/`

Organize page copy under `apps/web/app/lib/content/` with one module per page (or grouped by domain) and a barrel index:

```
app/lib/content/
├── index.ts           # getPageContent(locale, pageKey)
├── types.ts           # PageKey union, shared content shapes
├── landing.ts         # de/en landing copy
├── how-it-works.ts
├── faq.ts
├── discover.ts
├── membership.ts      # includes checkout keys from content-i18n-inventory
└── legal.ts           # placeholder section keys for impressum/privacy/terms
```

Each module exports a `Record<Locale, PageContent>` object. The index maps `pageKey` → module.

**Alternative considered:** co-locate copy in route files. Rejected — violates separation; steps 02–04 need shared access without duplication.

**Alternative considered:** `app/content/` at routes level. Rejected — helpers belong in `lib/` alongside `copy.ts` and `locale.ts`.

### 2. Shell vs page copy split

Keep existing `copy.ts` for navbar, footer, and shell strings only. All marketing page body copy lives in `lib/content/*`.

**Rationale:** Phase 0 shell copy is already wired into Navbar/Footer; page modules are consumed by route pages in later steps.

### 3. Membership perk copy correction

Use corrected non-rollover wording from `content-i18n-inventory.md` for membership perks — not the old "Credits roll over" line from legacy `perks[2]`.

### 4. SEO helper — `app/lib/seo.ts`

```ts
export type PageMetaInput = {
  locale: Locale
  pathname: string        // e.g. '/de/faq'
  title: string           // page-specific portion only
  description: string
  ogImage?: string        // absolute URL; fallback to site default in step 05
}

export type PageMeta = {
  documentTitle: string   // '{title} — Unveiled Berlin'
  description: string
  canonical: string       // absolute URL for current locale
  alternates: { hreflang: string; href: string }[]
  openGraph: Record<string, string>
  twitter: Record<string, string>
}

export function buildPageMeta(input: PageMetaInput): PageMeta
```

Implementation rules from `seo-and-metadata.md`:
- Title pattern: `{Page-specific title} — Unveiled Berlin`
- Canonical points at the current locale URL (self-reference), not cross-locale
- Hreflang: `de`, `en`, and `x-default` (→ `de`) with absolute URLs
- Derive alternate locale path by swapping locale segment via existing `switchLocalePath`
- OG: `og:title`, `og:description`, `og:image`, `og:type` (`website`), `og:url`
- Twitter: `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`

### 5. Site config — `app/lib/site-config.ts`

```ts
export function getSiteUrl(): string {
  return process.env.SITE_URL ?? 'http://localhost:3000'
}

export function absoluteUrl(path: string): string {
  return new URL(path, getSiteUrl()).href
}
```

Strip trailing slash from `SITE_URL` if present. Document env var in step 05 `DEPLOYMENT.md`; dev fallback sufficient for step 01.

### 6. SeoHead component — inline in root renderer

Render SEO tags directly in `app/routes/_renderer.tsx` rather than a separate island — all SSR, no hydration.

Extend renderer props:

```tsx
type RendererProps = {
  title?: string
  locale?: Locale
  robots?: string
  description?: string
  canonicalPath?: string   // locale-prefixed path, e.g. '/de/faq'
  ogImage?: string
}
```

When `description` and `canonicalPath` are provided, call `buildPageMeta()` and emit:
- `<title>` (full document title from helper)
- `<meta name="description">`
- `<link rel="canonical">`
- `<link rel="alternate" hreflang="...">` for each alternate
- OG and Twitter meta tags

When only `title` is provided (existing behavior), render simple `<title>` or fallback "Unveiled Berlin".

**Alternative considered:** separate `SeoHead.tsx` component imported into renderer. Acceptable — either pattern works; component extraction improves testability if meta output grows.

### 7. Locale renderer pass-through — `[locale]/_renderer.tsx`

Nested renderer reads pathname from request, accepts SEO props from `c.render()`, and forwards to root `<Layout>`:

```tsx
<Layout
  locale={resolvedLocale}
  robots={robots}
  title={title}
  description={description}
  canonicalPath={canonicalPath ?? pathname}
  ogImage={ogImage}
>
```

Default `canonicalPath` to current request pathname when not explicitly set.

### 8. Marketing layout primitives — `app/components/marketing/`

**PageHero:**
- Optional eyebrow (small caps / label styling)
- Display headline: uppercase, `-0.05em` tracking, `line-height: 0.9` per `design-tokens.md`
- Supporting paragraph
- Wrapped in bordered white/cream card on yellow page background (`.unveiled-shadow`, thick dark border)

**SectionCard:**
- Reusable bordered section panel for body content blocks
- Accepts `children`, optional `title`, optional `className`
- Same neo-brutalist token usage as PageHero container

Both are SSR-only React components — no client islands.

### 9. Smoke test on placeholder home

Temporarily pass sample meta through `[locale]/index.tsx`:

```ts
return c.render(<HomePage locale={locale} />, {
  title: 'Unveiled Berlin',
  description: '…sample DE/EN description…',
  canonicalPath: pathname,
})
```

Verify View Source shows full head tags. Remove or replace with real landing meta in step 02.

## Risks / Trade-offs

- **[Large content modules]** → Split by page file; types in `types.ts` keep modules manageable. Full verbatim copy is intentional per spec.
- **[Legal body copy missing from migration docs]** → Placeholder section keys only in step 01; structure wired, content filled in step 04.
- **[OG fallback image not yet in repo]** → `ogImage` optional; step 05 adds site-wide fallback asset. Meta tags still emit with placeholder or omit image until asset lands.
- **[SITE_URL unset in dev]** → `localhost:3000` fallback; staging/production must set env before step 05 sitemap/canonical go live.
- **[Renderer prop type extension]** → HonoX `c.render()` second arg is untyped; document expected keys in helper types to avoid drift.

## Migration Plan

1. Add `site-config.ts` and `seo.ts` helpers.
2. Add content modules and `getPageContent` index.
3. Add `PageHero` and `SectionCard` components.
4. Extend root and locale renderers with SEO head output.
5. Smoke-test meta on `/:locale` placeholder.
6. Run `bun run typecheck` and `bun run lint`.
7. No rollback complexity — revert branch if validation fails.

## Open Questions

- None blocking — iteration doc resolves scope. `SeoHead` as separate component vs inline in renderer is implementer choice; behavior must match spec scenarios.
