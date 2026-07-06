## Context

Phase 3 onboarding is merged: `@unveiled/db` exposes `public.users` and `public.subscriptions`; `@unveiled/auth` handles session, guards, and provisioning. Phase 4 catalog work is blocked until Postgres can store venue records (`partners`), events, and processed images — the old app's plain URL strings and base64 blobs are explicitly not carried forward.

This is catalog step 01 of 5: schema + migrations + `@unveiled/images` pipeline only. No admin UI, domain CRUD, seed script, or `apps/web` route changes. **`partners` is a venue table** — partner login accounts (`PARTNER` role) are Phase 8.

Source of truth: `docs/migration/database/schema-overview.md` (`images`, `partners`, `events`), `docs/migration/extras/image-uploads.md`, `docs/migration/extras/integrations-and-config.md` (R2 env vars).

Existing patterns: `packages/db/src/schema/users.ts`, `subscriptions.ts`, Drizzle `pgEnum` + `check()` constraints, root `db:generate` / `db:migrate` scripts.

## Goals / Non-Goals

**Goals:**

- Add Drizzle schema and migration for `public.images`, `public.partners`, and `public.events` with enums, FKs, `remaining_capacity >= 0` check, and event date indexes.
- Export new tables from `packages/db/src/schema/index.ts` and `packages/db/src/index.ts`.
- Create `@unveiled/images` with six-variant WebP processing (sharp), S3-compatible upload (R2 via `@aws-sdk/client-s3`), validation, URL helpers, unit tests, and README.
- Wire `@unveiled/images` into the Bun workspace; package must typecheck without importing `apps/web`.

**Non-Goals:**

- Catalog domain functions, `scripts/seed-demo.ts`, admin/public routes, `@unveiled/ui`, EventCard, `/discover` wiring.
- Partner rename propagation and event capacity recalculation logic (step 02).
- Inserting `images` rows from route handlers — step 01 returns processed buffers + metadata; DB writes stay in step 02 unless a thin shared helper is clearly justified (prefer no `@unveiled/db` dependency in `@unveiled/images`).
- Image moderation, manual crop UI, multi-image galleries, async/background processing.

## Decisions

### 1. Schema file layout

```
packages/db/src/schema/
├── users.ts           # existing
├── subscriptions.ts # existing
├── images.ts          # new
├── partners.ts        # new — references images
└── events.ts          # new — references partners + images
```

**Rationale:** Mirrors auth step 01 modular layout; FK order is `images` → `partners` → `events`. `users.partner_id` remains without FK until step 02 if needed (already nullable text from Phase 2).

### 2. `images` table

| Column | Drizzle type | Notes |
|---|---|---|
| `id` | `uuid`, PK, default random | Storage folder key: `images/{id}/` |
| `original_width`, `original_height` | `integer`, not null | Natural source dimensions |
| `source` | `pgEnum('image_source', ['UPLOAD','REMOTE_URL'])` | Entry path |
| `source_url` | `text`, nullable | Set when `source = REMOTE_URL` |
| `uploaded_by` | `text`, FK → `users.id`, nullable | Admin/partner who triggered upload (future) |
| `created_at` | `timestamptz`, not null, default now | |

No per-variant columns — six filenames are a fixed convention per `image-uploads.md` §1.

### 3. `partners` table (venue records)

| Column | Drizzle type | Notes |
|---|---|---|
| `id` | `uuid`, PK | |
| `name`, `address`, `contact_email` | `text`, not null | |
| `logo_image_id` | `uuid`, FK → `images.id`, nullable | Optional logo |
| `venue_check_in_token` | `text`, unique, nullable | Phase 8 check-in |
| `portal_user_id` | `text`, FK → `users.id`, nullable | Phase 8 portal login |
| `portal_user_email` | `text`, nullable | Denormalized display |
| `created_at`, `updated_at` | `timestamptz`, not null, default now | |

**FK delete:** `logo_image_id` → `images.id` with `ON DELETE RESTRICT` (app deletes image when partner is deleted/replaced — step 02+).

### 4. `events` table

| Column | Drizzle type | Notes |
|---|---|---|
| `id` | `uuid`, PK | |
| `partner_id` | `uuid`, FK → `partners.id`, not null | |
| `partner_name` | `text`, not null | Denormalized; sync in step 02 |
| `title`, `description`, `address`, `neighborhood` | `text`, not null | |
| `image_id` | `uuid`, FK → `images.id`, not null | Required event image |
| `category`, `event_type` | `text`, not null | Free-form strings |
| `tags` | `text[]`, not null, default `{}` | |
| `date_time` | `timestamptz`, not null | UTC instant |
| `timing_mode` | `pgEnum('timing_mode', ['TIME_SLOT','ALL_DAY'])` | |
| `start_time_minutes` | `integer` | 0–1439, server-derived in step 02 |
| `weekday` | `integer` | 0–6, server-derived |
| `credit_price` | `integer`, not null | |
| `total_capacity`, `remaining_capacity` | `integer`, not null | Check: `remaining_capacity >= 0` |
| `ticket_type` | `pgEnum('ticket_type', ['VOUCHER','SECRET_CODE'])` | |
| `secret_code_mode` | `pgEnum('secret_code_mode', ['MANUAL','SHARED_GENERATED','UNIQUE_PER_BOOKING'])`, nullable | |
| `secret_code` | `text`, nullable | |
| `promo_code`, `event_website_url` | `text`, nullable | Required together when VOUCHER (app layer step 02+) |
| `barrier_free` | `boolean`, nullable | |
| `languages` | `text[]`, nullable | |
| `target_age_groups` | `text[]`, nullable | Store age-group strings; align with `AgeGroup` union in app |
| `lat`, `lng` | `numeric`, nullable | |
| `created_at`, `updated_at` | `timestamptz`, not null, default now | |

**Indexes (Drizzle `index()`):**

- `events_date_time_idx` on `(date_time)`
- `events_date_time_partner_id_idx` on `(date_time, partner_id)`
- `events_date_time_category_idx` on `(date_time, category)`

**Alternative considered:** Drop `partner_name` denormalization and always join `partners`. Deferred — schema-overview allows denormalization; step 02 domain layer handles sync.

### 5. UUID vs text PKs

Use **`uuid` with `defaultRandom()`** for `images`, `partners`, and `events` ids — distinct from `users.id` (text, Better Auth id). Matches bucket folder naming and avoids collision with auth ids.

**Alternative considered:** Text PKs like users. Rejected — image pipeline spec ties storage layout to UUID folder names.

### 6. `@unveiled/images` package layout

```
packages/images/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts              # public exports
    ├── constants.ts          # variant filenames, quality targets, dimension caps
    ├── validation.ts         # format, size, min dimensions
    ├── process.ts            # processImageFromBuffer, processImageFromUrl
    ├── s3.ts                   # upload/delete S3 client helpers
    ├── urls.ts                 # buildVariantUrl
    └── process.test.ts
```

**Exports:**

- `processImageFromBuffer(buffer, options?)` → `{ imageId, variants: Record<VariantName, Buffer>, metadata: { width, height, source } }`
- `processImageFromUrl(url, options?)` → same shape after server-side fetch
- `deleteImageObjects(imageId)` → deletes all six objects under prefix
- `buildVariantUrl(imageId, variantFilename)` → `{IMAGE_PUBLIC_BASE_URL}/images/{id}/{filename}`
- Variant filename constants: `original.webp`, `hero-1920.webp`, `large-1280.webp`, `medium-640.webp`, `small-320.webp`, `og-1200x630.webp`

**Processing contract (sharp):**

| Variant | Behavior |
|---|---|
| `original.webp` | Re-encode WebP; cap longest edge 3840px; never upscale |
| `hero-1920.webp` | Max width 1920, downscale only, ~82 quality |
| `large-1280.webp` | Max width 1280, downscale only, ~80 quality |
| `medium-640.webp` | Max width 640, downscale only, ~78 quality |
| `small-320.webp` | Max width 320, downscale only, ~75 quality |
| `og-1200x630.webp` | Cover-crop 1200×630 center; may upscale small sources (~85 quality) |

Validation before processing: JPEG/PNG/WebP, max 8 MB, min 800×420. On validation failure: throw typed error; **no S3 writes**.

**Alternative considered:** `@unveiled/images` inserts `images` rows. Rejected for step 01 — keeps package storage-only; step 02 catalog domain owns DB transactions.

### 7. S3 / R2 client

- **SDK:** `@aws-sdk/client-s3` with `PutObjectCommand`, `DeleteObjectsCommand`.
- **Env (read at call site or lazy module init):** `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `IMAGE_PUBLIC_BASE_URL`.
- **Key prefix:** `images/{imageId}/{variant}.webp`
- **`S3_ENDPOINT`:** account host only (no bucket path); `S3_BUCKET` is bucket name.

**Alternative considered:** MinIO local dev. Optional for integration smoke; unit tests mock S3 or test resize-only without upload.

### 8. Dependencies and workspace wiring

`packages/images/package.json`:

- Runtime: `sharp`, `@aws-sdk/client-s3`
- Dev: `@unveiled/config`, `bun` test runner
- **No** `@unveiled/db` dependency in step 01

Root `package.json` workspaces already include `packages/*` — no change unless filter scripts need `@unveiled/images` typecheck (covered by `bun run --filter '*' typecheck`).

### 9. Testing strategy

- **Unit tests (`process.test.ts`):** Fixture JPEG/PNG; assert output dimensions per variant using sharp metadata on returned buffers (no real bucket required for core logic).
- **Validation tests:** Reject &lt;800×420, oversize file, unsupported MIME.
- **Optional integration smoke:** With R2 env set, upload test buffer and verify public URL — manual or skipped in CI.

### 10. Migration

- Run `bun run db:generate` after schema files land.
- Commit SQL under `packages/db/drizzle/`.
- Apply with `bun run db:migrate` against Neon dev branch.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Orphaned `images` rows if event insert fails after upload (step 02+) | Documented acceptable gap in image-uploads §4; future sweep job out of scope |
| `sharp` requires Node.js runtime | Document in `packages/images/README.md`; hosting must be Node-capable (AGENTS.md) |
| R2 public access misconfigured | README documents `IMAGE_PUBLIC_BASE_URL` vs `S3_ENDPOINT`; optional smoke test |
| FK order blocks migration if tables created out of sequence | Generate single migration; Drizzle orders by dependency |
| `users.partner_id` still no FK to `partners` | Acceptable until Phase 8 partner portal links accounts |
| Enum drift vs feature files | Match schema-overview exactly; domain validation in step 02 |

## Migration Plan

1. Implement on branch `catalog-01-schema-and-image-pipeline`.
2. `bun install` — link `@unveiled/images`.
3. `DATABASE_URL=... bun run db:generate` — commit new migration SQL.
4. `DATABASE_URL=... bun run db:migrate` — verify tables, indexes, check constraint.
5. `cd packages/images && bun test` — processing tests pass.
6. `bun run typecheck && bun run lint` — repo-wide green.
7. Rollback: revert migration commit; drop new tables on dev branch if needed.

## Open Questions

- None blocking step 01. `target_age_groups` stored as `text[]` in Drizzle (not native enum array) — step 02 validates against `AgeGroup` union.
- Optional Postgres FK from `users.partner_id` → `partners.id` deferred to Phase 8 when partner accounts are linked.
