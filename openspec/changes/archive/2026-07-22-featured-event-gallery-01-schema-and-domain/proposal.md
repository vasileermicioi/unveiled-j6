## Why

Featured Event Gallery needs ordered photos beyond the required primary `events.image_id`, but there is no join table or catalog API to persist them yet. This first slice lands schema, migration, and domain helpers (list/add/remove with image cleanup) so admin UI and public detail can build on a stable store without changing hero-image behavior.

## What Changes

- Add Drizzle schema `event_gallery_images` (`event_id` → `events.id` ON DELETE CASCADE, `image_id` → `images.id` ON DELETE RESTRICT, `sort_order`) and generate a migration.
- Add catalog domain helpers in `@unveiled/db`: `listEventGalleryImages`, `addEventGalleryImages` (append `sort_order`), `removeEventGalleryImages` (bulk; delete join rows + unreferenced image records/objects per existing cleanup rules).
- Enforce a max gallery size of **12** images per event in the domain layer.
- Extend event delete sequencing so gallery images are cleaned up (join cascade + app-level `deleteImageRecord`) alongside the primary hero image.
- Cover helpers with package tests using `skipUpload` / `skipBucket` (no live R2 required).
- Document the table in `docs/product/database/schema-overview.md`; record the gallery cap in the parent guide.
- **No** admin pages, public gallery UI, slider island, or BDD feature files in this step.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-catalog`: Persist zero or more gallery images per event in `event_gallery_images`, separate from required `events.image_id`; domain helpers for list / add (append order, max 12) / remove (bulk + image cleanup); event delete cleans gallery images per image-upload rules.

## Impact

- **Schema:** `packages/db/src/schema/event-gallery-images.ts` + export from `schema/index.ts`; migration under `packages/db`.
- **Domain:** `packages/db/src/catalog/event-gallery-images.ts` (or equivalent under catalog); wire into `deleteEvent` cleanup; export from catalog barrel / `@unveiled/db`.
- **Errors:** extend `CatalogErrorCode` for gallery cap / invalid gallery image ids as needed (reuse `EVENT_NOT_FOUND`).
- **Docs:** `docs/product/database/schema-overview.md`; parent guide max-cap decision; optional note that `image-uploads.md` §9 multi-gallery parking lot is now in progress (full extras polish in step 04).
- **Tests:** new catalog unit/integration tests in `packages/db` with `skipUpload` / `skipBucket`.
- **Unchanged this step:** `apps/web` routes/islands, admin upload UI, public event detail gallery, BDD under `docs/product/features/`.
- **Source brief:** `.dev-plan/current-iteration/featured-event-gallery-01-schema-and-domain.md`
- **Parent:** `.dev-plan/current-iteration/featured-event-gallery-parent-guide.md`
- **Soft dep:** `client-image-resize-02-accept-prebuilt-variants` (persist API) — preferred before admin step 02; not required to land schema/domain.
- **Consumed by:** `featured-event-gallery-02-admin-gallery-manage`
- **Verification:** `bun run lint`, `bun run typecheck`, scoped `packages/db` catalog tests
