## 1. Pre-flight

- [x] 1.1 Read `catalog-parent-guide.md`, `.dev-plan/current-iteration/catalog-01-schema-and-image-pipeline.md`, `proposal.md`, `design.md`, and spec deltas
- [x] 1.2 Confirm Phase 2–3 packages exist (`@unveiled/db`, `@unveiled/auth`) and prior migrations apply
- [x] 1.3 Confirm root `.env` has all Phase 4 R2 vars per `.env.example` (`S3_ENDPOINT` host-only, `S3_BUCKET`, `IMAGE_PUBLIC_BASE_URL` — do not commit `.env`)

## 2. Database schema

- [x] 2.1 Create `packages/db/src/schema/images.ts` — `id`, dimensions, `image_source` enum, `source_url`, `uploaded_by` FK → `users.id`, `created_at`
- [x] 2.2 Create `packages/db/src/schema/partners.ts` — venue fields, nullable `logo_image_id` FK → `images.id`, portal fields nullable, timestamps
- [x] 2.3 Create `packages/db/src/schema/events.ts` — all columns per schema-overview, enums (`timing_mode`, `ticket_type`, `secret_code_mode`), required `image_id` FK, `remaining_capacity >= 0` check, three date indexes
- [x] 2.4 Update `packages/db/src/schema/index.ts` to re-export `images`, `partners`, `events`, and enums
- [x] 2.5 Run `DATABASE_URL=... bun run db:generate` and commit migration SQL under `packages/db/drizzle/`

## 3. Images package scaffold

- [x] 3.1 Create `packages/images/package.json` (`@unveiled/images`) with `typecheck` script and dependencies: `sharp`, `@aws-sdk/client-s3`
- [x] 3.2 Create `packages/images/tsconfig.json` extending `@unveiled/config/tsconfig.base.json`
- [x] 3.3 Create `packages/images/src/constants.ts` — six variant filenames, quality targets, dimension caps per `image-uploads.md` §1
- [x] 3.4 Create `packages/images/src/validation.ts` — JPEG/PNG/WebP, max 8 MB, min 800×420; typed validation errors

## 4. Image processing and storage

- [x] 4.1 Implement `packages/images/src/process.ts` — `processImageFromBuffer` with sharp resize/crop for all six variants (no upscaling except `og-1200x630` cover-crop)
- [x] 4.2 Implement `processImageFromUrl` — server-side fetch with timeout, same validation and pipeline as buffer path
- [x] 4.3 Implement `packages/images/src/s3.ts` — upload all six variants to `images/{id}/`, `deleteImageObjects` for cleanup
- [x] 4.4 Implement `packages/images/src/urls.ts` — `buildVariantUrl(imageId, variantFilename)` using `IMAGE_PUBLIC_BASE_URL`
- [x] 4.5 Export public API from `packages/images/src/index.ts`
- [x] 4.6 Create `packages/images/README.md` — env vars, Node/sharp runtime note, public URL convention, variant table

## 5. Tests

- [x] 5.1 Add test fixture image(s) under `packages/images/` (or inline buffer)
- [x] 5.2 Create `packages/images/src/process.test.ts` — assert variant output dimensions/behavior for valid input; reject undersized and invalid formats
- [x] 5.3 Run `cd packages/images && bun test` — all tests pass without requiring live R2 (mock or buffer-only)

## 6. Validation

- [x] 6.1 Run `DATABASE_URL=... bun run db:migrate` — confirm `images`, `partners`, `events` tables, indexes, and check constraint exist
- [x] 6.2 Run `bun run typecheck` — passes including `@unveiled/db` and `@unveiled/images`
- [x] 6.3 Run `bun run lint` — passes repo-wide
- [x] 6.4 Re-run `db:generate` — no pending drift after migration is committed
- [x] 6.5 Confirm no changes under `apps/web/app/routes/` (schema + package only)
- [x] 6.6 Optional: with R2 env set, smoke-test upload and verify `{IMAGE_PUBLIC_BASE_URL}/images/{id}/medium-640.webp` is reachable (skipped — unit tests cover resize logic; run manually before staging)

## 7. Wrap-up

- [x] 7.1 Mark step 01 done in `catalog-parent-guide.md` when change is merged
- [x] 7.2 Hand off to `catalog-02-catalog-domain-and-seed`
