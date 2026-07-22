## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/featured-event-gallery-01-schema-and-domain.md` and parent guide release criteria / non-goals
- [x] 1.2 Confirm prerequisites: `packages/db/src/schema/images.ts`, `events.ts`, `packages/db/src/catalog/images.ts` (`deleteImageRecord`), `docs/product/database/schema-overview.md`, `docs/product/extras/image-uploads.md` §8
- [x] 1.3 Record max gallery size **12** in `.dev-plan/current-iteration/featured-event-gallery-parent-guide.md` (close the open question)

## 2. Schema and migration

- [x] 2.1 Add `packages/db/src/schema/event-gallery-images.ts` (composite PK `(event_id, image_id)`, `sort_order`, event FK CASCADE, image FK RESTRICT, list index)
- [x] 2.2 Export from `packages/db/src/schema/index.ts`
- [x] 2.3 Run `bun run db:generate`, review migration SQL (CASCADE / RESTRICT / PK / index), document migrate path

## 3. Domain helpers

- [x] 3.1 Add `packages/db/src/catalog/event-gallery-images.ts` with `listEventGalleryImages`, `addEventGalleryImages` (append `sort_order`, max 12), `removeEventGalleryImages` (bulk + unreferenced `deleteImageRecord`)
- [x] 3.2 Extend `CatalogErrorCode` / `CatalogValidationError` for gallery limit (reuse `EVENT_NOT_FOUND`)
- [x] 3.3 Update `deleteEvent` to list gallery image ids, delete event (cascade joins), then delete gallery images + primary image (`skipBucket` passthrough)
- [x] 3.4 Export helpers from `packages/db/src/catalog/index.ts`

## 4. Tests and docs

- [x] 4.1 Add package tests covering add (order + hero unchanged), cap rejection, remove (join + unreferenced image cleanup), event delete cleans gallery (`skipUpload` / `skipBucket`; skip if no `DATABASE_URL`)
- [x] 4.2 Document `event_gallery_images` in `docs/product/database/schema-overview.md` (tables list, field table, FK / ER notes, max 12)

## 5. Validation and handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Run scoped package tests for gallery helpers (exit 0)
- [x] 5.3 Confirm no admin/public gallery UI (`apps/web` routes/islands) was changed
- [x] 5.4 Mark step done in `.dev-plan/current-iteration/featured-event-gallery-parent-guide.md` and note gallery FK conventions
