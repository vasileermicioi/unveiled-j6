# @unveiled/images

Image helpers for Unveiled Berlin: validate and store the six fixed JPEG variants in S3-compatible object storage (Cloudflare R2 recommended). Variant **generation** for admin uploads happens in the browser with Pica (`@unveiled/images/client`).

## Runtime

| Entry | Role |
|---|---|
| `@unveiled/images` | Server/Workers: prebuilt validate+upload, remote bytes fetch (admin proxy), S3, URLs |
| `@unveiled/images/client` | Browser: `generateImageVariantsClient` (Pica + OG cover-crop) — **do not** import from Workers routes |
| `@unveiled/images/offline` | Bun/scripts/tests only: solid JPEG + buffer→prebuilt via canvas shim — **never** import from Workers routes |

There is no `sharp` and no `@standardagents/sip`. Variant filenames and Content-Types are JPEG (`*.jpg` / `image/jpeg`).

## Environment variables

| Variable | Purpose |
|---|---|
| `S3_ENDPOINT` | S3-compatible API endpoint (R2 account host only — no bucket path) |
| `S3_REGION` | Region string (`auto` for R2) |
| `S3_BUCKET` | Bucket name |
| `S3_ACCESS_KEY_ID` | R2/S3 access key |
| `S3_SECRET_ACCESS_KEY` | R2/S3 secret key |
| `IMAGE_PUBLIC_BASE_URL` | Public read base URL (R2.dev subdomain or custom domain) |

Variant URLs: `{IMAGE_PUBLIC_BASE_URL}/images/{imageId}/{variant}.jpg`

## Storage layout

```
images/{id}/original.jpg
images/{id}/hero-1920.jpg
images/{id}/large-1280.jpg
images/{id}/medium-640.jpg
images/{id}/small-320.jpg
images/{id}/og-1200x630.jpg
```

## Validation

- Client source formats: JPEG, PNG, WebP
- Prebuilt path: each of the six variants must be JPEG
- Max upload size: 8 MB per file (source or per prebuilt variant)
- Min dimensions: 800×420 (`original.jpg` on the prebuilt path)

## Public API

- `persistPrebuiltImageVariants(input, options?)` — validate six client-built JPEGs, upload as-is (no resize); pass `skipUpload: true` in tests
- `validatePrebuiltVariants(input)` — validation-only helper
- `fetchRemoteImageBytes(url)` — ADMIN proxy helper (timeout, size, content-type, basic SSRF checks)
- `deleteImageObjects(imageId)` — delete all six bucket objects
- `buildVariantUrl(imageId, variantFilename)` — compute public CDN URL
- `validateImageBuffer(buffer)` — lightweight magic/dimension checks for tooling

DB insert helper: `persistPrebuiltImage` from `@unveiled/db/catalog/images`.

### Prebuilt multipart contract (admin forms)

| Field | Type | Notes |
|---|---|---|
| `imageId` | text | UUID (client-generated) |
| `original.jpg` … `og-1200x630.jpg` | file | **Field name = exact `VariantFilename`** |
| `claimedWidth` / `claimedHeight` | text (optional) | Integers; server re-inspects JPEG SOF headers and prefers inspected dims |
| `image_url` | text (optional) | Metadata / remote origin when variants came from the URL→proxy path |

## Tests

```bash
cd packages/images && bun test
```

Tests cover client generation (via offline canvas shim), prebuilt accept/reject rules, and remote URL safety helpers without live R2 credentials.
