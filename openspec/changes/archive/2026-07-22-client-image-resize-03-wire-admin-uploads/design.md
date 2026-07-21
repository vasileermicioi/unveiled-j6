## Context

Parent feature: Client Image Resize (Pica) (`.dev-plan/current-iteration/client-image-resize-parent-guide.md`). Steps 01–02 are done:

- `@unveiled/images/client` → `generateImageVariantsClient` (six JPEG `Blob`s, OG cover-crop)
- `@unveiled/images` → `persistPrebuiltImageVariants` / `validatePrebuiltVariants`
- `@unveiled/db/catalog/images` → `persistPrebuiltImage`
- Multipart contract documented in `packages/images/README.md`: `imageId` + fields named exactly `VARIANT_FILENAMES` + optional `claimedWidth` / `claimedHeight`

Today admin UX still posts a single `image` / `logo` file (or `image_url`); `parseEventFormBody` / partner parse helpers fill `Buffer` uploads; `attachImageToEvent` / partner create → `persistImageFromSource` → sip. This step wires islands + form parsing + catalog attach to prefer the prebuilt path for file-picker submissions while keeping sip for URL / legacy buffer until step 04.

Constraints: SSR-only mutations (one form POST); HeroUI-only markup; no `@unveiled/images/client` imports from Workers/server routes; locale under `/:locale/*`; business logic stays in `packages/*` where attach decisions belong.

## Goals / Non-Goals

**Goals:**

- Event and partner admin file-picker path runs Pica client-side, posts six variants + metadata, server persists via `persistPrebuiltImage`.
- Clear progress/error UX + DE/EN copy for client processing failures; document JS requirement for admin file uploads.
- Multipart parsers and XOR rules treat a complete prebuilt set as the “upload” side (not combinable with URL).
- Island API accepts a `multiple` prop (gallery-ready) even if primary event image stays single-file.
- Unit tests for prebuilt multipart parsing helpers.

**Non-Goals:**

- Removing sip / Workers WASM aliases (step 04).
- Remote-URL bytes proxy + client Pica for URL path (step 04).
- Gallery schema or multi-image event UI.
- Changing public URLs, variant filenames, or event detail presentation.
- Full rewrite of `docs/product/extras/image-uploads.md` (step 04).

## Decisions

1. **When to generate variants (select vs submit)**
   - **Choice:** Generate on **file change** (selected file), cache blobs + `imageId` in island state, and on form `submit` ensure variants are attached (re-run only if still processing / missing). Disable submit (or show busy) while processing.
   - **Why:** Earlier feedback for undersized/bad files; avoids blocking the whole form submit on a cold generate if the admin picked the file earlier. Submit-hook remains the safety net so a fast submit cannot race an unfinished generate.
   - **Alternatives:** Generate only on submit (simpler state, worse UX); generate on select without submit guard (race risk).

2. **Multipart field layout (match step 02 contract)**
   - **Choice:** For the prebuilt path, post:
     - `imageId` (text, UUID from generator)
     - one `File`/`Blob` per `VariantFilename` using **exact** field names (`original.jpg`, …, `og-1200x630.jpg`)
     - optional `claimedWidth` / `claimedHeight` (text integers from generator metadata)
   - **Do not** also post the raw `image` / `logo` source file when prebuilt fields are present (avoids ambiguous XOR / dual-path triggers). Keep the visible file input for UX, but clear or omit its `name` after successful client processing so the browser does not send the original alongside variants (or strip `image`/`logo` in a submit handler after appending variants).
   - **Partner logo:** same variant field names (shared image pipeline); keep partner-only URL fields out of scope if partners today are file-only.
   - **Alternatives considered:** Nested `image_variants[original.jpg]` — rejected; step 02 README already standardized flat `VARIANT_FILENAMES` field names.

3. **Island API shape (gallery-ready)**
   - **Choice:** Shared props roughly:
     ```ts
     type AdminImageUploadProps = {
       locale: Locale;
       isEdit?: boolean;
       currentImageUrl?: string | null;
       /** Reserved for featured-event-gallery; primary event image stays single-file. */
       multiple?: boolean;
       inputName?: string; // default "image" | "logo" for the picker control only
     };
     ```
     Internally process `FileList` as an array API (`processFiles(files: File[])` → `ProcessedUpload[]`) even when `multiple` is false and only the first file is used. Export types from the component module so gallery can reuse without forking FormData logic.
   - **Why:** Step brief requires multi-file API shape now; implementing only single-file internals would force a rewrite in gallery-02.

4. **Server parse + catalog attach preference**
   - **Choice:**
     1. Add a small parser helper (e.g. `parsePrebuiltImageVariants(body, asString, asFile)`) in `apps/web` lib (or thin wrapper) that returns `PrebuiltImageVariantsInput | null` when all six variant files + `imageId` are present and non-empty.
     2. Extend `EventFormValues` / partner parsed body with `imagePrebuilt: PrebuiltImageVariantsInput | null` (and stop filling `imageUpload` Buffer when prebuilt wins).
     3. Extend XOR validation: prebuilt **or** single buffer upload **or** URL — at most one; event create still requires one of image sources.
     4. In `@unveiled/db` catalog: extend `ImageAttachInput` (or parallel attach APIs) with `{ type: "prebuilt"; input: PrebuiltImageVariantsInput }` and route that branch to `persistPrebuiltImage`. Update `attachImageToEvent` / `replaceEventImage` / partner logo create/replace to accept the prebuilt discriminant (or accept optional prebuilt alongside upload/url with exclusive validation in one place).
   - **Fallback:** If only legacy `image`/`logo` Buffer is present (no-JS or incomplete client), keep `persistImageFromSource` / sip until step 04. Document that the supported admin file-picker path requires JS; do not invest in long-term no-JS file upload.
   - **Alternatives:** Parsing variants only in route files — rejected (keep helpers testable); forcing all uploads through prebuilt with no sip fallback this step — rejected (URL + progressive dual path still needed until 04).

5. **Error mapping & copy**
   - **Choice:** Map client `ImageValidationError` / generator failures to new `getAdminCopy` strings (DE/EN), e.g. `imageProcessingError`, `imageProcessingInProgress`. Map server prebuilt validation failures through existing catalog error → admin field error mapping (add codes if `persistPrebuiltImage` throws distinct errors). Surface inline near the upload section via HeroUI `Description` / form error patterns already used on admin forms.
   - Update upload hints to mention JS requirement briefly (admin-only).

6. **Import boundary**
   - **Choice:** Islands/components import `generateImageVariantsClient` and `VARIANT_FILENAMES` from `@unveiled/images/client` (and constants as needed). Server parse/catalog code imports only `@unveiled/images` / `@unveiled/db` server entries — never `/client`.

## Risks / Trade-offs

- **[Risk] No-JS file upload regresses** → Mitigation: document JS requirement in admin copy + `DEPLOYMENT.md`; keep sip buffer fallback for accidental raw posts until step 04, but do not promise no-JS as a product path.
- **[Risk] Double payload (raw file + six variants)** → Mitigation: strip/rename source input before submit when prebuilt is ready; XOR rejects upload+URL; parser prefers prebuilt and ignores empty `image`.
- **[Risk] Large FormData (six JPEGs) hits request size limits** → Mitigation: variants are already compressed product sizes; keep per-file 8 MB validation; if Workers body limits bite, step 04 can revisit direct-to-R2 — out of scope here.
- **[Risk] Catalog signature churn breaks integration tests** → Mitigation: extend attach helpers with optional prebuilt discriminant; update fixtures that still pass buffers to keep using sip path until 04.
- **[Trade-off] URL path still uses sip** → Accepted; completing URL in this slice risks bytes-proxy scope creep (parent guide → step 04).

## Migration Plan

1. Land island + parser + catalog prebuilt branch behind normal deploy (no feature flag).
2. Smoke admin create/edit event + partner logo with file picker on staging/local with R2 env.
3. Rollback: revert change; sip single-file path remains until step 04 removes it.
4. After merge: mark step 03 done in parent guide; note remote-URL leftover for step 04.

## Open Questions

- None blocking. Prefer exact flat `VARIANT_FILENAMES` field names from step 02 over nested `image_variants[...]` naming from the early step-03 brief sketch.
