## Why

Workers still resize admin uploads with `@standardagents/sip` WASM, which bloats the deploy bundle and blocks multi-file gallery uploads. This first slice adds a browser-side Pica generator that emits the same six JPEG variants so later steps can upload prebuilt bytes without server resize.

## What Changes

- Add a **Pica-based client variant generator** (prefer thin shared helper + optional `@unveiled/images` browser entry that does **not** import sip/S3) producing the six fixed filenames.
- Mirror server rules: downscale-only aspect-preserving ladder; OG center **cover-crop** to exactly 1200×630; `original` longest edge capped at 3840; reject undersized sources (<800×420) and non-accepted MIME types where feasible.
- Add **fixture-based unit tests** (no R2, no Workers, no S3 credentials) asserting all six blobs and OG dimensions.
- **Out of this step:** R2 upload, admin form wiring, sip removal, remote URL proxy, HeroUI upload UI, multi-select gallery.

## Capabilities

### New Capabilities

- `image-uploads`: Client-side generation contract for the six product JPEG variants (`original.jpg`, `hero-1920.jpg`, `large-1280.jpg`, `medium-640.jpg`, `small-320.jpg`, `og-1200x630.jpg`) matching existing dimension / non-upscale rules (maps to product `docs/product/extras/image-uploads.md` and step brief Spec Delta).

### Modified Capabilities

- _(none)_

## Impact

- **Deps:** `pica` where the client generator lives (`apps/web` and/or a browser-only export of `@unveiled/images`); do **not** force Workers to bundle Pica; do **not** import `@standardagents/sip` from the new client path.
- **Code:** Shared generator API roughly `generateImageVariantsClient(file | Blob | ImageBitmap)` → `{ imageId?, metadata, variants: Record<VariantFilename, Blob> }`; reuse `VARIANT_FILENAMES` / size-quality constants from `packages/images/src/constants.ts`.
- **Tests:** Package or app `bun test` covering dimensions / file presence on a known fixture.
- **Docs this step:** No `docs/product/` behavior rewrite yet (pipeline still server-side until later steps); mark step done in parent guide; note import path if non-obvious.
- **Unchanged:** Public `buildVariantUrl` shape, JPEG Content-Type, R2 key layout, server `generateImageVariants` (sip path remains until step 04).
- **Source brief:** `.dev-plan/current-iteration/client-image-resize-01-pica-variant-generator.md`
- **Parent:** `.dev-plan/current-iteration/client-image-resize-parent-guide.md`
- **Depends on:** none
- **Consumed by:** `client-image-resize-02-accept-prebuilt-variants`
- **Verification:** `bun run lint`, `bun run typecheck`, and generator unit tests exit 0 without S3 credentials
