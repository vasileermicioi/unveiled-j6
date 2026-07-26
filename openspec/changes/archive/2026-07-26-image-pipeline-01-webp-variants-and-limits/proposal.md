## Why

Admin image uploads still force JPEG-only storage, an `original` master, and hard 800×420 / 8 MB gates, which blocks SVG and other browser-decodable sources and keeps heavier objects than the product needs. This first Image pipeline slice switches the shared contract to five WebP resized variants with open acceptance so later steps (required partner logos, variant gallery UX, docs) build on the final storage shape.

## What Changes

- **BREAKING:** Variant set becomes exactly five WebP files — `hero-1920.webp`, `large-1280.webp`, `medium-640.webp`, `small-320.webp`, `og-1200x630.webp` — and drops `original.jpg` / any source-master object.
- **BREAKING:** Public/admin URLs and multipart field names move from `*.jpg` to `*.webp`; Content-Type becomes `image/webp`.
- Client generator accepts any browser-decodable image (including SVG), rasterizes, resizes with Pica, encodes WebP only; never uploads raw SVG or source bytes.
- Remove product enforcement of `MIN_IMAGE_WIDTH` / `MIN_IMAGE_HEIGHT` (800×420) and `MAX_UPLOAD_BYTES` (8 MB) on client and prebuilt server validation (keep only documented abuse/SSRF guards on the remote proxy if needed).
- Server validates complete prebuilt WebP sets; OG remains exactly 1200×630; ladder non-upscale rules apply against measurable source/claimed dimensions without an `original` object.
- Update admin multipart parsers/`accept`, package README, unit/offline tests, demo seed prebuilt packs, and all `buildVariantUrl(..., "*.jpg")` call sites.
- Provide a one-shot offline R2 JPEG→WebP migration path for existing `images.id` objects (preferred parent decision), or record an explicit deferred follow-up if staging chooses re-upload-on-edit instead.
- Product/BDD/`docs/product/extras/image-uploads.md` full rewrite stays in step 04; this change updates code + OpenSpec `image-uploads` delta.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `image-uploads`: Five WebP variants (no original); browser-decodable source acceptance including SVG; remove 800×420 and 8 MB product gates; prebuilt server path validates/stores WebP only.

## Impact

- **Package:** `@unveiled/images` — `constants.ts`, client generate/validate/decode, `prebuilt.ts`, `validation.ts`, `remote-fetch.ts`, `urls.ts`, offline/seed helpers, README, package tests.
- **Admin web:** `AdminImageVariantFields.tsx`, `admin-image-variants.ts`, `admin-prebuilt-image.ts`, `EventImageUpload.tsx` (and related multipart parsers/tests).
- **Consumers:** SEO/`buildVariantUrl` call sites, event/partner cards/thumbnails, gallery helpers, `@unveiled/db` seed, `scripts/*` bake/fetch seed packs, Ladle/story mocks using `*.jpg`.
- **Storage:** R2/S3 keys under `images/{id}/*.webp`; migration script or deferred re-upload for legacy `*.jpg`.
- **Unchanged this step:** partner `logo_image_id` NOT NULL (02); variant preview gallery / submit-guard polish (03); canonical product SoT / BDD / DEPLOYMENT narrative sync (04).
- **Source brief:** `.dev-plan/current-iteration/image-pipeline-01-webp-variants-and-limits.md`
- **Parent:** `.dev-plan/current-iteration/image-pipeline-parent-guide.md`
- **Depends on:** none
- **Consumed by:** `image-pipeline-02-partner-logo-required`, `image-pipeline-03-client-errors-and-variant-gallery`
- **Verification:** `cd packages/images && bun test`; `bun run lint`; `bun run typecheck`; manual PNG/JPEG/WebP/SVG → five WebP + prebuilt validate without min-size / 8 MB reject
