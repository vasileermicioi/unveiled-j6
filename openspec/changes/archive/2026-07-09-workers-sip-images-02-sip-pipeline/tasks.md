## 1. Setup

- [x] 1.1 Confirm step 01 JPEG contract: `VARIANT_FILENAMES` are all `*.jpg` and S3 Content-Type is `image/jpeg`
- [x] 1.2 Add `@standardagents/sip` (`^1.0.1`) to `packages/images/package.json` and remove `sharp`; run `bun install`

## 2. Sip-backed validation and processing

- [x] 2.1 Rewrite `validation.ts` to await module-level `ready()`, use `inspect` for format/dimensions, keep 8 MB / 800×420 / JPEG|PNG|WebP rules, reject AVIF
- [x] 2.2 Rewrite ladder variants in `process.ts` (`original` + hero/large/medium/small) via `transform` + `collect` with constants for max bounds and quality; return `Buffer` map keyed by `VariantFilename`
- [x] 2.3 Implement `og-1200x630.jpg` via `decode` → center cover-crop to exactly 1200×630 (upscale allowed) → `encodeJpeg` + `collect`
- [x] 2.4 Rewrite `getVariantDimensions` to use sip `inspect` instead of sharp metadata; ensure R2 upload helpers still set `image/jpeg`

## 3. Tests, fixtures, and docs

- [x] 3.1 Replace sharp-based `createTestImage` in `packages/images/src/process.test.ts` with fixtures and/or sip-encoded JPEG helpers; assert six JPEG variants, OG exactly 1200×630, and no upscale on width-ladder for small sources
- [x] 3.2 Replace `@unveiled/db` catalog test/seed helpers that import `sharp` only to synthesize image bytes (e.g. `catalog.integration.test.ts`, `discovery.integration.test.ts`, `seed-pagination.ts`) with fixtures or a non-sharp helper — do **not** remove `IMAGE_PROCESSING_UNAVAILABLE` guards
- [x] 3.3 Update `packages/images/README.md` Runtime section: sip on Workers + local Node; no sharp

## 4. Verification

- [x] 4.1 Run `cd packages/images && bun test` — all variant dimension/quality assertions pass
- [x] 4.2 Confirm `rg -n "from \\\"sharp\\\"|from 'sharp'" packages/images` has no matches
- [x] 4.3 Run `bun run typecheck` and `bun run lint` at repo root
- [ ] 4.4 Optional smoke: `bun run dev` + admin partner/event upload with R2 configured creates six `.jpg` keys
