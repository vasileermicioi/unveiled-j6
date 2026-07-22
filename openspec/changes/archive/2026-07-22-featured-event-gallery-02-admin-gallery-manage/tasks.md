## 1. Setup & paths

- [x] 1.1 Confirm prerequisites: step 01 gallery domain APIs + `client-image-resize-03` multi-file island/`persistPrebuiltImage` exist; skim parent guide non-goals
- [x] 1.2 Add path helpers (`adminEventGalleryPath` / add / remove) and DE/EN `AdminCopy` strings for gallery list/add/remove/capacity/empty/errors

## 2. Multi-prebuilt upload plumbing

- [x] 2.1 Extend `EventImageUpload` (or gallery-specific wrapper) so `multiple` keeps and emits **all** processed files, not only the first
- [x] 2.2 Extend `AdminImageVariantFields` (or add gallery variant fields) to post indexed sets: `galleryCount` + `gallery[i].imageId` / claimed sizes / six `VARIANT_FILENAMES`
- [x] 2.3 Add `parsePrebuiltImageVariantSets` (and `parseGalleryImageIds` for remove) in `apps/web/app/lib/` with unit tests covering 0 / 1 / 2+ sets and repeated `imageIds`

## 3. Admin gallery routes & UI

- [x] 3.1 Build `AdminEventGalleryListPage` + `GET .../admin/events/[id]/gallery` (thumbnails, `n/12`, links to add/remove/per-photo remove; `guardAdminRoute`; 404 if event missing)
- [x] 3.2 Build `AdminEventGalleryAddPage` + `GET`/`POST .../gallery/add`: multi-file island → parse sets → `persistPrebuiltImage` each → `addEventGalleryImages` → redirect list; map capacity/errors; clean up persisted orphans if add fails
- [x] 3.3 Build `AdminEventGalleryRemovePage` + `GET`/`POST .../gallery/remove`: native `AdminFormSelect` multi + optional `?imageIds=` preselect; POST → `removeEventGalleryImages` → redirect list; reject empty selection
- [x] 3.4 Add gallery manage entry from event edit (existing events only); optional events-table link if trivial

## 4. Docs & verification

- [x] 4.1 Update `docs/product/sitemap/sitemap.md` admin rows for gallery list/add/remove
- [x] 4.2 Mark `featured-event-gallery-02-admin-gallery-manage` done in the parent guide; note handoff for step 03
- [x] 4.3 Run `bun run lint`, `bun run typecheck`, and unit tests for parse/selection helpers
- [ ] 4.4 Manual smoke: add 2+ photos, remove one, remove multiple; confirm list updates and hero image unchanged
