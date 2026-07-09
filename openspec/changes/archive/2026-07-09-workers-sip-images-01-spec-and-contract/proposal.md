## Why

The next Workers-native image processor (`@standardagents/sip`) only encodes JPEG, so the product contract of six WebP variants cannot survive the migration. This change locks the JPEG filename/MIME contract in migration docs and `@unveiled/images` public constants **before** sip lands, so later steps implement against one agreed surface and staging does not keep a dual WebP/JPEG forever.

## What Changes

- **BREAKING:** Six fixed variant filenames become `*.jpg` (not `*.webp`); R2 objects use Content-Type `image/jpeg`.
- Update `docs/migration/extras/image-uploads.md` for JPEG variants, quality ladder unchanged, and hosting note targeting `@standardagents/sip` on Cloudflare Workers (and local Node).
- Record the WebP→JPEG reopen in `docs/migration/extras/gaps-and-decisions.md`.
- Change `VARIANT_FILENAMES` / README / hard-coded call sites (`apps/web`, `packages/ui`, tests) to `.jpg`.
- Prefer switching the temporary sharp encode path from `.webp()` to `.jpeg({ quality })` so local uploads still match the new filenames (sip itself is **not** introduced here).
- Light touch only on `AGENTS.md` / `DEPLOYMENT.md` hosting wording; full rewrite stays in step 04.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-catalog`: Six-variant pipeline and admin/public surfaces require JPEG filenames and `image/jpeg` objects instead of WebP.
- `platform-foundation`: Image processing runtime target moves from “sharp / Node-only Option B” toward Workers-capable processing documented as `@standardagents/sip` (implementation in later child changes).

## Impact

- **Packages:** `@unveiled/images` (`constants.ts`, `process.ts`, `s3.ts`, README, unit tests); `@unveiled/ui` image URL helpers.
- **App:** Admin list/edit thumbnails, catalog mappers, SEO `og:image` / JSON-LD image URLs hard-coding `.webp`.
- **Docs:** `docs/migration/extras/image-uploads.md`, `gaps-and-decisions.md`; optional light notes in `AGENTS.md` / `DEPLOYMENT.md`.
- **Data:** Existing R2 WebP objects break until re-seed/re-upload (called out; cleanup owned by step 04).
- **Out of scope:** sip dependency, WASM bundling, removing `IMAGE_PROCESSING_UNAVAILABLE`, e2e/DEPLOYMENT full rewrite, Cloudflare Images product.
