## Why

Phase 1 steps 01–03 delivered content modules, SEO primitives, landing, how-it-works, FAQ, and membership — but `/discover` and the three legal routes (`/impressum`, `/privacy`, `/terms`) still 404. Footer links from Phase 0 already target these paths; this step makes them real SSR pages. The discover page is the marketing centerpiece — a static preview of the product experience with mock events and partners — and legal pages close the compliance gap required for a German consumer product before launch.

## What Changes

- Add `/:locale/discover` route with all five sections from `static-pages-content.md`: hero panel with stat tiles, three value proposition cards, live event preview grid (mock data), membership categories grid (01–06), partner venues grid, and "missing venue" callout with mailto.
- Add `apps/web/app/lib/mock/discover-data.ts` with hardcoded DE/EN-neutral mock events (4–6) and partner venues (up to 8), plus static hero stat numbers — no database queries.
- Add `EventCardPreview` component implementing guest-state CTA only ("See details" / "Mehr sehen") — never "Waitlist" or "Book Now" regardless of mock capacity.
- Add legal routes `/:locale/impressum`, `/:locale/privacy`, `/:locale/terms` rendering structured placeholder content from existing `legalContent` module (marked for legal counsel review).
- Add per-page SEO metadata on all four new routes (indexable per `seo-and-metadata.md` §1).
- Navbar active state for `/discover`.
- **Out of scope:** Real event catalog, R2 image pipeline, functional event detail/booking links (Phase 4–6); cookie banner, robots.txt, sitemap (step 05); `@unveiled/ui` package (Phase 4).

## Capabilities

### New Capabilities

- _(none — discover and legal requirements extend the existing `static-marketing-pages` capability)_

### Modified Capabilities

- `static-marketing-pages`: Add requirements for discover marketing preview page (hero, value props, mock event grid with guest CTA, categories, partners, callout) and legal pages (Impressum, Privacy, Terms with DE/EN structured content linked from footer).

## Impact

- **New files:** `apps/web/app/lib/mock/discover-data.ts`, `apps/web/app/components/marketing/EventCardPreview.tsx`, `apps/web/app/components/marketing/DiscoverPage.tsx` (optional page component), `apps/web/app/components/marketing/LegalPage.tsx` (optional shared legal layout), `apps/web/app/routes/[locale]/discover.tsx`, `apps/web/app/routes/[locale]/impressum.tsx`, `apps/web/app/routes/[locale]/privacy.tsx`, `apps/web/app/routes/[locale]/terms.tsx`.
- **Modified files:** `apps/web/app/lib/seo.ts` (discover + legal page meta helpers).
- **Existing content modules reused:** `discoverContent` and `legalContent` from step 01 — no new copy literals in route files.
- **Dependencies:** no new npm packages — uses existing HeroUI primitives, content modules, and SEO helpers.
- **Downstream:** `marketing-site-05-cookie-seo-assets-release` adds cookie banner, robots.txt, sitemap; Phase 4 replaces mock data with real catalog and `@unveiled/ui` EventCard.
- **Branch:** `phase-1-marketing-04` or parent Phase 1 branch per iteration convention.
