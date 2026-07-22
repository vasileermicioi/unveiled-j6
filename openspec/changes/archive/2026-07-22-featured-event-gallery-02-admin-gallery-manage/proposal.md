## Why

Step 01 shipped `event_gallery_images` and catalog list/add/remove helpers, but admins still have no UI to stock an event with gallery photos. Without SSR admin multi-upload and remove flows, step 03 cannot show a public gallery, and the join table stays unused.

## What Changes

- Add ADMIN-only locale-prefixed SSR routes under `/:locale/admin/events/:id/gallery*`:
  - list current gallery + links to add/remove
  - multi-file add (client Pica variants → prebuilt persist → `addEventGalleryImages`)
  - confirm remove for one or many gallery image ids (form POST → `removeEventGalleryImages`)
- Extend the existing admin image-upload island/helpers so `multiple` actually posts **N** prebuilt variant sets (today it processes many files but only keeps/emits the first).
- Add multipart parse helpers for multi prebuilt sets + unit tests for selection / id parsing.
- Link into gallery manage from admin event edit (existing events only).
- Add DE/EN admin copy for gallery list/add/remove.
- Draft or add sitemap rows for the new admin gallery routes (full BDD/docs polish remains step 04).
- **No** public detail gallery/slider, reorder UI, partner portal, or create-event gallery UI (unless a trivial post-create redirect is free).

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `admin-events`: Admins manage event gallery photos via SSR pages — multi-upload in one submission and remove one or many selected gallery images through confirm + form POST (no client-only mutation modals; no checkbox/radio selection).

## Impact

- **Routes:** `apps/web/app/routes/[locale]/admin/events/[id]/gallery/index.tsx`, `gallery/add.tsx`, `gallery/remove.tsx` (names flexible; HonoX file layout).
- **UI:** New admin gallery page components under `apps/web/app/components/admin/`; entry link from event edit; reuse `AdminFormSelect` (native `select multiple`) and/or per-photo remove links — not HeroUI Select / checkboxes.
- **Upload island:** Extend `EventImageUpload` / `AdminImageVariantFields` / `admin-image-variants` so multi-file mode emits indexed prebuilt fields; keep primary event image single-file.
- **Server parse:** Multi-set prebuilt parser + gallery add/remove POST helpers in `apps/web/app/lib/`; persist via existing `persistPrebuiltImage` then `addEventGalleryImages`; remove via `removeEventGalleryImages`.
- **Domain (consume only):** `@unveiled/db` `listEventGalleryImages`, `addEventGalleryImages`, `removeEventGalleryImages`, `MAX_EVENT_GALLERY_IMAGES` (12) from step 01.
- **Copy:** `apps/web/app/lib/admin-content.ts` gallery strings (DE/EN).
- **Auth:** Existing `guardAdminRoute` on all gallery routes.
- **Docs:** sitemap admin rows for gallery routes (optional draft if deferred to step 04 — prefer update now); mark step done in parent guide.
- **Unchanged this step:** Public `/events/:id` gallery UI, hero `events.image_id` behavior, reorder, BDD feature files (step 04).
- **Source brief:** `.dev-plan/current-iteration/featured-event-gallery-02-admin-gallery-manage.md`
- **Parent:** `.dev-plan/current-iteration/featured-event-gallery-parent-guide.md`
- **Depends on:** `featured-event-gallery-01-schema-and-domain` (done); external `client-image-resize-03-wire-admin-uploads` (done)
- **Consumed by:** `featured-event-gallery-03-public-gallery-and-slider`
- **Verification:** `bun run lint`, `bun run typecheck`, unit tests for parse/selection helpers; manual smoke add 2+ / remove one / remove many
