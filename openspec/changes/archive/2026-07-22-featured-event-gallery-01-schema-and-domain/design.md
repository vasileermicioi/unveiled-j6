## Context

Parent feature: Featured Event Gallery (`.dev-plan/current-iteration/featured-event-gallery-parent-guide.md`). Step 01 is schema + domain only.

Today each event has exactly one required hero via `events.image_id` → `images.id` (`ON DELETE RESTRICT`). Image create/delete lives in `packages/db/src/catalog/images.ts` (`deleteImageRecord`, `skipBucket`). Event delete (`deleteEvent`) deletes the event row first, then the primary image — gallery is not modeled yet. Join-table precedents: `featured_events` (PK = `event_id`), `saved_events` (composite PK).

Constraints: business logic in `@unveiled/db` catalog; no `apps/web` UI; primary hero remains required and separate; image cleanup aligns with `docs/product/extras/image-uploads.md` §8; tests use `skipUpload` / `skipBucket` so live R2 is not required. Soft dep on client-image-resize persist API for later admin uploads — not required for this slice.

## Goals / Non-Goals

**Goals:**

- Persist ordered gallery membership in `event_gallery_images` without changing `events.image_id`.
- Package helpers: list, add (append order + max 12), remove (bulk + image cleanup).
- Event delete cleans gallery images as well as the hero.
- Migration + schema overview + package tests.

**Non-Goals:**

- Admin multi-upload / multi-select remove UI (step 02).
- Public detail gallery section + slider island (step 03).
- BDD / sitemap / i18n / full extras polish (step 04).
- Drag-and-drop reorder UI (column exists for append order only).
- Discover card multi-image carousels.

## Decisions

1. **Composite PK `(event_id, image_id)`**
   - **Choice:** `event_gallery_images` with `event_id` uuid NOT NULL FK → `events.id` **ON DELETE CASCADE**, `image_id` uuid NOT NULL FK → `images.id` **ON DELETE RESTRICT**, `sort_order` integer NOT NULL; composite primary key `(event_id, image_id)`. Optional `created_at` timestamptz default now if useful for debugging (not required by list order). Index on `(event_id, sort_order)` for list queries.
   - **Rationale:** One image once per event; matches `saved_events` composite-PK style; CASCADE clears join rows when the event is deleted; RESTRICT on images matches hero FK so app-level delete ordering stays authoritative.
   - **Alternatives:** Surrogate uuid PK (extra id, need unique on `(event_id, image_id)` anyway); CASCADE on image (would hide orphan bugs); array of image ids on `events` (harder to FK/cleanup).

2. **Max gallery size = 12**
   - **Choice:** Domain constant e.g. `MAX_EVENT_GALLERY_IMAGES = 12`. `addEventGalleryImages` rejects when `currentCount + incoming.length > 12` with a new `CatalogErrorCode` (e.g. `GALLERY_LIMIT_EXCEEDED`). Document in parent guide + schema overview.
   - **Rationale:** Parent guide proposed 12; locks the open question for step 01. Same 8 MB per source file remains an upload concern (step 02 / image pipeline), not this table.
   - **Alternatives:** Unlimited (storage/UI risk); lower cap (6) — can tighten later without schema change.

3. **Catalog module `event-gallery-images.ts`**
   - **Choice:** Helpers in `packages/db/src/catalog/event-gallery-images.ts`, exported from `catalog/index.ts` / `@unveiled/db`.
   - **Surface:**
     - `listEventGalleryImages(db, eventId)` — join `images` as needed; return rows ordered by `sort_order` asc (stable tie-break: `image_id` if useful).
     - `addEventGalleryImages(db, eventId, imageIds: string[])` — require event exists; reject duplicates already in gallery / duplicate ids in input; append `sort_order = (MAX ?? -1) + 1` per new row; enforce max 12; assume `imageIds` already refer to persisted `images` rows (admin step 02 uploads first, then calls add).
     - `removeEventGalleryImages(db, eventId, imageIds: string[])` — delete matching join rows; for each removed `image_id`, if no longer referenced by any `events.image_id`, `partners.logo_image_id`, or other `event_gallery_images` rows, call `deleteImageRecord` (honor `skipBucket` option).
   - **Rationale:** Matches step brief; keeps booking/admin free of gallery persistence; reuse `deleteImageRecord` for §8 cleanup.
   - **Alternatives:** Fold into `events.ts` (file already large); soft-delete gallery rows (orphans images).

4. **Event delete sequencing**
   - **Choice:** Update `deleteEvent` to: load event + list gallery `image_id`s → delete `events` row (CASCADE drops join rows) → `deleteImageRecord` for each former gallery id → `deleteImageRecord` for primary `imageId`. Pass through `skipBucket`.
   - **Rationale:** Join CASCADE alone orphans `images` rows/objects; RESTRICT on `image_id` requires join rows gone before image delete (satisfied by deleting the event first). Mirrors current hero cleanup pattern.
   - **Alternatives:** Explicit join delete before event delete (equivalent if careful); DB trigger (out of stack norms).

5. **Reference check before image delete on remove**
   - **Choice:** Before `deleteImageRecord` in `removeEventGalleryImages`, verify the image is not still the event hero, a partner logo, or another gallery membership. Prefer a small shared “is image referenced?” query used by remove (and optionally by future replace paths).
   - **Rationale:** Step brief: delete image records/objects when unreferenced; never delete the hero via gallery remove.
   - **Alternatives:** Always delete image on gallery remove (unsafe if mis-associated); leave orphans (violates §8).

6. **Errors via `CatalogValidationError`**
   - **Choice:** Reuse `EVENT_NOT_FOUND`. Add codes such as `GALLERY_LIMIT_EXCEEDED`, and optionally `GALLERY_IMAGE_NOT_FOUND` / `INVALID_GALLERY_IMAGE` for ids not in the event’s gallery on remove (prefer idempotent remove of unknown ids — delete matching only, no throw — unless existing catalog style prefers strictness; follow featured-remove “delete-then-done” for missing membership).
   - **Rationale:** Consistent with `featured-events` / events catalog APIs.
   - **Alternatives:** Silent truncate to cap on add (weaker admin feedback).

7. **Tests: integration when `DATABASE_URL` set**
   - **Choice:** Integration tests with `skipUpload: true` / `skipBucket: true`; cover add (order + hero unchanged), cap rejection, remove (join gone + image row gone when unreferenced), event delete cleans gallery images. Skip with warn if no DB.
   - **Rationale:** Matches `featured-events.integration.test.ts` / catalog norms; step verification requires package tests without live R2.
   - **Alternatives:** Pure mocked drizzle (brittle); defer tests to step 02 (reject).

8. **Docs in this step**
   - **Choice:** Update `docs/product/database/schema-overview.md` (tables list, field table, ER note, FK rules). Record max=12 in parent guide Risks. Optionally one-line note in `image-uploads.md` §9 that gallery storage is in progress — full extras/BDD in step 04.
   - **Rationale:** Step brief prefers schema overview here; openspec delta is not product SoT.

## Risks / Trade-offs

- **[Risk] Concurrent add races on `sort_order` / cap** → Mitigation: composite PK prevents duplicate image membership; accept rare sort gaps under race. Catalog uses neon-http (`createDb`) so helpers are not transactional; cap check is best-effort before insert (same pattern as `featured_events`).
- **[Risk] `deleteEvent` forgets gallery image cleanup** → Mitigation: explicit list-before-delete in `deleteEvent` + integration test.
- **[Risk] Gallery remove accidentally deletes hero** → Mitigation: never pass `events.image_id` into gallery remove cleanup without reference check; tests assert hero survives.
- **[Risk] Accidental UI edits** → Mitigation: verify git diff excludes `apps/web` routes/islands.
- **[Trade-off] openspec/specs are not product SoT** → Delta still written; implementers update `schema-overview.md` now and feature docs in step 04.
- **[Trade-off] No reorder API** → Append-only `sort_order` is enough for MVP; reorder UI parked per parent non-goals.

## Migration Plan

1. Add Drizzle schema + export; `bun run db:generate`; review SQL (CASCADE on event, RESTRICT on image, composite PK, index).
2. Implement helpers + wire `deleteEvent`; add tests; update schema overview + parent guide cap.
3. `bun run db:migrate` (or via `bun run build` pipeline) before step 02 uses the table.
4. `bun run lint`, `bun run typecheck`, scoped gallery package tests.
5. Rollback = revert migration + schema (drop `event_gallery_images`). No apps/web deploy dependency for this slice alone.

## Open Questions

- None blocking. Display gating (all events vs Discover-featured-only) remains a step 03 product choice; storage applies to all events.
