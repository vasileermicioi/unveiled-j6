## Why

Step 01 shipped `featured_partners` and `@unveiled/db` helpers, but admins still cannot curate that list and Discover’s Partner venues marquee still uses `listPartners({ limit: 8 })`. Without admin SSR surfaces and a Discover swap, the curated store stays unused and guests do not see the intended partner set.

## What Changes

- Rename the existing admin tab label for `/admin/featured*` from **Featured** / **Empfohlen** to **Featured events** / **Empfohlene Events** (routes unchanged).
- Add admin tab **Featured partners** (after Featured events) with path helpers, `inferAdminTab`, `AdminTabNav` + Ladle story, and DE/EN copy.
- Add ADMIN-guarded SSR routes under `/:locale/admin/featured-partners*`:
  - list curated partners ordered by `sort_order`
  - search-and-add (`GET ?q=` + `POST` add → redirect list)
  - remove confirm (`GET` + `POST` → redirect list; partner venue kept)
- Mirror featured-events admin components under `apps/web/app/components/admin/`.
- Wire Discover to `listFeaturedPartners(db, { limit: 8 })`; empty curated list continues to hide Partner venues.
- Demo seed: after creating partners, feature a small subset (not all).
- **No** product-docs/e2e matrix (step 03), partner portal, public partner pages, clickable tiles, drag-and-drop reorder, or `/admin/featured` URL renames.

## Capabilities

### New Capabilities

- `admin-featured-partners`: ADMIN Featured partners tab and SSR list/add/remove flows for curated `featured_partners` membership (form POST only); admin chrome also labels the existing featured-events tab **Featured events** / **Empfohlene Events**.

### Modified Capabilities

- `event-discovery`: Discover Partner venues marquee reads admin-curated featured partners (up to 8 by `sort_order`), not an automatic slice of all partners; empty curated list omits the section.

## Impact

- **Tabs / chrome:** `apps/web/app/components/admin/admin-tabs.ts`, `AdminTabNav.tsx`, `AdminTabNav.stories.tsx`; `apps/web/app/lib/admin-content.ts` (`tabFeatured` rename + Featured partners copy keys).
- **Routes:** `apps/web/app/routes/[locale]/admin/featured-partners/index.tsx`, `add.tsx`, `[partnerId]/remove.tsx` (HonoX layout mirroring `admin/featured/**`).
- **UI:** New admin list/add/remove/table/results components patterned on `AdminFeatured*`.
- **Discover:** `apps/web/app/routes/[locale]/discover.tsx` (+ `DiscoverPage.tsx` data shape if needed) — swap `listPartners` → `listFeaturedPartners` with limit 8.
- **Seed:** `packages/db/src/catalog/seed.ts` — feature a subset of demo partners.
- **Domain (consume only):** `@unveiled/db` — `listFeaturedPartners`, `searchPartnersNotFeatured`, `addFeaturedPartner`, `removeFeaturedPartner`; map `CatalogValidationError` via existing admin error helpers.
- **Auth:** Existing ADMIN route guards on all featured-partners routes.
- **Unchanged this step:** Full `docs/product/` / Playwright matrix (step 03); partner portal; clickable partner tiles; reorder UI; hard reject on 9th add.
- **Source brief:** `.dev-plan/current-iteration/featured-partners-02-admin-and-discover.md`
- **Parent:** `.dev-plan/current-iteration/featured-partners-parent-guide.md`
- **Depends on:** `featured-partners-01-schema-and-domain` (done)
- **Consumed by:** `featured-partners-03-docs-and-hardening`
- **Verification:** `bun run lint`, `bun run typecheck`; manual smoke of Featured events label, Featured partners add/list/remove, Discover curated/empty Partner venues
