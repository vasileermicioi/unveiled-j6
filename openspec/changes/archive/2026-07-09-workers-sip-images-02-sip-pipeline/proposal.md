## Why

Step 01 locked the six JPEG filename/MIME contract, but `@unveiled/images` still depends on Node-native `sharp`, which cannot run on Cloudflare Workers. Replacing sharp with `@standardagents/sip` now makes the package Workers-capable and unblocks step 03 (Workers runtime wiring and guard removal).

## What Changes

- Add `@standardagents/sip` (`^1.0.1`) to `@unveiled/images` and remove the `sharp` dependency from that package.
- Rewrite `validation.ts` to use sip `inspect` for format/dimensions while keeping 8 MB / 800×420 / JPEG|PNG|WebP rules (continue rejecting AVIF).
- Rewrite `process.ts` to generate all six JPEG variants via sip (`ready`, `transform`/`collect` for max-width ladder; `decode` + center cover-crop + `encodeJpeg` for `og-1200x630.jpg`).
- Keep public exports (`processImageFromBuffer`, `processImageFromUrl`, `generateImageVariants`, S3 helpers, URL builders) stable; Content-Type remains `image/jpeg`.
- Replace sharp-based unit-test fixtures in `packages/images` (and any `@unveiled/db` catalog helpers that import sharp only to synthesize image bytes) with sip- or fixture-based JPEG/PNG buffers.
- Update `packages/images/README.md` Runtime section to state sip on Workers + local Node.

**Out of scope:** removing `IMAGE_PROCESSING_UNAVAILABLE` / dynamic-import guards in `@unveiled/db`; Wrangler/Vite WASM asset proof; Workers e2e; dual sharp+sip backends.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-catalog`: Require `@unveiled/images` to generate the six JPEG variants with `@standardagents/sip` and forbid a `sharp` (or other Node-native image addon) dependency; add unit-test and OG cover-crop scenarios for the sip pipeline.

## Impact

- **Package:** `packages/images` — `package.json`, `process.ts`, `validation.ts`, `process.test.ts`, `README.md`; optional tiny fixtures under `packages/images/test/fixtures/`.
- **Downstream tests only:** `packages/db` catalog test/seed helpers that import `sharp` solely to create image bytes (not the `IMAGE_PROCESSING_UNAVAILABLE` production guards).
- **Dependencies:** `@standardagents/sip` in; `sharp` out of `@unveiled/images`.
- **APIs:** No public API shape changes; callers keep using the same helpers and `.jpg` keys.
- **Follow-on:** Step 03 wires Workers WASM/assets and removes processing-unavailable guards; step 04 e2e against Workers URL.
