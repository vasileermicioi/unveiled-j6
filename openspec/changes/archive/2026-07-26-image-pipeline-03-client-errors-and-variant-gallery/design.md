## Context

Parent feature: Image pipeline (`.dev-plan/current-iteration/image-pipeline-parent-guide.md`). Child step 03 — depends on steps 01 (five WebP variants) and 02 (required partner logo), both done.

Today `EventImageUpload` / `PartnerLogoUpload` already process files via Pica, emit hidden prebuilt fields (`AdminImageVariantFields`), show processing/error copy, and partially block submit (file chosen but variants not ready; partner create without logo). Gaps:

- Event create does not client-block missing required primary image (partner create does via `logoRequiredError`).
- Status `error` / mid-`processing` messaging is incomplete; `mapClientImageError` often surfaces raw English `ImageValidationError` strings instead of localized admin copy.
- Edit forms show a single `currentImageUrl` / `currentLogoUrl` thumb — no five-size gallery for existing or newly processed images.
- Admin hints still mention obsolete JPEG / 800×420 / 8 MB product gates in places.

Constraints: SSR form POST only; island only for file processing + preview; HeroUI chrome + native file input; theme-only colors/borders (Tailwind layout); product SoT / BDD rewrite deferred to step 04; OpenSpec `image-uploads` is the planning contract for this increment.

## Goals / Non-Goals

**Goals:**

- Localized client errors for undecodable file, WebP encode unsupported, processing failure, incomplete variant set, required image missing on create (event + partner), and submit while `processing`.
- `preventDefault` on form submit for those cases; do not rely on server round-trip for first-line UX (server still validates).
- Shared `AdminImageVariantGallery` (name flexible): five labeled tiles for blobs (new upload) and `buildVariantUrl` (existing `imageId`).
- Wire into event create/edit, partner create/edit, and gallery-add; remove sole reliance on the single small preview thumb where the gallery supersedes it.
- Align create submit guards: event create ↔ partner create for required image.
- Stable de/en copy keys for step 04 inventory.

**Non-Goals:**

- Product SoT / Playwright scenario authorship (step 04) beyond keeping copy keys stable.
- Changing variant dimensions or adding manual crop.
- Public Discover page changes (gallery only borrows spacing/tile rhythm).
- Server prebuilt validation changes (sanity check only that incomplete POSTs still reject).
- Remote-URL proxy redesign (map proxy failures to localized copy if already surfaced through the same upload islands).

## Decisions

1. **Shared gallery component driven by blobs or public URLs**
   - **Choice:** Add `AdminImageVariantGallery` that accepts either `Record<VariantFilename, Blob | string>` (object URLs created internally for blobs) or an `imageId` + `buildVariantUrl` for each of the five filenames. Render a responsive grid/strip of bordered tiles with visible size labels (`hero-1920`, `large-1280`, `medium-640`, `small-320`, `og-1200x630`). Revoke object URLs on unmount / replace.
   - **Rationale:** One chrome for pending + existing; matches Discover/featured tile rhythm without copying curation behavior.
   - **Alternatives:** Keep single thumb + separate debug dump — fails parent UX; duplicate gallery markup per form — drift risk.

2. **Pass `currentImageId` / `currentLogoImageId` into upload islands (not only preview URL)**
   - **Choice:** Extend `EventImageUpload` / `PartnerLogoUpload` (and `EventFormDefaults` / partner edit props) with optional `currentImageId` / `currentLogoImageId`. When present and no new processed set, show gallery from `buildVariantUrl`. Drop or demote the sole `admin-form__image-preview` single thumb once gallery is shown.
   - **Rationale:** Five public variant URLs need the id; a single small URL cannot reconstruct the ladder.
   - **Alternatives:** Server-render five URLs as props — more route plumbing, same outcome; keep URL-only and guess filenames from one URL — brittle.

3. **Unified submit-guard matrix in the upload islands**
   - **Choice:** Capture-phase `submit` listener (existing pattern) blocks when any of:
     - create + no processed set and no keep-existing path (event create / partner create / gallery-add with zero ready items);
     - `status === "processing"` or `processingRef`;
     - `status === "error"` with a selected file / incomplete attempt;
     - file(s) selected but processed list incomplete (missing any of five variants / empty list).
     Edit flows may submit other fields when keeping an existing valid image (no new file). Show localized error on every block (including processing — use in-progress or a dedicated “wait until ready” string).
   - **Rationale:** Step brief; defense in depth with server validation.
   - **Alternatives:** `required` on file input only — insufficient for async processing; client-only modal — forbidden by hard rules.

4. **Error taxonomy → admin copy keys (not raw Error.message)**
   - **Choice:** Extend `mapClientImageError` (or a sibling classifier) to map known `ImageValidationError` / generator failures to typed codes → `getAdminCopy` strings:
     - undecodable / unrecognized source → `imageUndecodableError` (name flexible)
     - WebP encode unsupported (existing English throw from `encodeWebp`) → `imageWebpUnsupportedError`
     - incomplete variant set → `imageIncompleteVariantsError`
     - required missing on create → reuse/extend `logoRequiredError` + add `imageRequiredError` for events (and gallery-add already has `galleryAddRequired`)
     - generic processing / proxy failure → `imageProcessingError` (refresh copy to drop obsolete min-size language)
   - Prefer matching on stable error codes or substrings / custom error subclasses if already present; if generator only has English messages today, classify by known message prefixes or introduce a small error `code` on `ImageValidationError` in `@unveiled/images` **only if** needed for reliable mapping — keep Workers-safe and minimal.
   - **Rationale:** Localized UX; parent called out WebP-unsupported messaging for this step; stale 800×420 hint copy must not ship as the “processing error.”
   - **Alternatives:** Show raw `error.message` — fails i18n; wait for step 04 — leaves bad UX in production.

5. **Gallery-add multiple mode: per-item gallery or compact summary**
   - **Choice:** Prefer a compact summary when many files (e.g. first item’s five tiles + count label, or a stacked per-item mini-gallery capped for layout). Must not break indexed multipart fields (`AdminGalleryImageVariantFields`).
   - **Rationale:** Step brief allows either; full N×5 tiles can overwhelm the form.
   - **Alternatives:** Always N×5 full galleries — clearest but noisy; no gallery for multi — fails “newly processed” requirement for gallery-add.

6. **Visual language: theme tokens + featured-grid spacing cues**
   - **Choice:** New BEM-ish classes under admin form / a small `admin-image-variant-gallery*` block in `globals.css`, reusing bordered-tile ideas from `.admin-featured-partners__grid` / Discover partner tiles for layout rhythm only. No ad-hoc shadows; yellow page backdrop unchanged.
   - **Rationale:** Hard rules §8–9; step brief visual reference.
   - **Alternatives:** Inline Tailwind color/border classes — rejected by theme-only rule.

7. **Hint copy cleanup while touching admin-content**
   - **Choice:** Update `imageUploadHint` / related strings that still mention JPEG-only / 800×420 / 8 MB to match step 01 acceptance (any browser-decodable → WebP). Full i18n inventory sync remains step 04.
   - **Rationale:** Avoid shipping contradictory UI copy next to the new gallery.
   - **Alternatives:** Leave stale hints — confusing; full inventory rewrite now — scope creep into 04.

## Risks / Trade-offs

- **[Risk] Object URL leaks** → Mitigation: `URL.createObjectURL` + revoke on dependency change / unmount in the gallery component.
- **[Risk] Existing R2 still has residual `.jpg` keys** → Mitigation: parent migration script; gallery using `.webp` URLs may 404 until migration run — same as public consumers; do not invent JPEG fallbacks in this step.
- **[Risk] Classifying English generator errors is brittle** → Mitigation: Decision 4 — prefer error codes if cheap; otherwise map known messages + fallback to generic localized processing error.
- **[Risk] Multi-file gallery layout noise** → Mitigation: Decision 5 compact summary.
- **[Trade-off] OpenSpec vs product SoT** → Planning contract ships here; Gherkin / `image-uploads.md` sync in step 04.
- **[Trade-off] Client guards bypassable** → Accepted; server remains source of truth for persist.

## Migration Plan

1. Land gallery + submit-guard + copy changes in `apps/web` (no DB migration).
2. Deploy Workers; smoke admin create/edit/gallery-add on staging.
3. Rollback: revert the web deploy; no schema rollback.

## Open Questions

- None blocking. If error-code plumbing in `@unveiled/images` proves larger than a small additive field, implementers MAY map known messages in the web layer only and note residual English edge cases for step 04.
