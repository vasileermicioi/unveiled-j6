## 1. Setup

- [x] 1.1 Confirm prerequisites: `AdminFeaturedTable`, `AdminFeaturedAddResults`, featured list/add pages + routes, `FeaturedEventRow` / loaders with `imageId`, `buildVariantUrl` + `AdminEventsTable` logo pattern, `admin-events.feature`, coverage matrix, featured Playwright
- [x] 1.2 Skim parent guide release criteria / non-goals (no EventCard redesign, no new variants, no drag-reorder)

## 2. Wire thumb URLs + UI

- [x] 2.1 Build `imageUrls` (`small-320.webp`, try/catch → undefined) in featured list + add routes; optionally extract shared `buildEventImageUrls` helper if low-cost
- [x] 2.2 Pass `imageUrls` through `AdminFeaturedListPage` / `AdminFeaturedAddPage` into table components
- [x] 2.3 Add leading logo column to `AdminFeaturedTable` and `AdminFeaturedAddResults` mirroring `AdminEventsTable` (`Surface.admin-table__logo` + `<img>` or placeholder); ensure missing/broken thumbs never block add/remove/gallery actions

## 3. Docs & e2e

- [x] 3.1 Update `docs/product/features/admin-events.feature` for featured list + add-results thumbnails (and non-blocking actions)
- [x] 3.2 Note thumbnail cells / components in `docs/product/ui/ui-component-map.md`
- [x] 3.3 Update `docs/product/testing/coverage-matrix.md`; add Playwright proximity asserts for featured thumbs (list and/or add-results) or named deferrals; keep existing R2/env skips
- [x] 3.4 Mark `ux-polish-05-featured-thumbnails` done in `.dev-plan/current-iteration/ux-polish-parent-guide.md` (feature complete)

## 4. Verification

- [x] 4.1 Run `bun run lint` — exits 0
- [x] 4.2 Run `bun run typecheck` — exits 0
- [x] 4.3 Run touched featured-events Playwright (or confirm named coverage-matrix deferral) — pass / documented
  <!-- Specs + coverage-matrix rows updated. Focused Playwright: 2 skipped (`E2E_ADMIN_*` unset); R2 env-skip pattern unchanged. Live run needs E2E_ADMIN_* + R2. -->
