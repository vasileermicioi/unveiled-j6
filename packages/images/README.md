# @unveiled/images

Server-side image processing for Unveiled Berlin. Converts JPEG, PNG, or WebP sources into six fixed WebP variants and uploads them to S3-compatible object storage (Cloudflare R2 recommended).

## Runtime

Requires **Node.js** — `sharp` uses native bindings and does not run on edge/Workers runtimes without swapping the processing library.

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

Each image id gets one folder with six files:

```
images/{id}/original.webp
images/{id}/hero-1920.webp
images/{id}/large-1280.webp
images/{id}/medium-640.webp
images/{id}/small-320.webp
images/{id}/og-1200x630.webp
```

## Variant specs

| File | Target | Behavior | Quality |
|---|---|---|---|
| `original.webp` | Source dimensions, max 3840px edge | Re-encode only; never upscale | ~90 |
| `hero-1920.webp` | Max width 1920 | Downscale only | ~82 |
| `large-1280.webp` | Max width 1280 | Downscale only | ~80 |
| `medium-640.webp` | Max width 640 | Downscale only | ~78 |
| `small-320.webp` | Max width 320 | Downscale only | ~75 |
| `og-1200x630.webp` | Fixed 1200×630 | Center cover-crop; may upscale | ~85 |

## Validation

- Accepted formats: JPEG, PNG, WebP
- Max upload size: 8 MB (raw input)
- Min dimensions: 800×420

## Public API

- `processImageFromBuffer(buffer, options?)` — validate, generate six variants, upload to bucket
- `processImageFromUrl(url, options?)` — fetch remote image, same pipeline
- `generateImageVariants(buffer, options)` — resize-only helper (used in tests; pass `skipUpload: true` on process helpers to avoid S3)
- `deleteImageObjects(imageId)` — delete all six bucket objects
- `buildVariantUrl(imageId, variantFilename)` — compute public CDN URL

## Tests

```bash
cd packages/images && bun test
```

Tests cover resize/crop logic without requiring live R2 credentials (`skipUpload` / `generateImageVariants` only).
