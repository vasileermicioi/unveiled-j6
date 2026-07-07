## Context

Phase 4 image architecture (from `IMPLEMENTATION-PLAN.md` and catalog-01):

| Layer | Responsibility |
|---|---|
| `@unveiled/images` | `processImageFromBuffer` / `processImageFromUrl` → sharp → 6 WebP variants → S3/R2 upload; `buildVariantUrl(id, filename)`; `deleteImageObjects` |
| `@unveiled/db` | `images` table; `attachImageToEvent`, `replaceEventImage` on create/update; `deleteEvent` cleanup |
| `apps/web` | Multipart form POST; pass `Buffer` + `uploadedBy` to domain |

**Six variants** (fixed filenames per `extras/image-uploads.md`):

| File | Use |
|---|---|
| `original.webp` | Master |
| `hero-1920.webp` | Public event detail hero (catalog-05) |
| `large-1280.webp` | Hero srcset |
| `medium-640.webp` | EventCard grid |
| `small-320.webp` | **Admin/partner table thumbnails** |
| `og-1200x630.webp` | Open Graph (catalog-05) |

Public URL: `{IMAGE_PUBLIC_BASE_URL}/images/{imageId}/{filename}`

Current admin UI (`EventAdminBaseFields`): raw `<Input type="file">` + `image_url` text field. Domain accepts both via `validateImageSourceExclusive`. User wants upload-only and working R2 persistence.

## Goals / Non-Goals

**Goals:**

- Reliable file-upload path from admin create/edit to R2 + DB.
- Upload-only event image UI (no URL paste on admin event forms).
- Admin list + edit form show correct thumbnails/previews using `small-320` / existing variant URLs.
- HeroUI-first file picker (FileTrigger island).
- Clear errors when R2 misconfigured or validation fails (8 MB, 800×420 min, JPEG/PNG/WebP).

**Non-Goals:**

- Remote URL fetch path on **admin event forms** (seed/scripts may still use `processImageFromUrl` programmatically).
- Partner logo form changes.
- Public hero srcset, EventCard, JSON-LD image (catalog-05).
- Async processing, crop UI, multi-image galleries.

## Decisions

### 1. End-to-end upload flow (admin create)

```
POST /admin/events/new (multipart)
  → parseEventFormBody: image File → Buffer (reject if empty on create)
  → createEvent(db, { imageUpload, uploadedBy, … })  // no imageUrl
  → attachImageToEvent → processImageFromBuffer → 6× PutObject R2
  → INSERT images row (source=UPLOAD)
  → INSERT events row with image_id
  → redirect /admin/events
```

**Debug checklist if broken:** env vars loaded in dev; `sharp` available on Node host; S3 client endpoint has no bucket suffix; bucket CORS not required for server-side upload; `parseBody` file field name `image` matches form; domain `required: true` on create.

### 2. Edit replace flow

- Omit file → keep existing `image_id` (domain already supports).
- New file → `replaceEventImage`: delete old row + R2 objects, process new buffer, update FK.
- Edit form shows current thumbnail via `buildVariantUrl(imageId, "small-320.webp")` when event has image (read `imageId` from loaded event, not URL field).

### 3. Upload-only UI

Remove from `EventAdminBaseFields`:

- `image_url` `TextField`
- Copy hints referencing URL paste

Add `EventImageUpload` island:

- HeroUI `FileTrigger` + `Button` ("Choose image" / localized)
- Hidden or native file input `name="image"` `accept="image/jpeg,image/png,image/webp"`
- Optional preview: selected file before submit; on edit, show existing `small-320` from server prop `currentImageUrl`
- Create: required (HTML `required` on file input where supported + server validation)
- Edit: optional

Route handlers: stop passing `imageUrl` from `body.image_url` for admin events.

### 4. Admin list thumbnails

Per `IMPLEMENTATION-PLAN.md` and `image-uploads.md` §1 table — admin events list uses **`small-320.webp`**.

`AdminEventsTable` already receives `imageUrls` map from route — verify:

```typescript
buildVariantUrl(event.imageId, "small-320.webp")
```

Handle missing/broken URL: HeroUI placeholder surface, no broken `<img>` icon.

### 5. Relationship to catalog-05 thumbnails

| Surface | Variant | Step |
|---|---|---|
| `/admin/events` list | `small-320.webp` | **This change** |
| `/discover`, `/events` feed | `medium-640.webp` | catalog-05 |
| `/events/:id` hero | `hero-1920` + srcset | catalog-05 |
| OG/Twitter | `og-1200x630.webp` | catalog-05 |

This change ensures `image_id` and R2 objects exist so catalog-05 can consume variants.

### 6. Seed and demo

`scripts/seed-demo.ts` and domain may continue using `processImageFromUrl` — not admin UI. No change required unless seed breaks after upload-only route parsing.

### 7. Documentation delta

When implementing, add to `gaps-and-decisions.md`:

- Admin **event** forms: upload-only (partner logos retain dual path).
- Phase 4 IMPLEMENTATION-PLAN line 422 "URL paste" applies to partners; events admin is upload-only after this change.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| R2 credentials missing locally | Fail loudly in domain; DEPLOYMENT.md checklist |
| Large multipart bodies | 8 MB limit in `@unveiled/images` validation |
| Edit preview shows stale image after failed POST | Re-render with existing event `imageId` on validation error |
| Removing URL breaks admin workflow for marketing URLs | Admins download/re-upload or use seed API; acceptable per product decision |

## Migration Plan

1. Branch: `catalog-04-admin-event-image-upload`.
2. Fix pipeline integration + UI; no schema migration unless `images` table changes (none expected).
3. Staging: set all six R2 vars; create event; verify bucket + list thumbnail.
4. `bun run lint && bun run typecheck && bun run build`.

## Open Questions

- **Show filename/size after pick?** Optional UX in island — default yes for admin confidence.
- **Keep URL in domain API for programmatic use?** Yes — only admin form stops sending it.
