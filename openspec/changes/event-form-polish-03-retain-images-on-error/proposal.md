## Why

On admin event create/edit/series, the primary image is client-processed with Pica into five WebP variants before SSR submit. When the server rejects the form (validation or catalog error), the page re-renders and those in-memory blobs are gone; create error paths also force `currentImageId: null`, and `createEvent` deletes a just-persisted image when the event row insert fails — so the admin must re-select and re-process the same file. This final Event form polish step closes that loop so a processed/staged image survives error re-render and successful resubmit without re-upload.

## What Changes

- On create/edit/series **error re-render**, if the request included a complete prebuilt primary image that was validated/persisted (or can be staged), pass `currentImageId` (+ `imagePublicBaseUrl`) in form defaults so `EventImageUpload` shows the variant gallery as an attached image.
- Stop deleting a successfully persisted primary image solely because unrelated event validation or row insert/update failed when the error form will re-offer that image; create/series retry treats the staged id like an existing image on the next POST.
- Edit path: if the admin uploaded a replacement image and the update fails, prefer the newly staged image for the re-rendered form (do not force-revert preview to only the previous DB image); previous-image cleanup stays on successful replace.
- Ensure resubmit without choosing a new file works when `currentImageId` / staged id is present (satisfies create’s required-image rule).
- Document retention in `docs/product/extras/image-uploads.md` and add Gherkin in `admin-events.feature`; add a focused unit/integration test for defaults/staging (R2-free preferred).
- Mark parent feature `event-form-polish` step 03 done / releasable after merge.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `image-uploads`: Retain processed/staged primary event image across failed admin submits; do not delete staged primary solely for unrelated validation/insert failure when the error form will reuse it; orphan sweep remains non-blocking.
- `admin-events`: Create/edit/series forms retain client-processed primary image across server-side validation or catalog errors so resubmit does not require re-upload (aligned with image-uploads retention).

## Impact

- **Routes / defaults:** `apps/web` create/edit/series POST catch blocks (`new.tsx`, `edit.tsx`, series `new.tsx`); `formValuesToDefaults` (today nulls `currentImageId`); optional parse of staged `imageId` from body.
- **Catalog:** `createEvent` / related attach paths — remove or gate delete-on-insert-failure when retry-friendly staging is in play; ensure next successful POST can attach by staged `imageId` without re-uploading bytes.
- **UI island:** `EventImageUpload` / form defaults — staged `currentImageId` satisfies required image on create the same way edit supports existing images.
- **Docs:** `docs/product/extras/image-uploads.md`, `docs/product/features/admin-events.feature`, `gaps-and-decisions` if needed; parent guide mark step 03 done.
- **Tests:** R2-free unit/integration for form-default / staging wiring and/or createEvent not deleting staged image when configured for retry.
- **Unchanged:** language-independent (01); address-only location (02); variant sizes/formats; full orphan GC job; IndexedDB-only retention as sole path; partner logo / gallery-add unless a helper is trivially shared.
- **Source brief:** `.dev-plan/current-iteration/event-form-polish-03-retain-images-on-error.md`
- **Parent:** `.dev-plan/current-iteration/event-form-polish-parent-guide.md`
- **Depends on:** `event-form-polish-02-address-only-location` (archived/done)
- **Consumed by:** closes the Event form polish feature
- **Verification:** `bun run lint`; `bun run typecheck`; focused staging/defaults test; manual create → image → force validation error → five-variant preview retained → fix field → submit without re-choosing file
