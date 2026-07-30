# @unveiled/images

Image helpers for Unveiled Berlin: validate and store the five fixed WebP variants in S3-compatible object storage (Cloudflare R2 recommended). Variant **generation** for admin uploads happens in the browser with Pica (`@unveiled/images/client`).

## Runtime

| Entry | Role |
|---|---|
| `@unveiled/images` | Server/Workers: prebuilt validate+upload, remote bytes fetch (admin proxy), S3, URLs |
| `@unveiled/images/client` | Browser: `generateImageVariantsClient` (Pica + OG cover-crop → WebP) — **do not** import from Workers routes |
| `@unveiled/images/offline` | Bun/scripts/tests only: solid JPEG/WebP + buffer→prebuilt via canvas shim — **never** import from Workers routes |

There is no `sharp` and no `@standardagents/sip`. Variant filenames and Content-Types are WebP (`*.webp` / `image/webp`). No `original` / source-master object is stored.

## Environment variables

| Variable | Purpose |
|---|---|
| `S3_ENDPOINT` | S3-compatible API endpoint (R2 account host only — no bucket path) |
| `S3_REGION` | Region string (`auto` for R2) |
| `S3_BUCKET` | Bucket name |
| `S3_ACCESS_KEY_ID` | R2/S3 access key |
| `S3_SECRET_ACCESS_KEY` | R2/S3 secret key |
| `IMAGE_PUBLIC_BASE_URL` | Public read base URL (R2.dev subdomain or custom domain) |

Variant URLs: `{IMAGE_PUBLIC_BASE_URL}/images/{imageId}/{variant}.webp`

## Storage layout

```
images/{id}/hero-1920.webp
images/{id}/large-1280.webp
images/{id}/medium-640.webp
images/{id}/small-320.webp
images/{id}/og-1200x630.webp
```

## Validation

- Client source formats: any image the browser can decode (including SVG); output is always WebP. SVG is rasterized to ≥ hero width (1920) so ladder variants stay sharp; raster bitmaps are never upscaled on the ladder
- Prebuilt path: each of the five variants must be WebP; `claimedWidth` / `claimedHeight` required
- No product min dimensions (former 800×420 removed) and no product max upload size (former 8 MB removed)
- Remote proxy abuse ceiling: `REMOTE_FETCH_MAX_BYTES` (32 MB) + `REMOTE_FETCH_TIMEOUT_MS` — DoS guard only
- OG variant must be exactly 1200×630; ladder variants must not exceed their max width or the claimed source size

## Public API

- `persistPrebuiltImageVariants(input, options?)` — validate five client-built WebPs, upload as-is (no resize); pass `skipUpload: true` in tests
- `validatePrebuiltVariants(input)` — validation-only helper
- `fetchRemoteImageBytes(url)` — ADMIN proxy helper (timeout, abuse byte cap, `image/*` content-type, basic SSRF checks)
- `deleteImageObjects(imageId)` — delete all five bucket objects
- `buildVariantUrl(imageId, variantFilename)` — compute public CDN URL
- `validateImageBuffer(buffer)` — lightweight magic/dimension checks for tooling

DB insert helper: `persistPrebuiltImage` from `@unveiled/db/catalog/images`.

### Prebuilt multipart contract (admin forms)

| Field | Type | Notes |
|---|---|---|
| `imageId` | text | UUID (client-generated) |
| `hero-1920.webp` … `og-1200x630.webp` | file | **Field name = exact `VariantFilename`** |
| `hero-1920.webp__b64` … (same for each variant) | string | Base64 WebP backup when file inputs are stripped |
| `claimedWidth` / `claimedHeight` | text | Required positive integers (decoded source size) |
| `image_url` | text (optional) | Metadata / remote origin when variants came from the URL→proxy path |

File inputs use `accept="image/*,.svg"`. Raw SVG/source bytes are never uploaded — only the five WebP variants.

## Migrating legacy JPEG objects

One-shot offline re-encode (largest available legacy JPEG → five WebP → upload → delete `.jpg`):

```bash
bun scripts/migrate-r2-jpeg-to-webp.ts
# dry-run:
bun scripts/migrate-r2-jpeg-to-webp.ts --dry-run
```

Requires the same S3/R2 env vars as seed/upload. Prefer two-phase deploy: upload WebP while app still serves JPEG, flip consumers to `.webp`, then delete JPEG keys (the script uploads WebP then deletes JPEG per image id).

## Backfilling NULL partner logos

Root `bun run db:migrate` runs `scripts/backfill-partner-logos.ts` before Drizzle applies the `partners.logo_image_id` NOT NULL migration. The script attaches a solid five-variant WebP placeholder (via `@unveiled/images/offline`) for any NULL logos. Staging/production should have S3 env set so objects are uploaded; without S3 it uses `skipUpload` (DB row only).

```bash
bun scripts/backfill-partner-logos.ts
bun scripts/backfill-partner-logos.ts --dry-run
bun scripts/backfill-partner-logos.ts --skip-upload
```

## Tests

```bash
cd packages/images && bun test
```

Tests cover client generation (via offline canvas shim), prebuilt accept/reject rules, and remote URL safety helpers without live R2 credentials.
