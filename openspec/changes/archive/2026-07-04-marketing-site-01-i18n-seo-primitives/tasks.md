## 1. Pre-flight

- [x] 1.1 Read `marketing-site-README.md`, `proposal.md`, `design.md`, and spec deltas end-to-end
- [x] 1.2 Confirm Phase 0 locale routing and renderers are in place (`[locale]/_middleware.ts`, `_renderer.tsx`, `[locale]/_renderer.tsx`)
- [x] 1.3 Read `docs/migration/ui/static-pages-content.md`, `docs/migration/extras/content-i18n-inventory.md`, and `docs/migration/extras/seo-and-metadata.md` §2–3

## 2. Site config and SEO helpers

- [x] 2.1 Create `apps/web/app/lib/site-config.ts` with `getSiteUrl()` reading `SITE_URL` (fallback `http://localhost:3000`) and `absoluteUrl(path)`
- [x] 2.2 Create `apps/web/app/lib/seo.ts` with `buildPageMeta()` returning document title (`{title} — Unveiled Berlin`), description, canonical, hreflang alternates (`de`, `en`, `x-default` → `de`), and OG/Twitter fields

## 3. Content modules

- [x] 3.1 Create `apps/web/app/lib/content/types.ts` with `PageKey` union and shared content shapes
- [x] 3.2 Create DE/EN modules for landing, how-it-works, FAQ, discover, and membership with verbatim copy from `static-pages-content.md`
- [x] 3.3 Add membership `checkout` keys from `content-i18n-inventory.md` with corrected non-rollover perk copy
- [x] 3.4 Create `legal.ts` with placeholder section keys for impressum, privacy, and terms
- [x] 3.5 Create `apps/web/app/lib/content/index.ts` exporting `getPageContent(locale, pageKey)`

## 4. Marketing layout primitives

- [x] 4.1 Create `apps/web/app/components/marketing/PageHero.tsx` — optional eyebrow, uppercase display headline, supporting paragraph in bordered card on yellow background
- [x] 4.2 Create `apps/web/app/components/marketing/SectionCard.tsx` — reusable bordered section panel with neo-brutalist tokens

## 5. Renderer SEO wiring

- [x] 5.1 Extend `apps/web/app/routes/_renderer.tsx` to accept `description`, `canonicalPath`, `ogImage` props and emit `<title>`, description meta, canonical, hreflang, and OG/Twitter tags via `buildPageMeta()`
- [x] 5.2 Extend `apps/web/app/routes/[locale]/_renderer.tsx` to pass SEO props through to root Layout (default `canonicalPath` to request pathname)
- [x] 5.3 Temporarily pass sample meta props through `[locale]/index.tsx` for smoke testing

## 6. Validation

- [x] 6.1 View Source on `/:locale` — confirm `<title>`, `<meta name="description">`, canonical, and three hreflang `<link>` tags in initial HTML
- [x] 6.2 Confirm hreflang alternates and canonical URLs use absolute paths with both locale prefixes
- [x] 6.3 Run `bun run typecheck` — exits 0
- [x] 6.4 Run `bun run lint` — exits 0

## 7. Wrap-up

- [x] 7.1 Mark step 01 done in `marketing-site-README.md` when change is archived
