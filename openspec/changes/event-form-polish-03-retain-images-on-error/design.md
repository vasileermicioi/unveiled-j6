## Context

Parent feature: Event form polish (`.dev-plan/current-iteration/event-form-polish-parent-guide.md`). Child step 03 — depends on archived `event-form-polish-02-address-only-location` (final shared form surface).

Today the primary-image path is: client Pica → five WebP file fields + `imageId` → `parsePrebuiltImageVariants` → `attachImageToEvent` / `persistPrebuiltImage` inside `createEvent` / `updateEvent` / `createEventSeries`. On failure:

1. `formValuesToDefaults` hard-nulls `currentImageId` / `currentImageUrl`.
2. Create/series catch re-renders with those nulls; edit catch **forces** `currentImageId` back to the DB event image even when a replacement prebuilt set was posted.
3. `createEvent` deletes the just-persisted image when `insertEventRow` fails.
4. `EventImageUpload` only shows the server-side variant gallery when `isEdit && currentImageId` — create never treats a staged id as “already attached.”
5. Resubmit without re-selecting a file has no complete prebuilt File set (multipart Files are not re-emitted after SSR), so create’s required-image rule fails.

Constraints: keep SSR form POST + client Pica; no client-only mutation modals; orphan sweep remains non-blocking; series shares the same base-field / defaults path; R2-free tests preferred for defaults/staging wiring.

## Goals / Non-Goals

**Goals:**

- After a complete prebuilt primary image is validated and staged/persisted, a failed create/edit/series submit re-renders with that image’s variant preview (`currentImageId` + `imagePublicBaseUrl`).
- Do not delete a staged primary image solely because unrelated validation or event-row insert/update failed when the error form will reuse it.
- Resubmit without choosing a new file succeeds by referencing the staged `imageId` (create treats it like an existing image).
- Edit replacement: prefer newly staged id on error re-render over the previous DB image.
- Docs + Gherkin + focused unit/integration coverage; mark parent step 03 done.

**Non-Goals:**

- Language-independent (01) or address/map (02).
- Changing variant sizes/formats or the Pica pipeline.
- Full orphan GC job.
- IndexedDB / client-cache as the **sole** retention path across SSR re-render.
- Partner logo or gallery-add retention unless a helper is trivially shared without scope creep.

## Decisions

1. **Server-staged `imageId` is the retention SoT (not client blob cache)**  
   - **Why:** SSR re-render drops in-memory File/blobs; public variant URLs already work from `imageId` + `IMAGE_PUBLIC_BASE_URL`. Client cache MAY assist UX but MUST NOT be the only path.  
   - **Alternatives:** IndexedDB-only retry (rejected by step brief); re-fetch bytes from R2 into hidden file inputs (heavy, fragile).

2. **Persist-before-domain-write (or equivalent early stage) when a complete prebuilt set is present**  
   - **Why:** Validation/catalog errors often happen after parse but before or during insert; multipart File bodies cannot reliably be re-parsed after a partial failure if the handler already consumed them. Stage via `persistPrebuiltImage` (or route-level persist) once a complete set is accepted, then thread the id through catch → defaults.  
   - **Alternatives:** Only keep images that survive `createEvent`’s attach-then-insert (misses parse/domain validation failures before create); rely on re-posting five Files (impossible after SSR).

3. **Stop delete-on-insert-failure for retry-friendly staging**  
   - **Why:** Today `createEvent` calls `deleteImageRecord` in the insert catch, destroying the only retry handle. Prefer leaving the staged row/objects; next successful create/series attaches that id. Same spirit for series if it shares attach-then-insert.  
   - **Alternatives:** Keep delete + force re-upload (status quo); delete only when image validation itself failed (still need staging for field validation).

4. **Create/series accept `stagedImageId` / existing image id without re-uploading bytes**  
   - **Why:** Error form posts a hidden `imageId` (or dedicated `staged_image_id`) without the five WebP Files. Domain MUST accept “use this already-persisted primary image” on create/series (and edit when replacement was staged), validating the id exists, then set `events.image_id`. Prefer a single helper used by routes + `toCreateEventInput`.  
   - **Alternatives:** Re-download variants from R2 and re-persist (wasteful duplicate ids); require client to re-process (rejected).

5. **`formValuesToDefaults` threads staged/persisted id**  
   - **Why:** Hard-null today is the direct bug. Pass `currentImageId` from `values.imagePrebuilt?.imageId` **or** an explicit staged id field on `EventFormValues` after route-level persist; always set `imagePublicBaseUrl`. Create/series catch uses that; edit catch prefers staged replacement over `existing.imageId` when a new id was staged.  
   - **Alternatives:** Route-only overrides without changing the helper (easy to miss series); keep null and only fix the island (still fails required-image on resubmit).

6. **`EventImageUpload` treats staged `currentImageId` on create like edit’s existing gallery**  
   - **Why:** `showExistingGallery` gates on `isEdit`. Extend so create/series with `currentImageId` and no new processed blobs show `AdminImageVariantGallery`, emit a hidden `imageId` / staged field for resubmit, and treat that as satisfying the required-image client check.  
   - **Alternatives:** Fake `isEdit` on create (confusing); only server-side check without preview (worse UX).

7. **Edit: prefer staged replacement; defer old-image cleanup to successful replace**  
   - **Why:** Current catch overwrites posted values with `existingDefaults.currentImageId`. If a new image was persisted/staged, defaults MUST use the new id for preview + retry; previous image cleanup stays on successful `updateEvent` replace (existing behavior).  
   - **Alternatives:** Keep old preview until success (misleading; loses the new work).

8. **Docs + Gherkin + R2-free unit tests**  
   - **Why:** Spec deltas live in OpenSpec; product SoT is `image-uploads.md` + `admin-events.feature`. Unit-test `formValuesToDefaults` / staging id wiring and catalog “do not delete staged on insert failure / accept staged id” without R2. Manual smoke covers full UI loop.  
   - **Alternatives:** E2e-only (needs R2; flakier for this slice).

## Risks / Trade-offs

- **[Risk] Orphan `images` rows increase when admins abandon the form after staging** → Acceptable per existing image-uploads orphan note; do not invent GC; call out in gaps-and-decisions only if rate clearly worsens.  
- **[Risk] Double-persist on retry if create always re-uploads prebuilt when both Files and staged id are present** → Prefer exclusive source rules: complete prebuilt set wins and may create a new id; else staged/existing id; document in validation helper.  
- **[Risk] Stale staged id if admin clears/replaces image on retry** → New complete prebuilt set replaces staged id; clearing file input without a staged id falls back to required-image error on create.  
- **[Risk] Series confirm vs preview multi-step** → Stage once on first successful parse of a complete set; carry `currentImageId` through preview → confirm defaults so confirm does not require re-upload.  
- **[Trade-off] Persist-before-domain vs delete-only-on-success** → Early persist increases orphans slightly but is the only reliable SSR retention; prefer early persist + no delete-on-unrelated-failure.

## Migration Plan

1. Trace create → parse → attach → insert → delete → catch defaults (and series/edit replacement).  
2. Add staged-id plumbing: `EventFormValues` / `formValuesToDefaults` / route catch + optional early `persistPrebuiltImage`.  
3. Adjust catalog create/series/update to accept existing staged id and stop destroying retry-usable staged images.  
4. Update `EventImageUpload` for create/series staged gallery + hidden id + required-image satisfaction.  
5. Tests + `image-uploads.md` + `admin-events.feature` + parent guide mark done.  
6. `bun run lint` / `typecheck` / focused tests; manual smoke.  
7. Rollback: revert code; orphaned staged images remain harmless (existing gap).

## Open Questions

- None blocking — prefer dedicated hidden field name `staged_image_id` vs reusing `imageId` alone: **reuse `imageId` hidden field** when showing staged gallery (matches edit existing path) and teach create parsers to treat `imageId` without variant Files as staged-existing; only add a separate field if exclusive-source validation becomes ambiguous.
