# Image Uploads (MVP)

Ported for `docs/product/`. Admin uploads only in MVP; partner self-service uploads are **post-MVP**. Six **JPEG** variants — see filenames below.

**Decided (supersedes the earlier "no image upload in v1, URL-only" call in `extras/gaps-and-decisions.md`):** the rewrite gets a real image upload pipeline — S3-compatible object storage, with every image turned into a fixed set of JPEG size variants. This applies uniformly to **event images** (`events`, required) and **partner logos** (`partners`, optional) — one pipeline, one `images` table, no per-entity special-casing.

**Processing location (current):** the admin **file picker** generates the six variants **in the browser with Pica** (`@unveiled/images/client`). The server **validates and stores** prebuilt JPEG variants only — it does not resize. Event admin UI is file-upload only (no paste-URL / “Process URL” field). **JavaScript is required** for admin image supply.

This replaces two things from the old app at once, both covered in `ui/assets-inventory.md`:
- The plain-URL-only text field (no processing, no control over dimensions/format/weight, hotlinks a third party's file indefinitely).
- The old app's actual (undocumented until a later audit pass) file-picker, which bypassed Firebase Storage and wrote a raw base64 data URI straight into the `imageUrl`/`logoUrl` column — never carry this forward; it bloats the database and skips the whole point of a CDN.

## 1. Storage layout and the six files

Every image, regardless of source (admin file upload or demo seed packs), gets its own folder in the bucket, keyed by its `images.id` (UUID):

```
{BUCKET}/images/{imageId}/original.jpg
{BUCKET}/images/{imageId}/hero-1920.jpg
{BUCKET}/images/{imageId}/large-1280.jpg
{BUCKET}/images/{imageId}/medium-640.jpg
{BUCKET}/images/{imageId}/small-320.jpg
{BUCKET}/images/{imageId}/og-1200x630.jpg
```

All six are produced client-side (or offline for seed) before the catalog mutation POST; the server stores the complete set in that same request — there is no async/background processing step in v1, and no partial state where some variants exist and others don't.

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

- **JPEG everywhere:** All six variants are JPEG (`image/jpeg`) for a single Content-Type contract and universal browser support (no `<picture>`/format-fallback complexity). Input may still be JPEG, PNG, or WebP; output is always JPEG.
- **Widths chosen to match real breakpoints, not arbitrary halving:** 320/640/1280/1920 line up with common device-width buckets (small phone, large phone/small tablet @2x, laptop, desktop/retina hero), so `srcset`/`sizes` picks a variant close to the actual rendered size instead of always shipping the largest one.
- **`og-1200x630` is its own thing, not reused from the width ladder,** because Open Graph/Twitter Cards require a specific aspect ratio (1.91:1) that none of the width-ladder variants share (those preserve the source's native aspect ratio, whatever it is).

## 3. Two ways in, one client pipeline

Admin event forms keep **two ways to supply an image**, matching the old app's dual UI (text field + file picker). Partner logo forms use the file picker (same variant contract). Both converge on the same **client Pica → prebuilt persist** path:

1. **Direct upload** — file input on the SSR multipart form; the admin island runs Pica before submit and posts six variant files + `imageId`.
2. **Remote URL** — admin pastes a URL; the island calls `POST /:locale/admin/image-proxy` (ADMIN session required) to fetch bytes server-side, then runs the same Pica generator and posts prebuilt variants. The URL may be kept as `images.sourceUrl` metadata.

Only one supply path may be active per submission; both empty is a validation error for events (image required) and is fine for partners (logo optional). File + URL together is a validation error.

## 4. Where processing happens

- Catalog mutations remain SSR form POSTs (`enctype="multipart/form-data"`).
- **Admin image supply requires JavaScript** (file and URL). Non-image admin forms are unchanged.
- On submit with a new image, the POST body includes the six prebuilt JPEG fields (`VARIANT_FILENAMES`) + `imageId` (+ optional claimed dimensions / `image_url` metadata). The handler validates and stores those bytes — **no Worker-side resize**.
- Demo seed uses pre-baked six-variant packs on disk (`*.jpg.variants/`) so Workers seed never needs a WASM encoder. Bun scripts may use `@unveiled/images/offline` (never import that from Workers routes).
- If validation or bucket write fails, the request re-renders the form with an error (same as other admin forms).
- **Edge-case/acceptable gap:** if DB attach fails after bucket upload succeeded, the new `images` row may be orphaned — periodic sweep is a future cleanup task, not launch-blocking.

## 5. Validation

| Rule | Value |
|---|---|
| Accepted source formats (client) | JPEG, PNG, WebP |
| Stored variants | JPEG only |
| Max size | 8 MB (source before client processing; also per prebuilt variant on the server) |
| Min dimensions | 800×420 |
| Required? | **Events:** yes, a processed image (file or URL→proxy→Pica) is required to create an event. **Partners:** no, `logo_image_id` stays nullable |

## 6. Object storage provider and configuration

**S3-compatible object storage**, provider left open (per this project's existing pattern of not over-specifying infra — see `extras/integrations-and-config.md`'s hosting note) but **Cloudflare R2** is the recommended default.

| Variable | Purpose |
|---|---|
| `S3_ENDPOINT` | S3-compatible API endpoint (provider-specific; omit/default for real AWS S3) |
| `S3_REGION` | Region string (required by the S3 API shape even for providers without real regions, e.g. `auto` for R2) |
| `S3_BUCKET` | Bucket name |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Credentials, scoped to this one bucket only |
| `IMAGE_PUBLIC_BASE_URL` | The public-facing base URL variant URLs are built from (custom domain fronting the bucket, or the provider's public bucket URL/CDN) — kept separate from `S3_ENDPOINT` because the API endpoint and the public read URL are frequently different hosts |

## 7. Runtime note

- **Browser:** Pica (`@unveiled/images/client`) generates variants; OG uses canvas cover-crop.
- **Workers / server entry of `@unveiled/images`:** validate + store prebuilt variants, S3 helpers, URL builders, remote bytes fetch for the admin proxy. **No `@standardagents/sip`**, no `sharp`.
- **Bun offline (`@unveiled/images/offline`):** test/seed helpers using `@napi-rs/canvas` + the client generator — scripts and integration tests only.

## 8. Deletion and cleanup

Images have **no legal retention requirement** (unlike bookings/ledger entries, which are kept anonymized forever for German accounting rules — `database/schema-overview.md`'s "Account deletion" section) — there's no reason to keep orphaned files around.

- **Replacing an image** (editing an event/partner to a new upload/URL): delete the old `images` row and all six of its bucket objects in the same request that saves the new one.
- **Deleting an event or partner**: delete its associated `images` row and bucket objects as part of the same deletion flow (`/admin/events/:id/delete`, `/partner/events/:id/delete`, `/admin/partners/:id/delete` — `sitemap/sitemap.md`). Event delete also removes `event_gallery_images` join rows (CASCADE) and cleans unreferenced gallery image rows/objects via the catalog path.
- **Removing gallery photos**: `/admin/events/:id/gallery/remove` calls `removeEventGalleryImages`, which deletes join rows then unreferenced `images` + bucket objects (primary `events.image_id` is never removed by gallery remove).
- Do this **synchronously in the request** for v1 (six small object deletes is fast) rather than queuing a background job — consistent with §4's "no background processing" posture. Revisit only if this measurably slows down the root delete/edit request path in practice.

## 8a. Optional event gallery (multi-image)

Events keep a **required singular primary image** (`events.image_id`) for cards, hero, and OG/JSON-LD. Optionally, admins may attach up to **12** additional gallery photos via `event_gallery_images` (composite PK `(event_id, image_id)`, ordered by `sort_order`). Each gallery photo uses the **same six JPEG variant pipeline** as the primary image (client Pica → server validate/store). Admin manage: `/admin/events/:id/gallery*` (see `sitemap/sitemap.md`, `features/admin-events.feature`). Public detail shows the gallery at page end when non-empty (`features/event-discovery.feature`, `ui/ui-component-map.md`). Gallery membership MUST NOT replace the primary hero. Schema: `database/schema-overview.md` → `event_gallery_images`.

## 9. What this doc deliberately does not cover

- **Image moderation/content scanning** — not a requirement for a curated, admin/partner-only upload surface (no end-user-generated image content anywhere in this product).
- **Cropping/editing UI** (letting the admin manually choose a crop region before the pipeline runs) — the automatic center-crop for `og-1200x630` is good enough for v1; a manual crop tool is a future nice-to-have, not a launch requirement.
- **Drag-and-drop gallery reorder** — `sort_order` is append-stable; reorder UI is post-MVP nice-to-have.
- **Expanding OG/JSON-LD to every gallery image** — primary hero remains the SEO image unless a later SEO change mandates otherwise.
