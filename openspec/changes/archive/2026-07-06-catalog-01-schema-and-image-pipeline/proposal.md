## Why

Phase 4 catalog work cannot store partners or events until Postgres tables exist, and image fields require a real upload pipeline (not URL strings). This is step 1 of 5 in the Phase 4 catalog feature: establish persistence and the six-variant WebP + R2 image pipeline so later steps can build domain logic, seed data, and admin UI without reworking storage foundations.

## What Changes

- Add Drizzle schema and migration for `public.images`, `public.partners`, and `public.events` in `@unveiled/db` per `docs/migration/database/schema-overview.md` — including enums (`ImageSource`, ticket/redemption enums, `TimingMode`), FK constraints, `remaining_capacity >= 0` check, and indexes on `events(date_time)`, `(date_time, partner_id)`, `(date_time, category)`.
- Export new tables from `packages/db/src/schema/index.ts` and `packages/db/src/index.ts`.
- Create `@unveiled/images` package with `processImageFromBuffer`, `processImageFromUrl`, `deleteImageObjects`, `buildVariantUrl`, and variant filename constants — sharp resize/crop per `docs/migration/extras/image-uploads.md`, S3 upload via `@aws-sdk/client-s3` (R2-compatible).
- Validation: JPEG/PNG/WebP, max 8 MB, min 800×420; reject upscaling except `og-1200x630` cover-crop exception.
- Unit tests in `packages/images/src/process.test.ts` and env documentation in `packages/images/README.md`.
- Wire `@unveiled/images` into root workspace; keep package free of `apps/web` imports and defer DB row insertion to step 02.
- **Out of scope:** Catalog CRUD domain functions, seed script, admin/public routes, `@unveiled/ui`, EventCard, `/discover` wiring, partner rename propagation, event capacity recalculation logic.

## Capabilities

### New Capabilities

- `event-catalog`: Catalog persistence tables (`images`, `partners`, `events`) and the six-variant WebP image pipeline in `@unveiled/images` with S3-compatible storage and public URL helpers.

### Modified Capabilities

- `platform-foundation`: Extend monorepo package rollout to include `@unveiled/images` (Phase 4) and expand `@unveiled/db` beyond `users`/`subscriptions` with catalog tables.

## Impact

- **Packages:** `@unveiled/db` (new schema files + migration); new `@unveiled/images` (sharp pipeline, S3 helpers, tests, README).
- **Dependencies:** `sharp`, `@aws-sdk/client-s3` in `@unveiled/images`; workspace wiring in root `package.json`.
- **Environment:** `DATABASE_URL` for migrations; R2 vars (`S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `IMAGE_PUBLIC_BASE_URL`) for optional integration smoke.
- **Downstream:** Consumed by `catalog-02-catalog-domain-and-seed`; no `apps/web` route changes in this step.
- **Verification:** `bun run db:migrate`, `cd packages/images && bun test`, `bun run typecheck`, `bun run lint`.
- **Branch:** `catalog-01-schema-and-image-pipeline` per iteration convention.
