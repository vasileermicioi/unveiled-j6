## Why

Steps 01–02 shipped the browser Pica generator and the server prebuilt persist API, but admin event/partner forms still POST a single source file and resize with sip on Workers. Wiring the islands now completes the file-picker path end-to-end, shrinks the critical path for admin uploads, and leaves an island API shape reusable by `featured-event-gallery`.

## What Changes

- Upgrade `EventImageUpload` / `PartnerLogoUpload` (client islands) so that on file select (or before submit) they call `generateImageVariantsClient`, then attach the six variant files plus `imageId` / claimed width/height into the existing SSR form POST (field names = `VARIANT_FILENAMES` per step 02 README).
- Show simple progress/error for client processing via HeroUI; add DE/EN admin copy for processing failures and document that admin file-picker upload requires JavaScript.
- Extend admin multipart parsing (`admin-event-form` / partner parse helpers) and catalog attach paths so a complete prebuilt set prefers `persistPrebuiltImage` — keep single-buffer → sip / remote URL → sip as fallback until step 04.
- Keep upload XOR URL validation; do **not** move remote-URL resize to the client in this step (flag for step 04).
- Island prop surface supports `multiple` (even if event primary image still allows one file) so gallery work can reuse the same patterns.
- Targeted unit tests for multipart parsing of prebuilt variants.
- **Out of this step:** sip / Workers WASM removal, gallery schema/UI, public event detail presentation, remote-URL bytes proxy.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `image-uploads`: Admin file-picker uploads SHALL generate the six JPEG variants in the browser with Pica before the SSR form POST; the server SHALL persist those prebuilt variants without sip resize for that submission. Admin file-picker image upload MAY require JavaScript. (Maps to planning delta in `.dev-plan/current-iteration/client-image-resize-03-wire-admin-uploads.md`; canonical product SoT remains `docs/product/extras/image-uploads.md` — full rewrite in step 04.)

## Impact

- **Code:** `apps/web/app/components/admin/EventImageUpload.tsx`, `PartnerLogoUpload.tsx`, islands; `apps/web/app/lib/admin-event-form.ts`, `admin-route.ts` (partner body parse), admin error/copy modules; `@unveiled/db` catalog attach/replace helpers may gain a prebuilt discriminant or parallel input so create/update event & partner call `persistPrebuiltImage` when variants are present.
- **APIs:** Same SSR create/edit POST routes — multipart field set expands for file-picker path; no new JSON endpoints; mutations remain form POST only.
- **Unchanged:** Public `buildVariantUrl` / R2 layout; remote URL path still server fetch+sip; non-image admin forms; partner portal (post-MVP).
- **Docs this step:** Note JS requirement in `apps/web/DEPLOYMENT.md` and/or admin copy; mark step done in parent guide; leave full `image-uploads.md` rewrite for step 04.
- **Source brief:** `.dev-plan/current-iteration/client-image-resize-03-wire-admin-uploads.md`
- **Parent:** `.dev-plan/current-iteration/client-image-resize-parent-guide.md`
- **Depends on:** `client-image-resize-02-accept-prebuilt-variants` (done — `persistPrebuiltImage` / multipart contract)
- **Consumed by:** `client-image-resize-04-remove-sip-and-harden`; also unblocks `featured-event-gallery-02-admin-gallery-manage`
- **Verification:** `bun run lint`, `bun run typecheck`, targeted unit tests for form parsing; manual smoke create/edit with file picker when R2 env present
