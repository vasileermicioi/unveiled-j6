## 1. Setup

- [x] 1.1 Read `docs/product/CHARTER.md` end-to-end (Locked decisions, target tree, migration→product mapping, parking lot)
- [x] 1.2 List migration files to port vs rewrite vs post-MVP park for this step’s scope (`vision-and-domains`, sitemap, `ui/*`, schema-overview, listed `extras/*`)
- [x] 1.3 Amend `docs/product/CHARTER.md` target tree to include `ui/design-system.md` if missing (prefer charter amendment over silent drift)

## 2. README and vision

- [x] 2.1 Rewrite `docs/product/README.md` with full how-to-read order: foundation docs (this step), features/journeys/BDD in step 03, plan in 04, SoT activation in 05; declare folder as future SoT
- [x] 2.2 Write `docs/product/product/vision-and-domains.md` — MVP vision, bounded contexts, guest/member/admin personas; partner domain marked post-MVP; v1 non-goals

## 3. Sitemap

- [x] 3.1 Write `docs/product/sitemap/sitemap.md` — Discover = `/:locale`; guest vs member nav; member `/events`, `/events/map`, `/saved`
- [x] 3.2 In sitemap: `/events/:id` Auth empty/`—` (public); book/waitlist gated; explicit Discover CTAs to detail and signup/login → `/events`
- [x] 3.3 Include MVP admin routes; put `/partner/*` only in a post-MVP appendix (not MVP tables)

## 4. UI docs

- [x] 4.1 Write `docs/product/ui/design-tokens.md` — Uber reskin: `#FAFF86`, near-zero radius, no shadows, Work Sans, theme-only styling
- [x] 4.2 Write **new** `docs/product/ui/design-system.md` — `@unveiled/ui` is DS; Ladle home; Theme Overview story requirements; `apps/web` page compositions only when route-specific; ban raw HTML; story ownership rules
- [x] 4.3 Rewrite `docs/product/ui/ui-component-map.md` for MVP (HeroUI names; Select only — no Radio/Checkbox; DS ownership pointers)
- [x] 4.4 Rewrite `docs/product/ui/app-shell.md` — guest vs member nav; Discover home; Events link for members; Discover→Events CTAs
- [x] 4.5 Rewrite `docs/product/ui/static-pages-content.md` and `docs/product/ui/assets-inventory.md` for MVP routes/copy; Discover↔Events links corrected

## 5. Database schema overview

- [x] 5.1 Write `docs/product/database/schema-overview.md` — complete MVP schema: users, partners-as-venues, events, images, saved_events, subscriptions, bookings, credit_ledger, waitlist as needed
- [x] 5.2 Specify relationships/constraints; no TBD on booking/credits fields; six JPEG variants (not WebP); label partner-portal-only columns post-MVP

## 6. Extras

- [x] 6.1 Write `docs/product/extras/seo-and-metadata.md` — public bookable `/events/:id` indexable; member `/events` (and map/saved) `noindex`; Discover indexable; align with sitemap
- [x] 6.2 Write `docs/product/extras/authorization-matrix.md` — guest/member/admin for MVP routes (guest can read event detail; member feed gated); post-MVP partner section
- [x] 6.3 Port/rewrite `image-uploads.md`, `pagination-and-search.md`, `integrations-and-config.md`, `content-i18n-inventory.md` under `docs/product/extras/` (trim partner-only MVP env requirements)
- [x] 6.4 Port/annotate `gaps-and-decisions.md` with an “MVP rewrite 2026-07” section pointing at the charter; do not reopen unrelated settled decisions

## 7. Validation and cleanup

- [x] 7.1 Run `find docs/product -type f | sort` — confirm foundation files present (no `features/` required yet)
- [x] 7.2 Run `rg -n "Auth.*USER|/events/:id" docs/product/sitemap/sitemap.md` — event detail public (Auth empty/`—`, not USER-required)
- [x] 7.3 Run `rg -n "Discover|Events|Theme Overview|@unveiled/ui" docs/product/ui/design-system.md docs/product/sitemap/sitemap.md`
- [x] 7.4 Run `rg -n "subscriptions|bookings|credit_ledger|saved_events" docs/product/database/schema-overview.md`
- [x] 7.5 Run `rg -n "post-MVP|PARTNER" docs/product/sitemap/sitemap.md docs/product/product/vision-and-domains.md`
- [x] 7.6 Cross-check every MVP sitemap route against SEO indexability table and auth matrix
- [x] 7.7 Mark step 02 done in `.dev-plan/current-iteration/mvp-spec-rewrite-parent-guide.md`; note any further charter amendments needed
