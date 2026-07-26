## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/image-pipeline-01-webp-variants-and-limits.md` and parent guide non-goals / release criteria / Risks
- [x] 1.2 Confirm R2 migration approach matches design Decision 6 (offline re-encode script in this step; record deferral in parent Risks only if staging blocks the run)
- [x] 1.3 Skim current `@unveiled/images` constants, client generate/validate, prebuilt, remote-fetch, and admin multipart field wiring

## 2. Package constants and client generator

- [x] 2.1 Update `VARIANT_FILENAMES` to the five `.webp` names; remove `original` / product `MIN_*` / product `MAX_UPLOAD_BYTES`; add WebP quality constants and `REMOTE_FETCH_MAX_BYTES` (abuse cap)
- [x] 2.2 Broaden client decode path for browser-decodable sources including SVG; keep rasterize → canvas only
- [x] 2.3 Rewrite client generate path: Pica resize ladder + OG cover-crop → `canvas.toBlob('image/webp')`; drop original generation; stop dimension/8 MB product rejects
- [x] 2.4 Update client unit tests for five WebP outputs, undersized sources, and non-JPEG/SVG acceptance (as far as the test harness allows)

## 3. Server prebuilt validation, storage, proxy

- [x] 3.1 Add WebP magic/dimension helpers; update `validatePrebuiltVariants` for five WebP files, claimed source dims for non-upscale, OG 1200×630, no min-size / product 8 MB gates
- [x] 3.2 Set S3 Content-Type `image/webp`; update delete/upload helpers for new filenames
- [x] 3.3 Update remote-fetch proxy to accept browser-decodable image bytes (incl. SVG) with documented abuse byte/timeout caps only
- [x] 3.4 Update package README and prebuilt/offline unit tests; run `cd packages/images && bun test`

## 4. Admin multipart and app consumers

- [x] 4.1 Wire admin multipart field names + `accept` (`image/*` / `.svg` as needed) in `AdminImageVariantFields`, parsers, and `EventImageUpload`
- [x] 4.2 Update `admin-prebuilt-image` / related tests for WebP fields and claimed dimensions
- [x] 4.3 Replace all `buildVariantUrl(..., "*.jpg")` and hard-coded `*.jpg` variant URL usages in `apps/web`, stories, SEO, cards, gallery helpers
- [x] 4.4 Update `@unveiled/db` seed and `scripts/*` bake/fetch paths to emit/upload five WebP packs; regenerate offline/seed `*.variants` fixtures

## 5. R2 migration

- [x] 5.1 Implement offline JPEG→WebP migration script (largest available JPEG per `images.id` → five WebP → upload → delete `.jpg` after success; prefer two-phase upload-then-delete)
- [x] 5.2 Document how to run the script (package README and/or short note for step 04 DEPLOYMENT sync)
- [x] 5.3 If staging cannot run migration yet, record “migration pending run” under parent guide Risks instead of silently switching to re-upload-on-edit

## 6. Verification and handoff

- [x] 6.1 Run `cd packages/images && bun test` (exit 0)
- [x] 6.2 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 6.3 Manual/local: process PNG, JPEG, WebP, and SVG through the client generator; confirm five WebP blobs and successful prebuilt validate (no min-size / no 8 MB reject on a small image)
- [x] 6.4 Mark step 01 done in `image-pipeline-parent-guide.md`; note residual JPEG keys or deferred migration in parent Risks; do not rewrite full product SoT (step 04)
