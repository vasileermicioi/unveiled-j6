## Why

Phase 1 step 01 delivered typed bilingual content modules, marketing layout primitives, and server-rendered SEO metadata — but the locale home is still the Phase 0 placeholder (logo + single discover CTA), and `/how-it-works` does not exist. This step ships the two highest-visibility marketing routes with investor-demo-quality content, per-page SEO, and Organization JSON-LD on the landing page — the first real public-facing pages beyond the shell.

## What Changes

- Replace `apps/web/app/routes/[locale]/index.tsx` with the full landing page from `static-pages-content.md`: hero headline "Unveiled Berlin", localized subheadline, discover/how-it-works CTAs, trust microcopy, conversion card linking to `/signup` and `/login` (not an inline auth form), and three English trust badges identical in both locales.
- Add `apps/web/app/routes/[locale]/how-it-works/index.tsx`: hero panel, three-step explainer grid, and dark "Why this works" inverted panel with three value tiles — verbatim copy from content modules.
- Wire per-page SEO metadata on both routes via existing `buildPageMeta()` helper (unique title + description per `seo-and-metadata.md`).
- Add `schema.org/Organization` JSON-LD on the landing page in server-rendered HTML (name, url, email, address placeholder aligned with future Impressum fields).
- Extend landing content module with conversion-card copy (login/signup CTA labels) if not already present.
- Update `GuestNavbar` active-route highlighting for home and how-it-works paths.
- **Out of scope:** FAQ, discover, membership, legal pages; auth implementation (Phase 2); cookie banner, sitemap (step 05); venue check-in banner (Phase 6+); Guest Explorer / Admin Access dead-ends.

## Capabilities

### New Capabilities

- _(none — landing and how-it-works requirements extend the existing `static-marketing-pages` capability)_

### Modified Capabilities

- `static-marketing-pages`: Add requirements for landing page (hero, CTAs, conversion card, trust badges), how-it-works page (hero, 3-step grid, value panel), and Organization JSON-LD on landing.

## Impact

- **New files:** `apps/web/app/routes/[locale]/how-it-works/index.tsx`, optional `apps/web/app/lib/seo/organization-jsonld.ts` (or inline helper), landing page subcomponents if extracted.
- **Modified files:** `apps/web/app/routes/[locale]/index.tsx`, `apps/web/app/lib/content/landing.ts` (conversion card keys), `apps/web/app/lib/content/types.ts`, `apps/web/app/components/GuestNavbar.tsx` (and/or `GuestNavbarMenu.tsx` if mobile nav needs home highlight).
- **Dependencies:** no new npm packages — uses existing HeroUI, `PageHero`, `SectionCard`, content modules, and SEO helper from step 01.
- **Downstream:** `marketing-site-03-faq-and-membership` builds on the same content/SEO patterns established here.
- **Branch:** `phase-1-marketing-02` or parent Phase 1 branch per iteration convention.
