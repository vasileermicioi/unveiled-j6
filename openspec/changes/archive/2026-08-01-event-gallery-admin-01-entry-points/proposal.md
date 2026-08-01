## Why

Gallery storage and public display are already per catalog event, but admin manage entry is only exposed from the Featured events list. Admins cannot open gallery manage for a non-featured event without first featuring it. This step relocates (and documents in code) gallery entry onto the Events catalog list and/or event edit page so any existing event can get a gallery.

## What Changes

- Add a gallery manage link/action on the admin Events list (`AdminEventsTable`) and/or the event edit page chrome for each existing catalog event.
- Stop treating Featured membership as a prerequisite for gallery manage visibility.
- Keep the Featured-list gallery shortcut as a convenience entry (default).
- Keep create-event form free of gallery manage (event must exist first).
- Do **not** change gallery routes, catalog APIs, schema, upload pipeline, or public detail UI.
- Product Gherkin, Playwright, and docs rewrites are deferred to `event-gallery-admin-02-docs-and-e2e` (known temporary mismatch with Featured-only product scenarios until step 02).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `admin-events`: Gallery manage entry SHALL be available from the admin Events list and/or event edit page for any existing catalog event; Featured Discover membership SHALL NOT be required. Featured may remain a convenience entry, not the sole entry.

## Impact

- **UI:** `apps/web/app/components/admin/AdminEventsTable.tsx` (primary), optionally `apps/web/app/routes/[locale]/admin/events/[id]/edit.tsx` shell actions; reuse `adminEventGalleryPath`, `copy.galleryManageAction`, and `AdminTableActions` gallery icon.
- **Unchanged:** `/admin/events/:id/gallery*` routes, `AdminEventGallery*Page`, `@unveiled/db` gallery APIs, Featured table shortcut (retain), create-event form.
- **Deferred:** `docs/product/features/admin-events.feature`, e2e coverage matrix / Playwright scenarios, component map / DEPLOYMENT demo copy (step 02).
- **Parent:** `.dev-plan/current-iteration/event-gallery-admin-parent-guide.md` — mark step 01 done on handoff.
