## Context

Parent feature: Client Image Resize (Pica) (`.dev-plan/current-iteration/client-image-resize-parent-guide.md`). Step 01 shipped `@unveiled/images/client` (`generateImageVariantsClient`) emitting six JPEG `Blob`s. Today the server path is still single-source → sip `generateImageVariants` → `uploadImageVariants` → DB insert via `persistImageFromSource` in `@unveiled/db`.

This step adds a **library-only** dual path: accept six already-built JPEG buffers, validate, upload, insert — no resize/re-encode. Admin form POST wiring is step 03. Sip stays until step 04.

Constraints: business logic in `packages/*`; keep `buildVariantUrl` / R2 key layout unchanged; prefer `source = UPLOAD`; do not trust client-supplied dimensions; never leave a DB-referenced image id with a partial variant set; no live R2 in unit tests.

## Goals / Non-Goals

**Goals:**

- Server API that persists a complete prebuilt six-variant set without calling `generateImageVariants` / sip resize.
- Strict validation: all six present, each JPEG, OG exactly 1200×630, ladder widths within caps and not upscaled vs inspected `original.jpg` (where practical).
- DB helper that inserts one `images` row after a successful persist (callable; event/partner form switch in step 03).
- Clear input shape + multipart field naming documented in `packages/images/README.md`.
- Unit tests for accept/reject cases with `skipUpload: true` (or mocked S3).

**Non-Goals:**

- Admin island / FormData wiring (step 03).
- Removing sip, seed changes, remote URL proxy (step 04).
- Changing filenames, Content-Type, or public URL shape.
- Gallery multi-image or partner self-service uploads.
- Full rewrite of `docs/product/extras/image-uploads.md` (draft notes only; product update in step 04).

## Decisions

1. **API surface (`@unveiled/images`)**
   - **Choice:** Add `persistPrebuiltImageVariants(input, options?)` on the **main** (server) package entry:
     ```ts
     type PrebuiltImageVariantsInput = {
       imageId: string; // client- or server-generated UUID
       variants: Record<VariantFilename, Buffer>;
       /** Client-claimed source size; ignored when original.jpg headers parse successfully */
       claimedWidth?: number;
       claimedHeight?: number;
     };

     type PersistPrebuiltOptions = {
       skipUpload?: boolean;
       source?: "UPLOAD" | "REMOTE_URL"; // default UPLOAD
       sourceUrl?: string | null;
     };

     persistPrebuiltImageVariants(
       input: PrebuiltImageVariantsInput,
       options?: PersistPrebuiltOptions,
     ): Promise<ProcessedImageResult>
     ```
     Internally: validate → optionally `uploadImageVariants` → return `{ imageId, variants, metadata }` with `metadata.width/height` from inspected `original.jpg`.
   - **Rationale:** Mirrors `processImageFromBuffer` return type so DB insert code stays thin; keeps Pica/`/client` out of Workers.
   - **Alternatives:** Only a validate helper (forces every caller to upload); fold into `processImageFromBuffer` via overload (muddies sip vs prebuilt paths).

2. **Validation without sip resize**
   - **Choice:** New helper (e.g. `validatePrebuiltVariants`) that:
     1. Requires every `VARIANT_FILENAMES` key present, non-empty, and ≤ `MAX_UPLOAD_BYTES` each (or a documented total cap — prefer per-file ≤ 8 MB to reuse the constant).
     2. Confirms JPEG via magic bytes (`FF D8 FF`) — **not** PNG/WebP on this path (client already encoded JPEG).
     3. Reads dimensions with a **small JPEG SOF parser** (no sip `inspect` / `generateImageVariants` on this path).
     4. Asserts `og-1200x630.jpg` is exactly `OG_WIDTH` × `OG_HEIGHT`.
     5. For ladder variants (`original`, hero, large, medium, small): width ≤ variant max width/edge from `constants.ts`; width ≤ `original.jpg` width and height ≤ `original.jpg` height (no upscale vs original variant); `original.jpg` longest edge ≤ `ORIGINAL_MAX_EDGE`.
     6. `original.jpg` MUST be ≥ `MIN_IMAGE_WIDTH` × `MIN_IMAGE_HEIGHT` (same product floor as source uploads).
     Throws `ImageValidationError` on any failure. Prefer claimed width/height only as fallback if SOF parse fails (and still reject if claimed dims are missing/invalid) — primary path is re-inspect.
   - **Rationale:** Step brief forbids trusting client dims; avoids pulling sip into the accept path ahead of step 04.
   - **Alternatives:** Reuse sip `inspect` for dimensions (works today but keeps sip on the “no resize” path); skip dimension checks (too weak for admin-trusted-but-buggy clients).

3. **Atomicity / partial sets**
   - **Choice:** Validate **all six** before any R2 write. On validation failure, throw and upload nothing. On upload failure mid-`Promise.all`, best-effort `deleteImageObjects(imageId)` then rethrow. **Insert the DB row only after** successful upload (or after validation when `skipUpload: true`). Never return/store an image id for attach paths when validation failed.
   - **Rationale:** Spec scenario — no partial public image id referenced by events/partners.
   - **Alternatives:** Upload-then-validate (worse); DB-first (creates orphan rows).

4. **DB helper (`@unveiled/db`)**
   - **Choice:** Add `persistPrebuiltImage(db, input, options?)` alongside `persistImageFromSource` — calls `persistPrebuiltImageVariants`, then `db.insert(images)` with `source: "UPLOAD"` (or options.source), dimensions from returned metadata, `uploadedBy` from options. Do **not** change `attachImageToEvent` / `attachImageToPartner` signatures this step (step 03 switches forms).
   - **Rationale:** Dual path stays explicit; existing sip callers unchanged.
   - **Alternatives:** Extend `ImageAttachInput` with `type: "prebuilt"` now (slightly nicer, but unused until step 03 — optional if it stays small).

5. **Multipart / structured input contract (document for step 03)**
   - **Choice:** Document in `packages/images/README.md`:
     - Text fields: one file per variant; **field name = exact `VariantFilename`** (`original.jpg`, …, `og-1200x630.jpg`).
     - Text field `imageId` (UUID string).
     - Optional text fields `claimedWidth` / `claimedHeight` (integers; server re-inspects).
     - Library callers pass `Buffer`s; islands will append Blobs with those filenames in step 03.
   - **Rationale:** Field names match object keys / client `Record` keys — zero rename map.
   - **Alternatives:** Prefixed names (`variant_original`); nested `variants[...]` (harder in plain multipart).

6. **Testing**
   - **Choice:** Colocate `persist-prebuilt.test.ts` (or similar) under `packages/images`. Build fixtures from existing `createSolidJpeg` + current `generateImageVariants` **or** hand-craft minimal JPEG buffers with known SOF dimensions for reject cases. Cover: happy path with `skipUpload: true`; missing variant; non-JPEG bytes; wrong OG size; ladder wider than original / over cap. If a db helper is added, add a catalog unit test with mocked/in-memory db patterns already used in `@unveiled/db` (skip if no existing harness — prefer images package coverage first).
   - **Rationale:** Verification forbids live R2; sip may still be used in tests to *produce* golden variants until step 04 replaces fixtures.
   - **Alternatives:** Only integration tests against R2 (out of scope).

7. **Exports / docs**
   - **Choice:** Export the new persist + types from `packages/images/src/index.ts`. Update README Public API + multipart section. Leave product `image-uploads.md` with a short “draft notes” comment in the parent guide or step handoff — full product rewrite in step 04.
   - **Rationale:** Matches step cleanup checklist without scope-creeping product SoT.

## Risks / Trade-offs

- **[Risk] JPEG SOF parser edge cases (progressive, unusual APP markers)** → Mitigation: cover baseline JPEGs from Pica/`createSolidJpeg`; on unreadable dims reject with clear `ImageValidationError`; claim-dims fallback only when SOF fails and claims are present and consistent with OG/ladder rules.
- **[Risk] Orphan R2 objects if upload succeeds and DB insert fails** → Mitigation: acceptable (same class of failure as today); no event/partner FK until attach; optional later GC. Prefer insert-after-upload ordering.
- **[Risk] Per-variant 8 MB allows large total payload** → Mitigation: admin-only trusted flow; document; tighten in step 04 if needed.
- **[Risk] Dual path drift (sip vs prebuilt validation)** → Mitigation: shared constants; tests assert same OG/ladder caps; step 04 removes sip.
- **[Trade-off] No route wiring this step** → Mitigation: README multipart contract is the handoff artifact for step 03.
- **[Trade-off] openspec delta vs product SoT** → Planning contract only; update `docs/product/extras/image-uploads.md` in step 04.

## Migration Plan

1. Implement JPEG magic/SOF helpers + `validatePrebuiltVariants`.
2. Implement `persistPrebuiltImageVariants` (+ export); reuse `uploadImageVariants`.
3. Add `persistPrebuiltImage` in `@unveiled/db` catalog.
4. Unit tests (skipUpload); run `cd packages/images && bun test` (+ db tests if present).
5. Update `packages/images/README.md`; mark step 02 done in parent guide; draft notes for product doc.
6. Rollback = remove new helpers/exports; sip path unchanged.

## Open Questions

- None blocking. Whether `ImageAttachInput` gains a `prebuilt` discriminant can wait for step 03 if `persistPrebuiltImage` alone is enough for the first form switch.
