# @unveiled/images

Server-side image processing for Unveiled Berlin. Converts JPEG, PNG, or WebP sources into six fixed JPEG variants and uploads them to S3-compatible object storage (Cloudflare R2 recommended).

## Runtime

Image processing uses **`@standardagents/sip`** (WASM/scanline) on **Cloudflare Workers and local Node/Bun** — including admin multipart uploads on the Workers URL and `bun run seed:demo`. There is no `sharp` (or other Node-native image addon) dependency. Variant filenames and Content-Types are JPEG (`*.jpg` / `image/jpeg`).

The Workers build must include sip’s WASM (sip’s `workerd` export + `sip.wasm`). Do not externalize `@unveiled/images` from the Cloudflare Vite plugin.

**Known gap:** sip does not auto-apply EXIF orientation the way sharp’s `.rotate()` once did; orientation follows sip’s default decode behavior. JPEG objects may be larger than the former WebP variants at similar quality.

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

Each image id gets one folder with six files:

```
images/{id}/original.jpg
images/{id}/hero-1920.jpg
images/{id}/large-1280.jpg
images/{id}/medium-640.jpg
images/{id}/small-320.jpg
images/{id}/og-1200x630.jpg
```

## Variant specs

| File | Target | Behavior | Quality |
|---|---|---|---|
| `original.jpg` | Source dimensions, max 3840px edge | Re-encode only; never upscale | ~90 |
| `hero-1920.jpg` | Max width 1920 | Downscale only | ~82 |
| `large-1280.jpg` | Max width 1280 | Downscale only | ~80 |
| `medium-640.jpg` | Max width 640 | Downscale only | ~78 |
| `small-320.jpg` | Max width 320 | Downscale only | ~75 |
| `og-1200x630.jpg` | Fixed 1200×630 | Center cover-crop; may upscale | ~85 |

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
