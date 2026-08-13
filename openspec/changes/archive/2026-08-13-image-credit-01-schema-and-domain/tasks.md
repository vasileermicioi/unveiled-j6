## 1. Setup

- [x] 1.1 Read step plan + parent guide; confirm artifacts (`packages/db/src/schema/images.ts`, `packages/db/src/catalog/images.ts` persist/attach/replace, `packages/db/src/catalog/event-gallery-images.ts` `EventGalleryImageRow` / `listEventGalleryImages`)
- [x] 1.2 Confirm `images.source` / `source_url` stay untouched; lock write semantics: omit/blank → `NULL`; trim; >200 after trim → `IMAGE_CREDIT_TOO_LONG`; replace inserts a new row and does not copy previous credit

## 2. Schema & migration

- [x] 2.1 Add `credit: text("credit")` (nullable, no default) to Drizzle `images`
- [x] 2.2 Run `bun run db:generate`; review migration SQL (`ADD COLUMN "credit" text` — no DEFAULT, no NOT NULL, no CHECK, no backfill); keep the migration

## 3. Catalog domain writes

- [x] 3.1 Add `IMAGE_CREDIT_TOO_LONG` to `CatalogErrorCode`; export `normalizeImageCredit` (omit/`null`/whitespace → `null`; trim; reject length > 200)
- [x] 3.2 Add optional `credit?: string | null` to `PersistImageOptions`; persist/attach/replace insert the normalized value on **new** rows only
- [x] 3.3 Add `updateImageCredit(db, imageId, credit)` (normalize; `IMAGE_NOT_FOUND` if missing; no R2 writes) and `getImageCredit(db, imageId)` (`IMAGE_NOT_FOUND` if missing; otherwise `string | null`)
- [x] 3.4 Do **not** add credit fields to event/partner create/update input types this step

## 4. Gallery list join

- [x] 4.1 Extend `EventGalleryImageRow` with `credit: string | null`; `innerJoin` `images` in `listEventGalleryImages` and select `images.credit`
- [x] 4.2 Compile-fix `EventGalleryImageRow` object literals (`apps/web/app/lib/public-event-gallery.test.ts` and any fixtures) with `credit: null` — no public captions

## 5. Tests

- [x] 5.1 Add `packages/db/src/catalog/image-credit.test.ts`: trim; empty → `null`; 200 accepted; 201 throws `IMAGE_CREDIT_TOO_LONG`
- [x] 5.2 Add `packages/db/src/catalog/image-credit.integration.test.ts` (skip when `DATABASE_URL` is unset): persist `"Photo: Ada"`; omit/blank → `NULL`; update set and clear; persist >200 rejects with no row; replace without credit → new row `NULL` (does not copy old credit)
- [x] 5.3 Confirm existing image persist tests still pass when credit is omitted; gallery list integration still passes with `credit: null` on uncredited photos

## 6. Verification & handoff

- [x] 6.1 Run `bun run db:generate` — exits 0; new migration includes `images.credit`
- [x] 6.2 Run `cd packages/db && bun test` — exits 0 (integration skips without `DATABASE_URL`)
- [x] 6.3 Run `bun run typecheck` and `bun run lint` — exit 0
- [x] 6.4 Optional one-line `images.credit` note in `docs/product/database/schema-overview.md`; mark step 01 done in `02-image-credit-parent-guide.md`; do not edit `image-uploads.md`, Gherkin, admin forms, or public captions
