## 1. Setup

- [ ] 1.1 Read proposal, design, spec delta; trace current path: form → `parseEventFormBody` → `createEvent`/`updateEvent` → `@unveiled/images`
- [ ] 1.2 Confirm root `.env` has all six R2 vars per `IMPLEMENTATION-PLAN.md` Phase 4 and `DEPLOYMENT.md` § Cloudflare R2
- [ ] 1.3 Read `docs/migration/extras/image-uploads.md` (variants, validation, deletion)

## 2. Pipeline integration (fix if broken)

- [ ] 2.1 Reproduce upload failure — log/identify break (env, sharp, S3 client, parseBody field name, domain validation)
- [ ] 2.2 Fix `@unveiled/db` attach/replace path so `processImageFromBuffer` completes and `image_id` is set on event row
- [ ] 2.3 Verify six objects exist in R2 at `images/{uuid}/*.webp` after create
- [ ] 2.4 Verify `replaceEventImage` deletes previous uuid folder on edit upload
- [ ] 2.5 Map R2/S3 errors to admin-visible validation messages via `mapCatalogError`

## 3. Upload-only admin UI

- [ ] 3.1 Create `EventImageUpload` island — HeroUI `FileTrigger`, accept jpeg/png/webp, optional local preview
- [ ] 3.2 On edit: show current image using `buildVariantUrl(imageId, "small-320.webp")` prop from route
- [ ] 3.3 Remove `image_url` text field and URL-related copy from `EventAdminBaseFields`
- [ ] 3.4 Admin route POST handlers: pass `imageUpload` only (no `imageUrl`) to domain for events

## 4. Admin thumbnails

- [ ] 4.1 Verify `AdminEventsTable` / events index route uses `small-320.webp` per spec
- [ ] 4.2 Add graceful placeholder when `imageId` missing or variant URL fails
- [ ] 4.3 Manual: create event → list row shows thumbnail within same session

## 5. Docs and verification

- [ ] 5.1 Update `docs/migration/extras/gaps-and-decisions.md` — admin event upload-only
- [ ] 5.2 Update `apps/web/DEPLOYMENT.md` if R2 smoke-test steps missing
- [ ] 5.3 Manual: create (required file), edit (keep image), edit (replace image), delete (assets gone)
- [ ] 5.4 Run `bun run lint && bun run typecheck && bun run build`
