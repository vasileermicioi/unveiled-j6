# Image Uploads (MVP)

Ported for `docs/product/`. Admin uploads only in MVP; partner self-service uploads are **post-MVP**. Five **WebP** variants — see filenames below. **No** `original` / source-master object is stored.

**Decided (supersedes earlier JPEG / optional-logo / min-size rules in `extras/gaps-and-decisions.md`):** the rewrite uses a real image upload pipeline — S3-compatible object storage, with every image turned into a fixed set of **five WebP** size variants. This applies uniformly to **event images** (`events`, required) and **partner logos** (`partners`, **required**) — one pipeline, one `images` table, no per-entity special-casing of formats.

**Processing location (current):** the admin **file picker** generates the five variants **in the browser** (`@unveiled/images/client`): **Pica** for resize, **`@jsquash/webp`** (libwebp WASM) for encode — not `canvas.toBlob('image/webp')`, which Safari silently turns into PNG. The server **validates and stores** prebuilt WebP variants only — it does not resize. Admin event/partner UI is file-upload only (no paste-URL field on those forms). **JavaScript is required** for admin image supply. Source acceptance is **decode-success** (any image the browser can decode, including SVG); raw SVG/source bytes are never uploaded.

This replaces two things from the old app at once, both covered in `ui/assets-inventory.md`:
- The plain-URL-only text field (no processing, no control over dimensions/format/weight, hotlinks a third party's file indefinitely).
- The old app's actual (undocumented until a later audit pass) file-picker, which bypassed Firebase Storage and wrote a raw base64 data URI straight into the `imageUrl`/`logoUrl` column — never carry this forward; it bloats the database and skips the whole point of a CDN.

## 1. Storage layout and the five files

Every image, regardless of source (admin file upload or demo seed packs), gets its own folder in the bucket, keyed by its `images.id` (UUID):

```
{BUCKET}/images/{imageId}/hero-1920.webp
{BUCKET}/images/{imageId}/large-1280.webp
{BUCKET}/images/{imageId}/medium-640.webp
{BUCKET}/images/{imageId}/small-320.webp
{BUCKET}/images/{imageId}/og-1200x630.webp
```

All five are produced client-side (or offline for seed) before the catalog mutation POST; the server stores the complete set in that same request — there is no async/background processing step in v1, and no partial state where some variants exist and others don't. There is **no** `original.webp` / `original.jpg`.

The filenames are a **fixed, universal convention** — never stored per-row in the database. A variant's public URL is always computed in code as `{IMAGE_PUBLIC_BASE_URL}/images/{imageId}/{filename}`; see §6 for `IMAGE_PUBLIC_BASE_URL`. Variant objects use Content-Type `image/webp`.

### Variant specs

| File | Target | Resize behavior | Quality | Used for |
|---|---|---|---|---|
| `hero-1920.webp` | Max width 1920 | Downscale only, preserve aspect ratio | ~82 | Event detail page hero banner (`ui/ui-component-map.md`), `schema.org/Event` JSON-LD `image` (`extras/seo-and-metadata.md`) |
| `large-1280.webp` | Max width 1280 | Downscale only, preserve aspect ratio | ~80 | `srcset` step for the hero banner on medium viewports |
| `medium-640.webp` | Max width 640 | Downscale only, preserve aspect ratio | ~78 | `EventCard` grid thumbnail (`/discover`, `/events`, `/saved`), default partner-logo display size |
| `small-320.webp` | Max width 320 | Downscale only, preserve aspect ratio | ~75 | Mobile `srcset` step for `EventCard`; admin/partner table-row thumbnails (`/admin/events`, `/admin/partners`) |
| `og-1200x630.webp` | Fixed 1200×630 (the standard 1.91:1 Open Graph ratio) | **Cover-crop** (center-crop to fill exactly, not letterboxed) — the one variant that may slightly *upscale* a smaller source, since a mildly-upscaled crop is preferable to shipping a non-standard OG image size | ~85 | `og:image` / Twitter Card `twitter:image` (`extras/seo-and-metadata.md`) |

**Never upscale** for the four aspect-preserving ladder variants when the source is a **raster** bitmap: if the source is smaller than a variant's target (e.g. a 500px-wide JPEG), generate that variant at the source's native width instead of stretching it — a blurry upscaled fake-1920 image is worse than a smaller-but-crisp one. `og-1200x630` is the deliberate exception, since social platforms hard-require that ratio/size.

**SVG exception:** SVG is vector. On decode, the client rasterizes it to at least `hero-1920` width (aspect preserved) before the ladder runs, so WebP variants are sharp at every size. Raw SVG bytes are never stored.

There is **no** product min-dimension gate (former 800×420 removed) and **no** product max file-size gate (former 8 MB removed). Undersized **raster** sources are accepted if decode/encode succeeds; OG may upscale as noted above.

## 2. Why WebP, why these widths

- **WebP everywhere:** All five variants are WebP (`image/webp`) for a single Content-Type contract and smaller payloads than the prior JPEG set. Input may be any browser-decodable image (JPEG, PNG, WebP, SVG, …); output is always WebP. Raw SVG is never stored or served from the bucket.
- **Widths chosen to match real breakpoints, not arbitrary halving:** 320/640/1280/1920 line up with common device-width buckets (small phone, large phone/small tablet @2x, laptop, desktop/retina hero), so `srcset`/`sizes` picks a variant close to the actual rendered size instead of always shipping the largest one.
- **`og-1200x630` is its own thing, not reused from the width ladder,** because Open Graph/Twitter Cards require a specific aspect ratio (1.91:1) that none of the width-ladder variants share (those preserve the source's native aspect ratio, whatever it is).

## 3. Admin supply path (file → client Pica → prebuilt persist)

Admin event and partner forms use a **file picker** on the SSR multipart form. The admin island (`EventImageUpload` / `PartnerLogoUpload`) runs Pica before submit and posts five WebP variant files + `imageId` + `claimedWidth` / `claimedHeight`, plus `*{filename}__b64` hidden fields (base64 WebP) as a backup when a browser strips programmatic `input[type=file]` values.

An authenticated admin bytes proxy (`POST /:locale/admin/image-proxy`) still exists for tooling/seed/remote-fetch helpers that need server-side byte fetch; it is **not** exposed as a paste-URL field on event/partner admin forms. When used, the same client Pica → prebuilt persist path applies. The proxy abuse ceiling (`REMOTE_FETCH_MAX_BYTES` = 32 MB + timeout) is a DoS guard only — not a product upload limit.

**Required images:**
- **Events:** a processed primary image is required to create an event (optional replace on edit).
- **Partners:** a processed logo is required to create a partner; edit may replace the logo but MUST NOT clear it to empty/`NULL`.

Client-visible localized errors (undecodable file, WebP encode unsupported, incomplete variants, processing in progress, missing required image) **block form submit** until resolved; edit flows may submit other fields when keeping an existing valid image. Server validation remains the persist gate.

**Variant preview gallery:** admin event/partner create/edit and gallery-add show `AdminImageVariantGallery` — five labeled tiles (`hero-1920`, `large-1280`, `medium-640`, `small-320`, `og-1200x630`) for newly processed blob previews and for already-attached images via `buildVariantUrl`. Clicking a tile opens a lightbox slider (prev/next across the five sizes; dismiss via backdrop or Escape).

## 4. Where processing happens

- Catalog mutations remain SSR form POSTs (`enctype="multipart/form-data"`).
- **Admin image supply requires JavaScript.** Non-image admin forms are unchanged.
- On submit with a new image, the POST body includes the five prebuilt WebP fields (`VARIANT_FILENAMES`) + `imageId` + claimed dimensions (+ optional `image_url` metadata for proxy/tooling paths). The handler validates and stores those bytes — **no Worker-side resize**.
- Demo seed uses pre-baked five-variant packs on disk so Workers seed never needs a WASM encoder. Bun scripts may use `@unveiled/images/offline` (never import that from Workers routes).
- If validation or bucket write fails, the request re-renders the form with an error (same as other admin forms).
- **Retain processed primary image across failed submits:** when a complete prebuilt primary set has been accepted for staging/persistence and create/edit/series fails for an unrelated reason (field validation, catalog/row insert), the re-rendered form SHALL keep that image via staged `imageId` + variant gallery preview and SHALL allow resubmit without re-selecting/re-processing the file. Create/series treat a staged `imageId` (posted without the five WebP Files) as satisfying the required primary image. The system SHALL NOT delete a staged primary solely because unrelated event validation or insert failed when the error form will reuse it. Retention uses the server-staged `imageId` as the source of truth across SSR re-render (not client-only blob cache).
- **Edge-case/acceptable gap:** if DB attach fails after bucket upload succeeded, or an admin abandons the form after staging, the new `images` row may be orphaned — periodic sweep is a future cleanup task, not launch-blocking.

## 5. Validation

| Rule | Value |
|---|---|
| Accepted source formats (client) | Any image the browser can decode (including SVG); `accept="image/*,.svg"` |
| Stored variants | WebP only (`*.webp`, Content-Type `image/webp`) |
| Product max size | None (former 8 MB product gate removed) |
| Product min dimensions | None (former 800×420 product gate removed) |
| Proxy abuse ceiling | `REMOTE_FETCH_MAX_BYTES` (32 MB) + timeout — DoS guard for remote fetch only |
| Prebuilt checks | All five present; WebP; OG exactly 1200×630; ladder width ≤ max and ≤ claimed source |
| Required? | **Events:** yes, primary image required on create. **Partners:** yes, logo required on create (`logo_image_id` NOT NULL) |

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

- **Browser:** Pica (`@unveiled/images/client`) generates variants; OG uses canvas cover-crop; encode via `canvas.toBlob('image/webp')`.
- **Workers / server entry of `@unveiled/images`:** validate + store prebuilt variants, S3 helpers, URL builders, remote bytes fetch for the admin proxy. **No `@standardagents/sip`**, no `sharp`.
- **Bun offline (`@unveiled/images/offline`):** test/seed helpers using `@napi-rs/canvas` + the client generator — scripts and integration tests only.
- **Legacy JPEG migration:** one-shot script `bun scripts/migrate-r2-jpeg-to-webp.ts` (optional `--dry-run`) re-encodes residual `.jpg` keys to the five WebP variants. Consumers serve `.webp` only — no JPEG URL fallback in app code.

## 8. Deletion and cleanup

Images have **no legal retention requirement** (unlike bookings/ledger entries, which are kept anonymized forever for German accounting rules — `database/schema-overview.md`'s "Account deletion" section) — there's no reason to keep orphaned files around.

- **Replacing an image** (editing an event/partner to a new upload): delete the old `images` row and all five of its bucket objects in the same request that saves the new one.
- **Deleting an event or partner**: delete its associated `images` row and bucket objects as part of the same deletion flow (`/admin/events/:id/delete`, `/admin/partners/:id/delete` — `sitemap/sitemap.md`). Event delete also removes `event_gallery_images` join rows (CASCADE) and cleans unreferenced gallery image rows/objects via the catalog path.
- **Removing gallery photos**: `/admin/events/:id/gallery/remove` calls `removeEventGalleryImages`, which deletes join rows then unreferenced `images` + bucket objects (primary `events.image_id` is never removed by gallery remove).
- Do this **synchronously in the request** for v1 (five small object deletes is fast) rather than queuing a background job — consistent with §4's "no background processing" posture. Revisit only if this measurably slows down the root delete/edit request path in practice.

## 8a. Optional event gallery (multi-image)

Events keep a **required singular primary image** (`events.image_id`) for cards, hero, and OG/JSON-LD. Optionally, admins may attach up to **12** additional gallery photos via `event_gallery_images` (composite PK `(event_id, image_id)`, ordered by `sort_order`). Each gallery photo uses the **same five WebP variant pipeline** as the primary image (client Pica → server validate/store). Admin manage: `/admin/events/:id/gallery*` — thumbnail **grid**, drag-and-drop reorder with explicit **Save order** POST, checkbox select → SSR remove confirm (entry from Featured list; see `sitemap/sitemap.md`, `features/admin-events.feature`). Public detail shows the gallery at page end when non-empty (`features/event-discovery.feature`, `ui/ui-component-map.md`). Gallery membership MUST NOT replace the primary hero. Schema: `database/schema-overview.md` → `event_gallery_images`.

## 9. What this doc deliberately does not cover

- **Image moderation/content scanning** — not a requirement for a curated, admin-only upload surface (no end-user-generated image content anywhere in this product).
- **Cropping/editing UI** (letting the admin manually choose a crop region before the pipeline runs) — the automatic center-crop for `og-1200x630` is good enough for v1; a manual crop tool is a future nice-to-have, not a launch requirement.
- ~~**Drag-and-drop gallery reorder**~~ — shipped on admin gallery grid (drag locally, persist via **Save order**).
- **Expanding OG/JSON-LD to every gallery image** — primary hero remains the SEO image unless a later SEO change mandates otherwise.
- **Partner portal / check-in image flows** — post-MVP.
