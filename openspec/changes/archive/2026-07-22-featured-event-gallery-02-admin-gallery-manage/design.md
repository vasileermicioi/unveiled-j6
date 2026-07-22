## Context

Parent feature: Featured Event Gallery (`.dev-plan/current-iteration/featured-event-gallery-parent-guide.md`). Step 01 is done:

- Table `event_gallery_images` + migration `0007_massive_swordsman`
- Domain: `listEventGalleryImages` / `addEventGalleryImages` / `removeEventGalleryImages` / `MAX_EVENT_GALLERY_IMAGES = 12`
- Primary hero remains `events.image_id`

External prerequisite `client-image-resize-03` is done: `EventImageUpload` accepts `multiple`, `processAdminImageFiles` returns an array, and single-image admin forms post flat `imageId` + `VARIANT_FILENAMES` via `AdminImageVariantFields` → `parsePrebuiltImageVariants` → `persistPrebuiltImage`. **Gap:** when `multiple` is true, the island still keeps only `results[0]` and emits one field set — gallery add must finish that multi-emit path.

Admin patterns to mirror: event edit (`admin/events/[id]/edit`), featured remove confirm (`admin/featured/[eventId]/remove`), native multi-select via `AdminFormSelect` (`selectionMode="multiple"` — posts repeated field names). Constraints: SSR-only mutations; HeroUI-only markup; theme tokens; Tailwind layout only; native-first choice controls (no HeroUI Select / checkbox / radio); ADMIN via `guardAdminRoute`; locale under `/:locale/*`; business logic stays in `@unveiled/db`.

## Goals / Non-Goals

**Goals:**

- ADMIN gallery list / multi-add / remove confirm routes for an existing event.
- Multi-file client Pica → N prebuilt persist → `addEventGalleryImages` in one form POST.
- Remove one or many gallery image ids without checkbox/radio inputs.
- Entry point from event edit; DE/EN copy; unit tests for multi-prebuilt + id selection parsing.
- Sitemap rows for the new admin gallery paths (prefer now; BDD polish in step 04).

**Non-Goals:**

- Public event-detail gallery section / slider island (step 03).
- Drag-and-drop reorder UI.
- Gallery on create-event form (link only after the event exists).
- Partner portal; changing hero image attach; raising the domain max of 12.
- Full Gherkin/e2e suite (step 04; manual smoke required).

## Decisions

1. **Route layout (HonoX)**
   - **Choice:**
     - `GET` `.../admin/events/[id]/gallery/index.tsx` — list + capacity hint + links to add / remove
     - `GET` + `POST` `.../gallery/add.tsx` — multi-upload form
     - `GET` + `POST` `.../gallery/remove.tsx` — confirm + remove selected ids
   - Optional deep-link: `GET .../gallery/remove?imageIds=` preselects (comma-separated or repeated) for single-photo “Remove” from the list.
   - **Rationale:** Mirrors featured/events delete confirm pages; keeps mutations on dedicated SSR POSTs.
   - **Alternatives:** Nested under edit as one mega-form (harder confirm UX); client delete modal (forbidden).

2. **Existing-event-only access**
   - **Choice:** Gallery routes require a real `eventId`; 404 if missing. Entry link only on **edit** (and list row action if cheap). No gallery fields on `admin/events/new`.
   - **Rationale:** Domain APIs need an event row; create redirect-to-gallery is optional nice-to-have only if trivial.
   - **Alternatives:** Post-create redirect always (extra flow; skip unless free).

3. **Multi-prebuilt multipart contract**
   - **Choice:** Indexed field names for N sets:
     - `galleryCount` (text int)
     - For each index `i` in `0..galleryCount-1`:
       - `gallery[${i}].imageId`
       - `gallery[${i}].claimedWidth` / `gallery[${i}].claimedHeight` (optional)
       - `gallery[${i}].<VARIANT_FILENAME>` for each of the six JPEG variant files
   - Do **not** post the raw multi file input `name` once variants are ready (same clear-name pattern as single upload).
   - Add `parsePrebuiltImageVariantSets(body, …): PrebuiltImageVariantsInput[]` (or parse by `galleryCount`) in `apps/web/app/lib/`; keep single-set `parsePrebuiltImageVariants` unchanged for event/partner forms.
   - Extend `AdminImageVariantFields` to accept `processed[]` + index prefix, or add `AdminGalleryImageVariantFields`.
   - Fix `EventImageUpload` (or a thin `EventGalleryImageUpload` wrapper) so `multiple` stores/emits **all** processed results, not only `[0]`.
   - **Rationale:** Flat `imageId` + variant filenames collide for N>1; bracketed index matches FormData mental model and is easy to unit-test.
   - **Alternatives:** Sequential POSTs per file (worse UX / partial failure); base64 JSON (bloated, against existing multipart contract).

4. **Add POST pipeline**
   - **Choice:**
     1. `guardAdminRoute` + load event
     2. Parse multipart → `PrebuiltImageVariantsInput[]` (require length ≥ 1)
     3. For each set: `persistPrebuiltImage(db, input, …)` → collect `imageId`s
     4. `addEventGalleryImages(db, eventId, imageIds)`
     5. `302` → gallery list
   - On domain cap (`GALLERY_CAPACITY` / existing catalog error): re-render add with mapped error; prefer not leaving orphan images if add fails after persist — either persist inside a transaction if available, or delete persisted ids on add failure (same cleanup spirit as image-upload rules). Prefer: persist then add; on `addEventGalleryImages` failure, call `deleteImageRecord` for the newly persisted ids that were not joined.
   - Enforce remaining slots client-side hint (`12 - currentCount`) and server-side via domain.
   - **Rationale:** Domain already enforces max 12; routes stay thin.
   - **Alternatives:** Batch persist API in `@unveiled/db` this step (nice but out of scope unless trivial).

5. **Remove selection UX (no checkboxes)**
   - **Choice:** Dual path:
     - **Per-photo:** list row Link → `.../gallery/remove?imageIds=<id>` (single confirm).
     - **Bulk:** remove page with `AdminFormSelect` `selectionMode="multiple"` `name="imageIds"`, options = gallery photos (label = short id or “Photo N · sort_order”; thumbnail nearby via SSR `<img>` in HeroUI wrapper on the list, not inside the native select). Confirm POST parses repeated `imageIds` → `removeEventGalleryImages`.
   - Empty selection on POST → re-render with validation error.
   - **Rationale:** Matches hard rule §14 (native select) and step brief (no checkbox/radio); `AdminFormSelect` already posts repeated names.
   - **Alternatives:** HeroUI multi Select (conflicts with native-first policy); checkbox table (explicitly forbidden by step brief).

6. **List presentation**
   - **Choice:** Ordered by `sort_order`; show thumbnail (small public variant URL from `imageId`, same helper used elsewhere for admin previews), sort order, remove link. Show count `n / 12`. Primary CTA: Add photos. Secondary: Remove photos (bulk page).
   - **Rationale:** Admins need visual confirmation before delete; no reorder controls.
   - **Alternatives:** Id-only table (weaker UX).

7. **Components vs routes**
   - **Choice:** Presentational pages e.g. `AdminEventGalleryListPage`, `AdminEventGalleryAddPage`, `AdminEventGalleryRemovePage` under `apps/web/app/components/admin/`. Routes: guard → load → `renderAdminPage`. Path helpers in `admin-tabs.ts` or a small `admin-gallery-paths.ts` next to tabs (`adminEventGalleryPath`, `…AddPath`, `…RemovePath`).
   - **Rationale:** Matches Featured/Events split; keeps routes thin.

8. **i18n**
   - **Choice:** Extend `AdminCopy` / `getAdminCopy` with gallery list/add/remove titles, capacity hint, empty state, add submit, processing strings reuse where possible, remove confirm/body, selection required error. DE/EN.
   - **Rationale:** Central admin copy module already owns Events/Featured strings.

9. **Sitemap**
   - **Choice:** Add admin rows for `/admin/events/:id/gallery`, `/gallery/add`, `/gallery/remove` (Auth ✅, Role ADMIN). Full feature/BDD docs in step 04.
   - **Rationale:** Step deliverable; discoverable for implementers of 03/04.

## Risks / Trade-offs

- **[Risk] Partial failure after persisting some variants before domain add** → Mitigation: on add failure, delete newly persisted unreferenced image ids; surface catalog capacity errors clearly.
- **[Risk] Large multi-upload (many × 6 blobs) hits Worker/request size limits** → Mitigation: respect max 12 and remaining slots; document practical batch size in add hint; keep per-source 8 MB rule from image pipeline.
- **[Risk] Island still only emits first file if multi path incomplete** → Mitigation: task explicitly requires multi emit + parser tests with 2+ sets.
- **[Risk] Native multi-select discoverability** → Mitigation: copy explains Ctrl/Cmd-click (reuse existing admin multi-select hint pattern if present); keep per-photo remove links.
- **[Trade-off] No e2e this step** → Mitigation: lint/typecheck + unit tests + manual smoke; step 04 owns BDD.
- **[Trade-off] Indexed multipart is gallery-specific** → Mitigation: keep single-set parser for hero/logo; document gallery field contract next to `admin-prebuilt-image` helpers.

## Migration Plan

1. Extend upload island / variant field emitters for multi indexed sets + unit tests for `parsePrebuiltImageVariantSets` and `parseGalleryImageIds`.
2. Add gallery list/add/remove components + routes; wire domain + persist; map catalog errors.
3. Link from event edit (+ optional events table action); add DE/EN copy.
4. Update sitemap admin rows; mark step done in parent guide.
5. `bun run lint`, `bun run typecheck`, unit tests; manual smoke (add 2+, remove one, remove many).
6. Rollback = revert routes/components/island multi-emit; no schema change this step.

## Open Questions

- None blocking. Thumbnail variant size (e.g. `card` vs `thumb`) can follow whatever admin event list already uses for previews.
