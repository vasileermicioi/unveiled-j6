## Why

Phase 4 established `@unveiled/images` (sharp → six WebP variants → Cloudflare R2) in catalog-01 and wired admin event CRUD in catalog-04 with multipart forms plus an optional URL paste field. Staging use shows uploads are not reliably persisting to R2, admin list thumbnails depend on correct `image_id` + `buildVariantUrl(..., "small-320.webp")`, and the dual upload/URL UI confuses admins and bypasses the intended pipeline. Image handling deserves its own focused change — separate from form control polish (dates, selects, map) — aligned with `IMPLEMENTATION-PLAN.md` Phase 4 scope: *"upload an event photo … appears on the public discovery page"* with correct variant URLs.

## What Changes

- **Fix end-to-end admin event image upload:** multipart POST → route parser → `@unveiled/db` `attachImageToEvent` / `replaceEventImage` → `@unveiled/images` `processImageFromBuffer` → six objects in R2 → `images` row → `events.image_id`.
- **Upload-only admin event forms:** remove remote `image_url` text input; file upload required on create, optional replace on edit (matches user intent; record delta vs `image-uploads.md` §3 for events only).
- **HeroUI file picker island:** `FileTrigger` + optional client preview (`URL.createObjectURL`); SSR form POST unchanged.
- **Admin thumbnails:** verify `/admin/events` list uses `small-320.webp` via `buildVariantUrl`; show placeholder when missing; edit form shows current image preview from existing `image_id`.
- **Replace/delete lifecycle:** confirm edit upload deletes old `images` row + bucket objects; delete event path already in domain — regression-test.
- **Staging verification:** document R2 env gate in `DEPLOYMENT.md`; smoke test with all six vars per `IMPLEMENTATION-PLAN.md` Phase 4 table.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Admin event image input is upload-only; pipeline reliably persists R2 variants and admin list displays `small-320` thumbnails.

## Impact

- **Packages:** `@unveiled/images` (verify/fix pipeline integration), `@unveiled/db` (event image attach/replace — debug if needed).
- **App:** `EventAdminBaseFields`, new `EventImageUpload` island, admin route POST handlers, `AdminEventsTable` thumbnail rendering, `admin-content.ts` copy.
- **Out of scope:** Partner logo URL field; public `/events/:id` hero srcset / `og-1200x630` (catalog-05); `@unveiled/ui` EventCard thumbnails; image moderation/crop UI.
- **Depends on:** catalog-01 (`@unveiled/images`), catalog-04 CRUD routes; R2 env vars.
- **Parallel with:** `catalog-04-admin-event-form-polish` (no hard dependency either direction).
- **Verification:** Create event with JPEG → R2 bucket has six files under `images/{uuid}/`; admin list shows thumbnail; edit replace removes old uuid folder; `bun run lint`, `typecheck`, `build`.
