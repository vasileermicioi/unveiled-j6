## Context

Parent feature: Client Image Resize (Pica) (`.dev-plan/current-iteration/client-image-resize-parent-guide.md`). Today `@unveiled/images` validates and resizes with `@standardagents/sip` in `process.ts` / `validation.ts`, then uploads six JPEGs to R2. Filenames, quality caps, min 800×420, and OG cover-crop rules live in `constants.ts` + `docs/product/extras/image-uploads.md`. Admin islands under `apps/web/app/islands/` still submit raw files; Workers bundle sip WASM.

This step only adds a **testable browser generator** that mirrors the six-variant contract. Server sip path stays until step 04. Product docs still describe server-side resize until a later step updates them.

Constraints: do not import sip from the client path; do not force Workers to bundle Pica; keep `VARIANT_FILENAMES` / JPEG output identical; HeroUI admin UI is out of scope; no R2 in tests.

## Goals / Non-Goals

**Goals:**

- Browser API that turns one valid source into six JPEG `Blob`s keyed by `VariantFilename`.
- Same ladder rules as server: aspect-preserving max-width (and original max-edge) **never upscale**; OG exactly 1200×630 via center cover-crop (upscale allowed for OG only).
- Client validation aligned with min dimensions + accepted MIME types before resize.
- Unit tests on a fixture image proving presence + dimensions (especially OG 1200×630) without S3/Workers.

**Non-Goals:**

- Accept-prebuilt multipart/R2 path (step 02).
- Admin island / form POST wiring (step 03).
- Removing sip / seed changes / remote URL proxy (step 04).
- Changing public URLs, filenames, or Content-Type.
- Production HeroUI upload UI or demo island (optional tiny harness only if useful for local sanity).

## Decisions

1. **Where the generator lives**
   - **Choice:** Implement under `packages/images` as a **browser-only** module (e.g. `src/client/generate-variants.ts`) exported via a new package export such as `@unveiled/images/client` (or `./browser`). Add `pica` as a dependency of `@unveiled/images`. Keep the main `.` export free of Pica so Workers continue to tree-shake/bundle only the sip/S3 path until step 04.
   - **Rationale:** Constants and filename types already live in `@unveiled/images`; steps 02–03 and gallery can import one contract; avoids putting resize math only in `apps/web`.
   - **Alternatives:** Generator only in `apps/web/app/lib/` (duplicates types later); put Pica on the main package entry (risk Workers pull it in).

2. **Public API shape**
   - **Choice:**
     ```ts
     generateImageVariantsClient(
       source: File | Blob | ImageBitmap,
       options?: { imageId?: string; source?: "UPLOAD" | "REMOTE_URL"; sourceUrl?: string | null }
     ): Promise<{
       imageId: string;
       metadata: { width: number; height: number; source: "UPLOAD" | "REMOTE_URL"; sourceUrl?: string | null };
       variants: Record<VariantFilename, Blob>;
     }>
     ```
     Default `source: "UPLOAD"`. Blobs MUST be `image/jpeg`. Filenames MUST match `VARIANT_FILENAMES` exactly.
   - **Rationale:** Parallel to `generateImageVariants` / `ProcessedImageResult` but browser-native `Blob` instead of `Buffer`.
   - **Alternatives:** Return `ArrayBuffer` / `Uint8Array` (less convenient for `FormData` in step 03); sync API (Pica is async).

3. **Resize implementation**
   - **Choice:** Decode via `createImageBitmap` (or `Image` + canvas fallback if needed for tests). Use **Pica** (`pica().resize`) for aspect-preserving downscales into offscreen/canvas targets sized by the existing width/edge caps and qualities from `constants.ts`. For each of the five ladder variants, if source width (or longest edge for original) is already below the cap, encode at source size (no upscale). Encode JPEG with `canvas.toBlob('image/jpeg', quality/100)` (or Pica `toBlob` helper) using the same quality integers as server (90/82/80/78/75/85).
   - **Rationale:** Matches product table; Pica is the parent-feature choice for Workers-free resize quality.
   - **Alternatives:** Pure canvas `drawImage` without Pica (worse quality); keep sip in browser (defeats the feature).

4. **OG cover-crop**
   - **Choice:** Center cover-crop on canvas to **exactly** `OG_WIDTH` × `OG_HEIGHT` (1200×630): scale = `max(1200/w, 630/h)`, draw centered, then JPEG encode at `OG_QUALITY`. May upscale when source is between min size and OG target (same as server).
   - **Rationale:** Parent guide + `process.ts` `createOgVariant` — Pica resize alone does not cover-crop.
   - **Alternatives:** Letterbox (forbidden by product); reuse a ladder variant (wrong aspect).

5. **Client validation (no sip)**
   - **Choice:** Before resize, reject empty / over `MAX_UPLOAD_BYTES`; reject MIME outside `ACCEPTED_MIME_TYPES` when the input exposes a type (`File.type` / `Blob.type`); decode bitmap and reject if width < `MIN_IMAGE_WIDTH` or height < `MIN_IMAGE_HEIGHT`. Throw `ImageValidationError` (same class) with messages consistent with server where practical. Do **not** call `validateImageBuffer` (sip) from the client module.
   - **Rationale:** Step brief asks to mirror `validateImageBuffer` rules without pulling sip into the client graph.
   - **Alternatives:** Skip MIME checks (weaker); magic-byte sniff only (nice-to-have, not required this step).

6. **Testing strategy**
   - **Choice:** Colocate `*.test.ts` next to the client module under `packages/images`; run with `cd packages/images && bun test`. Use a small in-repo fixture (≥800×420 JPEG/PNG) or generate a solid canvas/bitmap in the test harness. Assert: all six keys present; each blob non-empty and `type === 'image/jpeg'`; `og-1200x630.jpg` decodes to 1200×630; ladder variants respect downscale-only (e.g. fixture width W → `small-320` width ≤ min(320, W)). Prefer a DOM/canvas environment Bun can run (happy-dom / linkedom / native if available); document the chosen harness in the test file header if non-obvious.
   - **Rationale:** Step verification forbids S3 credentials; existing package already has `bun test` + `process.test.ts`.
   - **Alternatives:** Only test in `apps/web` (heavier); pixel-diff vs sip output (brittle; out of scope).

7. **Workers / bundling hygiene**
   - **Choice:** New export path only; no changes to Workers Vite sip aliases this step. Do not import `@unveiled/images/client` from server route modules or `packages/images/src/index.ts`.
   - **Rationale:** Prevent accidental Workers bundling of Pica before admin islands need it (step 03).
   - **Alternatives:** Dual package entry with conditional exports + `browser` field (more ceremony than needed now).

8. **Shared constants**
   - **Choice:** Import size/quality/`VARIANT_FILENAMES` from existing `./constants` (already exported as `@unveiled/images/constants`). Do not duplicate the table in the client module.
   - **Rationale:** Single source of truth with server process path.
   - **Alternatives:** Hardcode numbers in client (drift risk).

## Risks / Trade-offs

- **[Risk] Bun test env lacks full canvas/`createImageBitmap`** → Mitigation: add a minimal DOM polyfill dep as `devDependency` of `@unveiled/images` if needed; or decode fixture via a tiny pure path for dimension asserts after `toBlob`.
- **[Risk] JPEG quality / dimensions drift slightly from sip** → Mitigation: assert structural contract (filenames, OG exact size, no-upscale caps), not byte-identical output; step 02 will validate server-side dimensions again.
- **[Risk] Accidental Workers import of `/client`** → Mitigation: separate export; code review + no re-export from main index; step 03 only imports from islands.
- **[Risk] `Blob.type` empty for some inputs** → Mitigation: after decode success, allow missing type if bitmap dimensions pass; still reject explicit wrong types.
- **[Trade-off] No product doc update this step** → Mitigation: parent guide mark-done + openspec delta; step 04 / wiring steps update `image-uploads.md`.
- **[Trade-off] openspec `image-uploads` vs product SoT** → Delta is planning contract; canonical behavior remains `docs/product/extras/image-uploads.md` when product behavior changes in later steps.

## Migration Plan

1. Add `pica` (+ types if needed) to `@unveiled/images`; add `./client` (or `./browser`) export.
2. Implement client validation + Pica ladder + OG cover-crop generator.
3. Add fixture + unit tests; run `cd packages/images && bun test`.
4. Run `bun run lint` and `bun run typecheck`.
5. Mark step done in `client-image-resize-parent-guide.md`; note the new import path.
6. Rollback = remove client module/export/dependency; server sip path unchanged.

## Open Questions

- None blocking for step 01. Remote-URL CORS proxy remains a parent open question for step 04.
