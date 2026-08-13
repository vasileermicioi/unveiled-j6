## Why

`images` already stores pipeline metadata (`source` `UPLOAD` | `REMOTE_URL`, `source_url`) but has no place for a human photo credit. Step 02 needs a separate optional credit string on every image row so partner logos, event primaries, and gallery photos can collect and show it. This step is the schema + catalog-domain foundation for parent feature `02-image-credit` (step 01 of 02).

## What Changes

- Add `images.credit` `text`, **nullable**, no default. Do **not** rename or reuse `source` / `source_url`.
- Drizzle schema + generated migration (`bun run db:generate`). Existing rows stay `NULL`.
- Normalize writes in `@unveiled/db`: trim; empty/omitted → `NULL`; reject over 200 characters with `CatalogValidationError`.
- Thread optional `credit` through persist/replace helpers (`persistPrebuiltImage`, `persistImageFromSource`, attach/replace partner and event image helpers). New rows get the submitted credit or `NULL`. Replacing an image creates a new row and MUST NOT copy the previous credit.
- Add `updateImageCredit(db, imageId, credit)` (or equivalent) so credit can change without replacing variants. Route call sites wait for step 02.
- Include `credit: string | null` on `EventGalleryImageRow` via a cheap join on `listEventGalleryImages` so step 02 can read gallery credits without a second query design.
- Tests: persist with/without credit; update credit; reject >200; replace does not inherit old credit; omit still works.
- Out of scope: admin text fields, public captions, i18n, e2e, canonical image-uploads.md (optional schema-overview one-liner allowed). Do not change variant filenames or R2 layout.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `image-uploads`: Persist optional human `credit` on `images.credit` (nullable text, independent of `source` / `source_url`). Writes trim, store `NULL` when empty, and reject values longer than 200 characters. Inserts (including replacements) set credit from the submitter or `NULL` and MUST NOT copy credit from a replaced row. Catalog SHALL update credit on an existing image id without replacing variants.

## Impact

- **DB:** `packages/db/src/schema/images.ts`, new Drizzle migration under `packages/db/drizzle/`. Optional one-line `images.credit` note in `docs/product/database/schema-overview.md`; full `image-uploads.md` wait for step 02.
- **Domain:** `packages/db/src/catalog/images.ts` (`PersistImageOptions`, persist/attach/replace, `updateImageCredit`, shared normalize helper). `packages/db/src/catalog/event-gallery-images.ts` (`EventGalleryImageRow` + `listEventGalleryImages` join). New `CatalogErrorCode` for over-length credit. Event/partner create/update inputs do not need to pass credit yet — persist options carry it; routes wait for step 02.
- **Dependents:** `EventGalleryImageRow` consumers (`toPublicEventGalleryImages`, admin gallery list, e2e fixtures) gain a `credit` field; compile-fix test object literals only — no UI captions this step.
- **Source brief:** `.dev-plan/current-iteration/02-image-credit-01-schema-and-domain.md`
- **Parent:** `.dev-plan/current-iteration/02-image-credit-parent-guide.md`
- **Verification:** `bun run db:generate`; `cd packages/db && bun test`; `bun run typecheck`; `bun run lint`
