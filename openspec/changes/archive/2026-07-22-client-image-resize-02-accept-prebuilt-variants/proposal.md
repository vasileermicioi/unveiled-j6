## Why

Step 01 can emit the six product JPEG variants in the browser, but the server still only knows how to resize from a single source via sip. This step adds a persist path that validates and stores a complete prebuilt variant set so step 03 can wire admin forms without re-encoding on Workers.

## What Changes

- Add `persistPrebuiltImageVariants(...)` (name flexible) in `@unveiled/images` that validates each of the six JPEGs, checks dimensions where practical, uploads via existing `uploadImageVariants`, and returns `ProcessedImageResult`-compatible metadata — **without** calling sip / `generateImageVariants`.
- Add a DB catalog helper (extend `persistImageFromSource` or add `persistPrebuiltImage`) that inserts one `images` row with `source = UPLOAD` (prefer reusing `UPLOAD`; new enum only if product docs require it).
- Document a clear input shape for route handlers: `imageId` (client- or server-generated UUID) + six buffers/blobs + original width/height; document multipart field naming in `packages/images/README.md`.
- Keep `processImageFromBuffer` / sip path working (dual path OK until step 04).
- Unit tests with `skipUpload: true` or mocked S3 covering accept/reject of malformed variant sets.
- **Out of this step:** admin island UX, sip removal, remote URL proxy, gallery multi-image, route form wiring (step 03).

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `image-uploads`: Server accepts a complete set of six prebuilt JPEG variants from a trusted admin upload flow, validates them, stores all six under `images/{id}/`, and inserts one `images` row without re-encoding or resizing on that path (maps to product planning delta in `.dev-plan/current-iteration/client-image-resize-02-accept-prebuilt-variants.md`; canonical product SoT remains `docs/product/extras/image-uploads.md` — full doc rewrite in step 04).

## Impact

- **Code:** `@unveiled/images` (new prebuilt persist/validate helpers on the main/server entry); `@unveiled/db` catalog (`persistImageFromSource` or sibling helper) callable by event/partner attach paths later.
- **APIs:** Library-only this step — no new HonoX routes; SSR form POST wiring is step 03.
- **Unchanged:** `buildVariantUrl`, variant filenames, JPEG Content-Type, R2 key layout `images/{id}/{filename}`, sip path for single-source uploads.
- **Tests:** `cd packages/images && bun test` (and `@unveiled/db` catalog tests if helpers live there) without live R2.
- **Docs this step:** Update `packages/images/README.md` for the new public API + multipart field naming; draft notes for `image-uploads.md` (full product doc update in step 04); mark step done in parent guide.
- **Source brief:** `.dev-plan/current-iteration/client-image-resize-02-accept-prebuilt-variants.md`
- **Parent:** `.dev-plan/current-iteration/client-image-resize-parent-guide.md`
- **Depends on:** `client-image-resize-01-pica-variant-generator` (done — `@unveiled/images/client`)
- **Consumed by:** `client-image-resize-03-wire-admin-uploads`
- **Verification:** `bun run lint`, `bun run typecheck`, `cd packages/images && bun test` (plus relevant db catalog tests) exit 0
