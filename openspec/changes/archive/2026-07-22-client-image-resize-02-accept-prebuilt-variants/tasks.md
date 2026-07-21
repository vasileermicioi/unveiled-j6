## 1. Setup

- [x] 1.1 Confirm prerequisites: step 01 `@unveiled/images/client`, `packages/images/src/s3.ts` (`uploadImageVariants`), `packages/db/src/catalog/images.ts` (`persistImageFromSource`), `validation.ts` / `constants.ts`, parent guide release criteria
- [x] 1.2 Skim design decisions: prebuilt input shape, JPEG SOF validation (no sip resize), multipart field names = `VARIANT_FILENAMES`, dual path until step 04

## 2. Validation & persist API (`@unveiled/images`)

- [x] 2.1 Add JPEG magic-byte + SOF dimension helpers usable without sip/`generateImageVariants`
- [x] 2.2 Implement `validatePrebuiltVariants` — all six present, JPEG-only, OG exactly 1200×630, ladder caps + no-upscale vs inspected `original.jpg`, min 800×420 on original
- [x] 2.3 Implement `persistPrebuiltImageVariants(input, options?)` — validate → upload via `uploadImageVariants` (unless `skipUpload`) → return `ProcessedImageResult`; best-effort `deleteImageObjects` on mid-upload failure
- [x] 2.4 Export new API + types from `packages/images/src/index.ts` (main entry only; do not pull `/client` into Workers)

## 3. DB catalog helper (`@unveiled/db`)

- [x] 3.1 Add `persistPrebuiltImage(db, input, options?)` that calls `persistPrebuiltImageVariants` then inserts `images` with `source = UPLOAD` (reuse enum) and metadata dimensions
- [x] 3.2 Leave `attachImageToEvent` / `attachImageToPartner` signatures unchanged this step (callable helper only; form switch in step 03)

## 4. Tests

- [x] 4.1 Unit-test happy path with `skipUpload: true` (fixture via `createSolidJpeg` + sip generate, or equivalent six JPEGs)
- [x] 4.2 Unit-test rejects: missing variant, non-JPEG, wrong OG size, ladder over cap / larger than original — no partial success
- [x] 4.3 Add `@unveiled/db` catalog test for `persistPrebuiltImage` if an existing harness makes it cheap; otherwise keep coverage in `@unveiled/images`

## 5. Docs & verification

- [x] 5.1 Update `packages/images/README.md` with prebuilt persist API + multipart field naming (`imageId` + one file field per `VariantFilename`)
- [x] 5.2 Draft notes for `docs/product/extras/image-uploads.md` (full product doc update deferred to step 04)
- [x] 5.3 Run `cd packages/images && bun test` (and relevant db catalog tests) — exit 0 without live R2
- [x] 5.4 Run `bun run lint` and `bun run typecheck` — exit 0
- [x] 5.5 Mark step 02 done in `.dev-plan/current-iteration/client-image-resize-parent-guide.md`
