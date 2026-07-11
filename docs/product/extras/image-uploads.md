# Image Uploads (MVP)

Ported for `docs/product/`. Admin uploads only in MVP; partner self-service uploads are **post-MVP**. Six **JPEG** variants via `@standardagents/sip` — see filenames below.

**Decided (supersedes the earlier "no image upload in v1, URL-only" call in `extras/gaps-and-decisions.md`):** the rewrite gets a real image upload pipeline — S3-compatible object storage, with every image processed server-side into a fixed set of JPEG size variants at upload time. This applies uniformly to **event images** (`events`, required) and **partner logos** (`partners`, optional) — one pipeline, one `images` table, no per-entity special-casing.

This replaces two things from the old app at once, both covered in `ui/assets-inventory.md`:
- The plain-URL-only text field (no processing, no control over dimensions/format/weight, hotlinks a third party's file indefinitely).
- The old app's actual (undocumented until a later audit pass) file-picker, which bypassed Firebase Storage and wrote a raw base64 data URI straight into the `imageUrl`/`logoUrl` column — never carry this forward; it bloats the database and skips the whole point of a CDN.

## 1. Storage layout and the six files

Every image, regardless of source (admin upload, partner upload, or a pasted remote URL — see §3), gets its own folder in the bucket, keyed by its `images.id` (UUID):

```
{BUCKET}/images/{imageId}/original.jpg
{BUCKET}/images/{imageId}/hero-1920.jpg
{BUCKET}/images/{imageId}/large-1280.jpg
{BUCKET}/images/{imageId}/medium-640.jpg
{BUCKET}/images/{imageId}/small-320.jpg
{BUCKET}/images/{imageId}/og-1200x630.jpg
```

All six are generated once, synchronously, as part of the same request that creates/edits the event or partner (see §4) — there is no async/background processing step in v1, and no partial state where some variants exist and others don't.

The filenames are a **fixed, universal convention** — never stored per-row in the database. A variant's public URL is always computed in code as `{IMAGE_PUBLIC_BASE_URL}/images/{imageId}/{filename}`; see §6 for `IMAGE_PUBLIC_BASE_URL`. Variant objects use Content-Type `image/jpeg`.

### Variant specs

| File | Target | Resize behavior | Quality | Used for |
|---|---|---|---|---|
| `original.jpg` | Source dimensions, capped at 3840px on the longest edge | Re-encoded to JPEG; only downscaled if the source exceeds the cap, never upscaled | ~90 (near-lossless) | Master copy — re-processing source if variant specs ever change; not linked from any page |
| `hero-1920.jpg` | Max width 1920 | Downscale only, preserve aspect ratio | ~82 | Event detail page hero banner (`ui/ui-component-map.md`), `schema.org/Event` JSON-LD `image` (`extras/seo-and-metadata.md`) |
| `large-1280.jpg` | Max width 1280 | Downscale only, preserve aspect ratio | ~80 | `srcset` step for the hero banner on medium viewports |
| `medium-640.jpg` | Max width 640 | Downscale only, preserve aspect ratio | ~78 | `EventCard` grid thumbnail (`/discover`, `/events`, `/saved`), default partner-logo display size |
| `small-320.jpg` | Max width 320 | Downscale only, preserve aspect ratio | ~75 | Mobile `srcset` step for `EventCard`; admin/partner table-row thumbnails (`/admin/events`, `/admin/partners`, `/partner/events`) |
| `og-1200x630.jpg` | Fixed 1200×630 (the standard 1.91:1 Open Graph ratio) | **Cover-crop** (center-crop to fill exactly, not letterboxed) — the one variant that may slightly *upscale* a smaller source, since a mildly-upscaled crop is preferable to shipping a non-standard OG image size | ~85 | `og:image` / Twitter Card `twitter:image` (`extras/seo-and-metadata.md`) |

**Never upscale** for the five aspect-preserving variants: if the source is smaller than a variant's target (e.g. a 500px-wide upload), generate that variant at the source's native width instead of stretching it — a blurry upscaled fake-1920 image is worse than a smaller-but-crisp one. `og-1200x630` is the deliberate exception, since social platforms hard-require that ratio/size.

To keep that exception from producing a visibly blurry OG image, reject uploads/URLs smaller than **800×420** at validation time (see §5) — small enough to allow reasonably-sized real photos, large enough that the `og-1200x630` upscale factor never exceeds ~1.5×.

## 2. Why JPEG, why these five widths

- **JPEG everywhere:** All six variants are JPEG (`image/jpeg`) because the Workers-native processor (`@standardagents/sip`) only encodes JPEG. Input may still be JPEG, PNG, or WebP; output is always JPEG. Universal browser support means no `<picture>`/format-fallback complexity.
- **Widths chosen to match real breakpoints, not arbitrary halving:** 320/640/1280/1920 line up with common device-width buckets (small phone, large phone/small tablet @2x, laptop, desktop/retina hero), so `srcset`/`sizes` picks a variant close to the actual rendered size instead of always shipping the largest one.
- **`og-1200x630` is its own thing, not reused from the width ladder,** because Open Graph/Twitter Cards require a specific aspect ratio (1.91:1) that none of the width-ladder variants share (those preserve the source's native aspect ratio, whatever it is).

## 3. Two ways in, one pipeline

Both event and partner forms (`admin-events.feature`, `admin-partners.feature`, `partner-portal.feature`) keep **two ways to supply an image**, matching the old app's dual UI (text field + file picker), but now both paths converge on the exact same server-side pipeline instead of one being a no-op text field:

1. **Direct upload** — a `<input type="file" accept="image/jpeg,image/png,image/webp">` in the same multipart form as the rest of the event/partner fields (see §4 for why a plain multipart POST, not a separate upload endpoint/JS widget).
2. **Remote URL** — admin/partner pastes a URL to an already-hosted image (as most seed data does today); the server fetches it (`fetch()` server-side, following redirects, with a reasonable timeout and the same size/type validation as a direct upload) and runs it through the identical resize pipeline, so the result is byte-for-byte the same as if that image had been uploaded directly. This closes the hotlinking risk of the old URL-only approach (a third party can rename/delete/rate-limit the original — our own copy in our own bucket doesn't care) while keeping the low-friction "just paste a link" path for admins re-using existing marketing photography.

Only one of the two fields may be filled per submission; both empty is a validation error for events (image required) and is fine for partners (logo optional, per `partners.logo_image_id` being nullable — see `database/schema-overview.md`). Both filled is also a validation error (ambiguous — ask the admin/partner to pick one).

## 4. Where processing happens (fits the SSR-only, no-required-JS convention)

This is a natural fit for the project's existing "every mutation is its own page, no client-side-only state" rule (`sitemap/sitemap.md`), not a special case:

- The event/partner create/edit forms are already plain `<form method="POST">` SSR pages. Adding `enctype="multipart/form-data"` is the only change needed for the file-picker path to work — no client JS/`fetch()` is required for the form to submit correctly, consistent with the rest of the app's progressive-enhancement posture.
- A small **optional, JS-enhanced** client-side preview (`URL.createObjectURL()` showing a thumbnail of the picked file before submit) is a nice-to-have island, not a requirement — the form still works with JS disabled.
- On submit, the same POST handler that validates/saves the rest of the event/partner fields also: (1) reads the uploaded file's bytes from the multipart body (or fetches the pasted URL), (2) validates it (§5), (3) generates all six variants, (4) uploads all six objects to the bucket, (5) inserts one `images` row, (6) inserts/updates the `events`/`partners` row with the resulting `image_id`/`logo_image_id`. Steps 3–6 happen synchronously within the request — no background job, no "processing..." intermediate page, matching how every other mutation in this app is a single request/redirect.
- If any step fails (bad file, fetch error, bucket write error), the whole request fails and re-renders the form with a validation error, same as any other rejected submission (`extras/pagination-and-search.md`'s sibling docs use the same request/response shape for every other form in the app).
- **Edge-case/acceptable gap:** if step 6 fails after 3–5 already succeeded, the new `images` row is orphaned (uploaded to the bucket, inserted in the DB, but never referenced by an event/partner). Not a v1 requirement to prevent — a periodic sweep job (delete `images` rows older than e.g. 24h with no referencing `events.image_id`/`partners.logo_image_id`) is a reasonable future cleanup task, not launch-blocking.

## 5. Validation

| Rule | Value |
|---|---|
| Accepted input formats | JPEG, PNG, WebP (matches the old app's `accept="image/jpeg,image/png"`, WebP added since it's an increasingly common export format) |
| Max upload size | 8 MB (raw input file, before processing) |
| Min dimensions | 800×420 (keeps the `og-1200x630` upscale factor reasonable — see §1) |
| Required? | **Events:** yes, one of upload-or-URL required to create/edit an event (matches `admin-events.feature`'s existing `image` field being non-optional). **Partners:** no, `logo_image_id` stays nullable, matching today's optional logo |

## 6. Object storage provider and configuration

**S3-compatible object storage**, provider left open (per this project's existing pattern of not over-specifying infra — see `extras/integrations-and-config.md`'s hosting note) but **Cloudflare R2** is the recommended default: S3-compatible API (works with the standard `@aws-sdk/client-s3` SDK, no special client needed), zero egress fees (this app serves a lot of image traffic for free/low-margin browsing), and a public bucket / custom domain can front it directly without a separate CDN if desired. Any other S3-compatible provider (AWS S3 + CloudFront, Backblaze B2, etc.) works identically against the same code, since only the endpoint/credentials change.

New environment variables (add to `extras/integrations-and-config.md`'s table):

| Variable | Purpose |
|---|---|
| `S3_ENDPOINT` | S3-compatible API endpoint (provider-specific; omit/default for real AWS S3) |
| `S3_REGION` | Region string (required by the S3 API shape even for providers without real regions, e.g. `auto` for R2) |
| `S3_BUCKET` | Bucket name |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Credentials, scoped to this one bucket only |
| `IMAGE_PUBLIC_BASE_URL` | The public-facing base URL variant URLs are built from (custom domain fronting the bucket, or the provider's public bucket URL/CDN) — kept separate from `S3_ENDPOINT` because the API endpoint and the public read URL are frequently different hosts |

## 7. Runtime note (implementation detail, not a decision blocker)

Server-side resizing runs via **`@standardagents/sip`** (Small Image Processor) — a WASM/scanline library that works on **Cloudflare Workers** and local Node. All six variants are JPEG because sip only encodes JPEG. The historical Node-only `sharp` / “Option B local uploads” hosting assumption is superseded by this Workers-capable pipeline (sip lands in a follow-up implementation step; the JPEG filename and Content-Type contract is already the product source of truth).

## 8. Deletion and cleanup

Images have **no legal retention requirement** (unlike bookings/ledger entries, which are kept anonymized forever for German accounting rules — `database/schema-overview.md`'s "Account deletion" section) — there's no reason to keep orphaned files around.

- **Replacing an image** (editing an event/partner to a new upload/URL): delete the old `images` row and all six of its bucket objects in the same request that saves the new one.
- **Deleting an event or partner**: delete its associated `images` row and bucket objects as part of the same deletion flow (`/admin/events/:id/delete`, `/partner/events/:id/delete`, `/admin/partners/:id/delete` — `sitemap/sitemap.md`).
- Do this **synchronously in the request** for v1 (six small object deletes is fast) rather than queuing a background job — consistent with §4's "no background processing" posture. Revisit only if this measurably slows down the delete/edit request path in practice.

## 9. What this doc deliberately does not cover

- **Image moderation/content scanning** — not a requirement for a curated, admin/partner-only upload surface (no end-user-generated image content anywhere in this product).
- **Cropping/editing UI** (letting the admin manually choose a crop region before the pipeline runs) — the automatic center-crop for `og-1200x630` is good enough for v1; a manual crop tool is a future nice-to-have, not a launch requirement.
- **Multi-image galleries per event** — the product model is one image per event/one logo per partner, matching the old app's data shape (`events.image_url`/`partners.logo_url` were both singular). Not revisited here.
