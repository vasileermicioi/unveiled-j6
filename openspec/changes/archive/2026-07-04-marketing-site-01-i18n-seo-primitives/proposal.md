## Why

Phase 0 delivered locale routing, the guest app shell, and a minimal placeholder home page, but Phase 1 marketing routes still lack the shared foundation they need: typed bilingual copy modules, reusable layout primitives, and server-rendered SEO metadata in the HTML head. Without this step, each subsequent marketing page would reinvent i18n lookups and meta tag wiring, and crawlers would continue to see only the Phase 0 placeholder with no per-page title, description, canonical, or hreflang alternates.

## What Changes

- Add typed DE/EN content modules under `apps/web/app/lib/content/` with verbatim copy from `static-pages-content.md` and relevant `content-i18n-inventory.md` keys (landing, how-it-works, FAQ, discover, membership, placeholder legal section keys).
- Add `getPageContent(locale, pageKey)` (or equivalent) export from a content index module.
- Add shared marketing layout components: `PageHero` (eyebrow + display headline + supporting paragraph) and `SectionCard` (bordered section panel) under `apps/web/app/components/marketing/`.
- Add `apps/web/app/lib/seo.ts` with `buildPageMeta()` returning title suffix pattern `{Page title} — Unveiled Berlin`, canonical URL, hreflang alternates (`de`, `en`, `x-default` → `de`), and Open Graph / Twitter Card fields.
- Add `apps/web/app/lib/site-config.ts` reading `SITE_URL` (fallback `http://localhost:3000` for dev) for absolute URLs.
- Add `SeoHead` component (or inline in renderer) consumed by `_renderer.tsx` to emit `<title>`, description meta, canonical, hreflang, and OG/Twitter tags server-side.
- Extend `c.render()` metadata contract in `[locale]/_renderer.tsx` to accept `description`, `canonicalPath`, `ogImage`, and pass through to root `_renderer.tsx`.
- Smoke-test meta output on the existing `/:locale` placeholder route.
- **Out of scope:** individual route pages (steps 02–04), cookie banner, robots.txt, sitemap.xml (step 05), JSON-LD (steps 02–03), auth, database, Stripe, `@unveiled/ui` EventCard.

## Capabilities

### New Capabilities

- `static-marketing-pages`: Phase 1 capability tracking public marketing page behavior; step 01 establishes the content and SEO primitives required by subsequent marketing route steps.

### Modified Capabilities

- `platform-foundation`: Add requirements for marketing page content modules (verbatim DE/EN copy), server-rendered SEO metadata helper (title pattern, canonical, hreflang, OG/Twitter), and shared marketing layout primitives (`PageHero`, `SectionCard`).

## Impact

- **New files:** `apps/web/app/lib/content/*`, `apps/web/app/lib/seo.ts`, `apps/web/app/lib/site-config.ts`, `apps/web/app/components/marketing/PageHero.tsx`, `SectionCard.tsx`, `apps/web/app/components/SeoHead.tsx` (if not inlined).
- **Modified files:** `apps/web/app/routes/_renderer.tsx`, `apps/web/app/routes/[locale]/_renderer.tsx`, `apps/web/app/routes/[locale]/index.tsx` (temporary meta smoke test).
- **Dependencies:** no new npm packages expected — uses existing HeroUI tokens and SSR renderer.
- **Environment:** `SITE_URL` env var introduced (documented in step 05 `DEPLOYMENT.md`; dev fallback for local work).
- **Downstream:** `marketing-site-02-landing-and-how-it-works` consumes content modules, layout primitives, and SEO helper for first real marketing pages.
- **Branch:** `phase-1-marketing-01` or parent Phase 1 branch per iteration convention.
