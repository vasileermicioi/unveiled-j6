## 1. Setup

- [x] 1.1 Confirm prerequisites: `@unveiled/images/client` (`generateImageVariantsClient`), `persistPrebuiltImage` / multipart contract in `packages/images/README.md`, `EventImageUpload` / `PartnerLogoUpload`, admin event/partner create/edit routes, parent guide release criteria
- [x] 1.2 Skim design decisions: generate on file change + submit guard, flat `VARIANT_FILENAMES` fields, strip raw `image`/`logo` when prebuilt ready, catalog `prebuilt` discriminant, URL path stays sip until step 04

## 2. Catalog attach path (`@unveiled/db`)

- [x] 2.1 Extend `ImageAttachInput` (or exclusive validation helper) with `{ type: "prebuilt"; input: PrebuiltImageVariantsInput }` — XOR among prebuilt / buffer upload / remote URL
- [x] 2.2 Route prebuilt branch through `persistPrebuiltImage` in `attachImageToEvent` / `replaceEventImage` / partner logo create+replace paths
- [x] 2.3 Keep buffer + URL → `persistImageFromSource` (sip) as fallback until step 04

## 3. Multipart parsing (`apps/web`)

- [x] 3.1 Add `parsePrebuiltImageVariants(body, asString, asFile)` helper returning `PrebuiltImageVariantsInput | null` when `imageId` + all six `VARIANT_FILENAMES` files are present
- [x] 3.2 Wire into `parseEventFormBody` and partner body parse (`admin-route` / equivalent) — prefer prebuilt over raw `image`/`logo` Buffer; extend form value types
- [x] 3.3 Thread prebuilt into `toCreateEventInput` / `toUpdateEventInput` / series create and partner create/update so catalog attach receives it
- [x] 3.4 Map prebuilt validation / conflicting-source errors through existing admin error mapping (+ new codes if needed)

## 4. Admin upload islands

- [x] 4.1 Upgrade `EventImageUpload` to call `generateImageVariantsClient` on file change, show HeroUI progress/error, append six variant files + `imageId` + claimed dims on submit, strip/omit raw `image` name when prebuilt ready
- [x] 4.2 Mirror behavior in `PartnerLogoUpload` (logo picker; same variant field names)
- [x] 4.3 Expose `multiple?: boolean` and internal `File[]` processing API shape (primary event image remains single-file when `multiple` is false)
- [x] 4.4 Import only from `@unveiled/images/client` in islands — never from server routes

## 5. Copy & docs

- [x] 5.1 Add DE/EN `getAdminCopy` strings for client processing errors / in-progress; note JS requirement in upload hints
- [x] 5.2 Note admin file-picker JS requirement in `apps/web/DEPLOYMENT.md`
- [x] 5.3 Flag remote-URL leftover for step 04 (parent guide / handoff note)

## 6. Tests & verification

- [x] 6.1 Unit-test multipart parsing: complete prebuilt set parses; incomplete set → null/legacy; prebuilt + URL → conflict; prebuilt preferred over raw `image`
- [x] 6.2 Run `bun run lint` and `bun run typecheck` — exit 0
- [x] 6.3 Manual smoke (when R2 env present): create/edit event + partner logo via file picker → variants in R2 / detail hero loads — **skipped**: no `S3_*` / `IMAGE_PUBLIC_BASE_URL` in local `.env`
- [x] 6.4 Mark step 03 done in `.dev-plan/current-iteration/client-image-resize-parent-guide.md`
