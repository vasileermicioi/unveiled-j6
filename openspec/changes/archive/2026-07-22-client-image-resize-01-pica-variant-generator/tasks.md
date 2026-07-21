## 1. Setup

- [x] 1.1 Confirm prerequisites: `packages/images/src/constants.ts`, `packages/images/src/process.ts`, `docs/product/extras/image-uploads.md` §1, and parent guide non-goals/release criteria
- [x] 1.2 Add `pica` (and types if needed) to `@unveiled/images`; add package export `@unveiled/images/client` (or `./browser`) that does not pull sip/S3 into the client graph
- [x] 1.3 Ensure main `@unveiled/images` entry does **not** re-export the client generator

## 2. Client generator

- [x] 2.1 Implement client-side validation (size, MIME when available, min 800×420) throwing `ImageValidationError` without calling sip `validateImageBuffer`
- [x] 2.2 Implement `generateImageVariantsClient` producing all six JPEG `Blob`s keyed by `VARIANT_FILENAMES`, using constants for caps/qualities
- [x] 2.3 Implement aspect-preserving Pica downscale-only ladder for `original` / hero / large / medium / small (never upscale; original longest edge ≤ 3840)
- [x] 2.4 Implement OG center cover-crop to exactly 1200×630 via canvas, then JPEG encode at `OG_QUALITY`

## 3. Tests

- [x] 3.1 Add fixture or solid-source harness usable under Bun for the client generator (DOM/canvas polyfill only if required)
- [x] 3.2 Unit-test: six JPEG blobs present; OG dimensions 1200×630; ladder widths respect caps and no-upscale on a min-size source
- [x] 3.3 Unit-test: undersized source rejects without a partial variants map

## 4. Verification & handoff

- [x] 4.1 Run `cd packages/images && bun test` (or equivalent covering the new generator) — exit 0 without S3 credentials
- [x] 4.2 Run `bun run lint` and `bun run typecheck` — exit 0
- [x] 4.3 Mark step 01 done in `.dev-plan/current-iteration/client-image-resize-parent-guide.md` and note the new import path if non-obvious
- [x] 4.4 Do **not** change `docs/product/extras/image-uploads.md` product behavior yet (still server-side until later steps)
