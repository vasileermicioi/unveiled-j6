## Context

Step 01 (`workers-sip-images-01-spec-and-contract`) locked six `.jpg` filenames, `image/jpeg` Content-Type, and docs naming `@standardagents/sip` as the target processor. `@unveiled/images` still implements validation and variant generation with Node-native `sharp` (`process.ts`, `validation.ts`, `process.test.ts`). Catalog tests in `@unveiled/db` also import `sharp` only to synthesize JPEG fixtures.

Parent sequence: this step swaps the processor inside the package; step 03 proves WASM on Workers and removes `IMAGE_PROCESSING_UNAVAILABLE` guards; step 04 is Workers e2e.

Public sip API (https://sip.standardagents.ai/): `ready`, `inspect`, `transform` + `collect` (aspect-preserving max bounds, never upscales, JPEG out), `decode` / `resize` / `encodeJpeg` for custom pipelines. Output is always JPEG. Sip accepts JPEG|PNG|WebP|AVIF; product still rejects AVIF to match admin `accept=` and existing validation.

## Goals / Non-Goals

**Goals:**

- Zero `sharp` dependency in `@unveiled/images`.
- Same public API and six-variant contract; unit tests pass under `bun test` using sip.
- Validation parity: 8 MB max, ≥800×420, JPEG|PNG|WebP only.
- Max-width ladder never upscales; `og-1200x630.jpg` is exactly 1200×630 via center cover-crop (upscale allowed only there).
- README Runtime section documents sip on Workers + local Node.

**Non-Goals:**

- Removing `@unveiled/db` `IMAGE_PROCESSING_UNAVAILABLE` / dynamic-import guards (step 03).
- Wrangler/Vite WASM asset configuration for the deployed Worker (step 03).
- Dual sharp+sip backends or feature flags.
- Changing admin routes, S3 key layout, or variant quality constants (except if sip quality scale needs a documented tweak — prefer keep constants as-is).
- Removing `sharp` from `@unveiled/db` production code paths that still dynamically import `@unveiled/images` (guards stay until step 03); only fixture helpers that import sharp for bytes.

## Decisions

### 1. Module-level `ready()` promise

- **Choice:** `const sipReady = ready()` at module scope; every public entry (`validateImageBuffer`, `generateImageVariants`, `getVariantDimensions`) awaits it once.
- **Rationale:** sip docs require WASM load before processing; idempotent `ready()` matches Worker and Node usage.
- **Alternatives:** Call `ready()` inside each function without caching — wasteful; pass wasm bytes from apps/web — out of scope until step 03.

### 2. Validation via `inspect`, reject AVIF

- **Choice:** After size checks, `await inspect(uint8)` → map `info.format` to MIME; accept only jpeg/png/webp; enforce min dimensions from `info.width`/`info.height`. Prefer reusing `source` from inspect for later transform/decode when the same buffer is processed in one call path.
- **Rationale:** Matches current rules and admin file accept list; sip can decode AVIF but product parity says reject.
- **Alternatives:** Accept AVIF because sip supports it — rejected unless docs/`accept=` updated (not this step).

### 3. Five ladder variants via `transform` + `collect`

- **Choice:** For `original.jpg` use `transform(input, { width: ORIGINAL_MAX_EDGE, height: ORIGINAL_MAX_EDGE, quality: ORIGINAL_QUALITY })`. For hero/large/medium/small use `transform(input, { width: MAX, quality })` (height omitted or large enough that width binds). `collect` → `Buffer.from(data)`.
- **Rationale:** sip preserves aspect, never upscales — matches sharp `withoutEnlargement` / `fit: "inside"` behavior. Prefer streaming collect over decoding full bitmaps.
- **Alternatives:** Manual `decode`+`resize`+`encodeJpeg` for every variant — more code, same result for ladder.

### 4. OG cover-crop as custom scanline pipeline

- **Choice:** `decode` → compute cover scale for 1200×630 (allow upscale) → center-crop to exact 1200×630 (buffer cropped RGB rows or a small full bitmap for this variant only) → `encodeJpeg(..., { quality: OG_QUALITY })` → `collect`. Do **not** use plain `transform` for OG (no cover-crop / no upscale).
- **Rationale:** Iteration plan and product require exact OG dimensions; sip `transform`/`resize` are max-bound and never upscale.
- **Alternatives:** Two-step transform then pad — wrong for OG social crops; keep sharp only for OG — violates zero-sharp goal.

### 5. EXIF orientation

- **Choice:** Do not reimplement sharp’s `.rotate()` unless sip documents auto-orient. If sip does not auto-orient, document the parity gap in README Risks/notes and keep behavior as sip’s default for this step.
- **Rationale:** Avoid inventing EXIF parsers; Workers path should match local sip behavior.
- **Alternatives:** Add a JS EXIF orient step — out of scope unless tests prove need.

### 6. Test fixtures without sharp

- **Choice:** Prefer committed minimal JPEG (and optionally PNG) fixtures under `packages/images/test/fixtures/` at known sizes, **or** synthesize JPEG via sip `encodeJpeg` from generated RGB scanlines in a test helper. Replace `packages/db` catalog test helpers that `import sharp` solely for `createTestImage` with the same fixture/helper approach (shared tiny helper in images tests, or duplicate fixture files — avoid `@unveiled/db` depending on images test paths).
- **Rationale:** `bun test` must not need native sharp.
- **Alternatives:** Keep sharp as a devDependency for fixtures only — rejected (verification requires no sharp imports in the package).

### 7. `getVariantDimensions` via `inspect`

- **Choice:** Replace `sharp(...).metadata()` with sip `inspect` on each variant buffer.
- **Rationale:** Same package, no sharp.

### 8. Buffer vs Uint8Array at the public boundary

- **Choice:** Keep returning `Record<VariantFilename, Buffer>` from `generateImageVariants` for API stability (`Buffer.from(arrayBuffer)` after collect). Internally pass `Uint8Array` / `ArrayBuffer` to sip.
- **Rationale:** Callers and S3 upload already use Buffer.

## Risks / Trade-offs

- **[OG crop memory]** Cover-crop may need a full decoded bitmap for one variant → Accept; ladder variants stay scanline/`transform`; only OG buffers pixels.
- **[EXIF orientation parity]** Sip may not auto-rotate → Document; add follow-up if production photos appear sideways.
- **[WASM load in bun test]** Default `ready()` must work under Bun without Workers-specific wiring → Verify in this step; if Bun needs explicit wasm path, fix in package (step 03 still owns Worker bundling).
- **[db still lists sharp]** Production guards and leftover sharp in `@unveiled/db` package.json until step 03 → Only remove sharp from images + fixture-only db imports; leave guards.
- **[WebP memory]** Sip fully decodes WebP → Accept within 8 MB upload cap; prefer JPEG sources in seed/demo.

## Migration Plan

1. Land sip implementation + tests on the feature branch; confirm `rg` shows no sharp imports under `packages/images`.
2. Update db catalog fixture helpers if they break without sharp.
3. Local smoke optional: `bun run dev` + admin upload with R2.
4. Merge; step 03 removes Workers guards and proves deployed WASM.
5. Rollback: revert package dependency swap (sharp return) — no data migration; existing R2 `.jpg` objects remain valid.

## Open Questions

- None blocking apply: if Bun `ready()` fails without custom wasm bytes, resolve during implementation by following sip’s Node/Bun loader docs before finishing tasks.
