## Context

Parent feature: optional human photo credit on catalog images (`.dev-plan/current-iteration/02-image-credit-parent-guide.md`), step 01 — schema + image catalog domain only.

Current state:

- `images` has pipeline metadata only: `source` enum (`UPLOAD` | `REMOTE_URL`), `source_url`, dimensions, `uploaded_by`, `created_at` (`packages/db/src/schema/images.ts`). No human credit column.
- Persist path: `persistPrebuiltImage` inserts the row; `persistImageFromSource` / `attachImageToPartner` / `attachImageToEvent` / `replacePartnerLogo` / `replaceEventImage` all funnel through it (`packages/db/src/catalog/images.ts`). Replace always inserts a **new** `images` row (new UUID / R2 prefix) and does not copy fields from the previous row.
- Event/partner create/update pass `PersistImageOptions` (`uploadedBy`, `skipUpload`, `prebuilt`) but no credit. Gallery photos are persisted first, then joined via `event_gallery_images`.
- `listEventGalleryImages` selects join-table columns only (`eventId`, `imageId`, `sortOrder`, `createdAt`) — no `images` join. `EventGalleryImageRow` is consumed by admin gallery UI, `toPublicEventGalleryImages`, and e2e fixtures.

Product locks: column name **`credit`** (never `source`); free text, trimmed, max 200; empty → `NULL`; replacing an image does not inherit the old row’s credit; credit can be updated without replacing variants. `source` / `source_url` stay pipeline metadata.

Constraints: business logic in `@unveiled/db`; `public` schema only; catalog validation via `CatalogValidationError`; no admin/public UI, i18n, or e2e in this step; do not change variant filenames or R2 layout.

## Goals / Non-Goals

**Goals:**

- Persist `images.credit` as nullable text with no default (unset / empty = `NULL`).
- Shared normalize: trim; blank → `NULL`; length > 200 after trim → `CatalogValidationError`.
- Optional `credit` on persist/replace options; new rows store submitted credit or `NULL`; replace MUST NOT copy the previous row’s credit.
- `updateImageCredit` (and a thin `getImageCredit` read) without touching variants.
- `EventGalleryImageRow.credit: string | null` from a join on `listEventGalleryImages`.
- Tests: persist with/without credit; update; reject >200; replace does not inherit; omit still works.

**Non-Goals:**

- Admin credit fields, public captions, i18n, Gherkin/e2e (step 02).
- Wiring `CreateEventInput` / `UpdateEventInput` / `CreatePartnerInput` / `UpdatePartnerInput` — persist options are enough; routes wait for step 02.
- Changing `source`, `source_url`, Pica/variant pipeline, or R2 key layout.
- Required credit; URL validation; a photographer entity.
- Full `docs/product/extras/image-uploads.md` rewrite (optional schema-overview one-liner only).

## Decisions

1. **Nullable `credit` text, no DB length check**
   - **Choice:** `credit: text("credit")` on Drizzle `images` — nullable, no `.notNull()`, no `.default(...)`, no `CHECK (char_length(credit) <= 200)`. Existing rows stay `NULL` after `ADD COLUMN`.
   - **Rationale:** Parent lock is domain normalize (trim / empty / max 200), not a second constraint language. Matches other optional text columns (`source_url`).
   - **Alternatives:** `varchar(200)` / CHECK (duplicates domain rules; `varchar` counts bytes in some encodings); `NOT NULL DEFAULT ''` (collapses empty with unset and forces a caption placeholder later).

2. **Column name `credit`, leave `source` / `source_url` untouched**
   - **Choice:** New column only. Do not rename `source` or store the human string there.
   - **Rationale:** Parent name-collision lock. `source` is the upload vs remote-URL pipeline enum.
   - **Alternatives:** Reuse `source_url` for captions (wrong type/meaning; used for remote origin audit).

3. **Shared `normalizeImageCredit` used by persist and update**
   - **Choice:** Export a small helper from `packages/db/src/catalog/images.ts` (or a sibling module if the file grows). Contract:

     | Input | Stored |
     |---|---|
     | `undefined` / omitted | `NULL` |
     | `null` | `NULL` |
     | `""` or whitespace-only | `NULL` |
     | trimmed length 1–200 | trimmed string |
     | trimmed length > 200 | throw `CatalogValidationError("IMAGE_CREDIT_TOO_LONG")` |

   - Length is JavaScript string length after trim (UTF-16 code units). No URL / prefix validation — a credit MAY be a name, org, or short line (`Photo: Ada`).
   - **Rationale:** One write rule for insert and update; unit-testable without `DATABASE_URL`. New error code avoids colliding with occurrence `NEGATIVE_CREDIT_PRICE`.
   - **Alternatives:** Reuse `REQUIRED_FIELD` (opaque); reject `null` on update (would block “clear credit”).

4. **Optional `credit` on `PersistImageOptions` — not event/partner input types this step**
   - **Choice:** Add `credit?: string | null` to `PersistImageOptions`. `persistPrebuiltImage` / `persistImageFromSource` / attach / replace pass it into the insert. `createEvent` / `updateEvent` / `createPartner` / `updatePartner` stay unchanged (they already omit extra persist fields). Seeds and existing tests omit `credit` → `NULL`.
   - **Rationale:** Step plan: thread persist/replace; “call sites can wait for step 02.” Attach/replace already spread options, so step 02 can pass `credit` without a second domain API.
   - **Alternatives:** Add `imageCredit` on event/partner inputs now (UI still cannot collect it; extra unused surface).

5. **Replace never copies the old row’s credit**
   - **Choice:** Replace continues to insert a new `images` row via `persistImageFromSource`. Do **not** `SELECT credit FROM images WHERE id = currentImageId`. If the caller omits `credit`, the new row is `NULL` even when the replaced row had a value. If the caller supplies `credit`, it applies to the **new** row only. Keep-file credit edits use `updateImageCredit`, not replace-with-empty-upload (today’s replace already returns `currentImageId` when there is no new source and MUST NOT treat that as an implicit credit update).
   - **Rationale:** Parent release criterion: replacing an image does not copy the old credit unless the admin types it again.
   - **Alternatives:** Copy previous credit on replace (contradicts the lock); apply `options.credit` onto `currentImageId` when no new file (mixes two operations).

6. **`updateImageCredit` + `getImageCredit`**
   - **Choice:**
     - `updateImageCredit(db, imageId, credit)` — normalize, `UPDATE images SET credit = … WHERE id = imageId`; throw `IMAGE_NOT_FOUND` if zero rows.
     - `getImageCredit(db, imageId)` — `string | null`; `null` when missing **or** stored NULL is ambiguous — prefer throw `IMAGE_NOT_FOUND` when the row is missing, return `string | null` for the column. Tests and step 02 hero/logo reads use this so they do not import the schema.
   - Do not delete or rewrite R2 objects.
   - **Rationale:** Step plan names update-without-replace. A matching read keeps hero/partner-logo credit off the gallery-only join.
   - **Alternatives:** Only gallery join (hero/logo would need a raw `images` select in routes); skip `getImageCredit` (step 02 would reach into schema).

7. **Gallery list join is in scope (cheap)**
   - **Choice:** Extend `EventGalleryImageRow` with `credit: string | null`. `listEventGalleryImages` `innerJoin`s `images` on `image_id` and selects `images.credit`. `add` / `reorder` already return `listEventGalleryImages`, so they pick it up. Compile-fix object literals that construct `EventGalleryImageRow` (`apps/web/app/lib/public-event-gallery.test.ts` `row()` helper, any e2e fixtures) with `credit: null` — no captions.
   - **Rationale:** Step plan prefers this over `getImageCredit` for gallery. FK is `ON DELETE RESTRICT`; inner join is valid.
   - **Alternatives:** `getImageCredit` per gallery id (N+1 / second query design the step plan wants to avoid).

8. **Tests: unit helper + integration persist/update/replace**
   - **Choice:**
     - `packages/db/src/catalog/image-credit.test.ts` — normalize: trim, empty → `null`, 200 ok, 201 throws `IMAGE_CREDIT_TOO_LONG` (no `DATABASE_URL`).
     - `packages/db/src/catalog/image-credit.integration.test.ts` — skip when `DATABASE_URL` unset. Persist `"Photo: Ada"`; omit/blank → `NULL`; `updateImageCredit` set and clear; persist >200 rejected with no row; `replaceEventImage` (or `persistPrebuiltImage` then replace) with omitted credit → new id, new `credit` NULL, old row unchanged until cleanup. Existing persist tests remain omit-credit.
   - **Rationale:** Step verification is `cd packages/db && bun test`; unit file stays green without Neon.
   - **Alternatives:** Fold into `catalog.integration.test.ts` (already large); integration-only (CI without DB would not cover reject).

9. **Optional schema-overview note; no Gherkin this step**
   - **Choice:** One-line `images.credit` row in `docs/product/database/schema-overview.md` is allowed. Do not edit `image-uploads.md`, admin/event-discovery features, or UI map (step 02).
   - **Rationale:** Step plan cleanup; canonical upload docs wait until surfaces exist.

## Risks / Trade-offs

- **[Risk] `EventGalleryImageRow` type ripple** → Mitigation: required `credit: string | null` on the type; fix test/fixture object literals only. No public caption rendering.
- **[Risk] Raw SQL could insert >200 chars** → Accepted. Only catalog helpers write `credit`; no CHECK unless a later step needs defense in depth.
- **[Risk] Shared image ids (clone copies `image_id` / gallery joins)** → Pre-existing. Updating credit on a shared row would affect clones. Out of scope; do not copy-on-clone this step.
- **[Trade-off] Event/partner inputs do not take credit yet** → Step 02 passes `credit` on persist options (or adds input fields). Domain API is ready.
- **[Trade-off] Optional schema-overview draft** → Step 02 owns the full doc sweep; a one-line images-section note keeps schema SoT honest if this PR lands alone.

## Migration Plan

1. Add `credit: text("credit")` to Drizzle `images`; `bun run db:generate`; review SQL (`ADD COLUMN "credit" text` — no DEFAULT, no NOT NULL, no backfill).
2. Add `normalizeImageCredit`, `IMAGE_CREDIT_TOO_LONG`, `credit?` on `PersistImageOptions`; persist/replace insert the normalized value; add `updateImageCredit` / `getImageCredit`.
3. Join `images.credit` in `listEventGalleryImages`; extend `EventGalleryImageRow`; compile-fix row fixtures.
4. Add unit + integration tests; run `cd packages/db && bun test`.
5. Optionally add the schema-overview one-liner; do not touch routes, islands, Gherkin, or R2 layout.
6. Run `bun run typecheck` and `bun run lint`.
7. Rollback: drop `images.credit` (additive until step 02 depends on it). Do not drop `source` / `source_url`.

## Open Questions

- None blocking. Whether to patch `docs/product/database/schema-overview.md` in this PR or wait for step 02 is optional per the step plan — prefer a short images-section note if the migration lands alone.
