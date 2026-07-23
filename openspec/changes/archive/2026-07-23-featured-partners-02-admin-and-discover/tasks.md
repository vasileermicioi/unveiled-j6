## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/featured-partners-02-admin-and-discover.md` and parent guide release criteria / non-goals
- [x] 1.2 Confirm step 01 APIs are exported: `listFeaturedPartners`, `searchPartnersNotFeatured`, `addFeaturedPartner`, `removeFeaturedPartner` (+ `FeaturedPartnerRow`) from `@unveiled/db`
- [x] 1.3 Walk existing Featured events admin routes/components once as the UX template (`admin/featured/**`, `AdminFeatured*`)

## 2. Admin chrome and copy

- [x] 2.1 Update `tabFeatured` DE/EN to **Empfohlene Events** / **Featured events**
- [x] 2.2 Extend `AdminTab`, `ADMIN_TAB_ORDER` (after `featured`), path helpers, and `inferAdminTab` (match `featured-partners` **before** `featured`)
- [x] 2.3 Wire `AdminTabNav` + Ladle story for Featured partners
- [x] 2.4 Add DE/EN admin-content keys for Featured partners list/add/remove (titles, empty, search, confirm remove keeps partner)

## 3. Featured partners SSR surfaces

- [x] 3.1 Add list/add/remove components under `apps/web/app/components/admin/` mirroring featured-events patterns (HeroUI-only; Tailwind layout only)
- [x] 3.2 Add ADMIN-guarded routes: `/:locale/admin/featured-partners` (list), `.../add` (GET search + POST add → redirect list), `.../:partnerId/remove` (GET confirm + POST → redirect list)
- [x] 3.3 Map `CatalogValidationError` (`PARTNER_NOT_FOUND`, `ALREADY_FEATURED`) via existing admin error helpers

## 4. Discover and demo seed

- [x] 4.1 Replace Discover `listPartners(db, { limit: 8 })` with `listFeaturedPartners(db, { limit: 8 })`; keep `toDiscoverPartnerTile` mapping
- [x] 4.2 Spot-check empty curated list still hides Partner venues section
- [x] 4.3 Update demo seed to feature a small partner subset (not all); leave ≥1 non-featured when catalog size allows

## 5. Validation and handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Manual smoke: `/en/admin/featured` tab reads **Featured events**; `/en/admin/featured-partners` add/list/remove keeps partner under `/admin/partners`; guest `/en/discover` shows only featured partners (or hides section when none)
- [x] 5.3 Mark step 02 done in `.dev-plan/current-iteration/featured-partners-parent-guide.md`; leave formal product-doc / e2e updates for step 03
