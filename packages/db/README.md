# @unveiled/db

Drizzle ORM schema, migrations, and catalog domain logic for Unveiled Berlin **public** Postgres tables.

## Neon Auth boundary

Neon Auth hosts the Better Auth backend in the same Postgres project under the `neon_auth` schema (`user`, `session`, `account`, etc.). Those tables are **managed by Neon** — do not model or migrate them with Drizzle.

`public.users.id` stores the same id as the Better Auth session API. Link records in application code at signup; there is no Drizzle FK to `neon_auth`.

## Scripts

From the repository root (requires `DATABASE_URL`):

```bash
bun run db:generate   # drizzle-kit generate
bun run db:migrate    # drizzle-kit migrate
bun run seed:demo     # idempotent demo partners + events (empty DB only)
```

From `packages/db`:

```bash
bun test              # catalog unit + integration tests
```

Integration tests skip automatically when `DATABASE_URL` is unset.

## Tables

### Phase 2

- `public.users` — app user profile, role, credits, JSONB profile/behavior
- `public.subscriptions` — 1:1 subscription state keyed by `user_id`

### Phase 4 catalog (step 01+)

- `public.images` — processed image metadata (six WebP variants in R2)
- `public.partners` — venue records
- `public.events` — catalog events with denormalized `partner_name`

## Catalog domain exports

Business logic for admin catalog operations lives in `packages/db/src/catalog/` and is re-exported from `@unveiled/db`:

**Partners:** `createPartner`, `updatePartner`, `deletePartner`, `listPartners`, `getPartnerById`, `regenerateVenueCheckInToken`, `renamePartnerSyncEvents`

**Events:** `createEvent`, `createEventSeries`, `updateEvent`, `deleteEvent`, `listEvents`, `getEventById`, `recalculateRemainingCapacity`, `exportRedemptionCodesCsv`

**Images:** `attachImageToPartner`, `attachImageToEvent`, `deleteImageRecord`, `persistImageFromSource`

**Seed:** `runDemoSeed`, `shouldRunDemoSeed`

Validation failures throw `CatalogValidationError` with stable `code` values for SSR form mapping.

## Demo seed

`bun run seed:demo` inserts sample partners (remote logo URLs) and upcoming events **only when both `partners` and `events` are empty**. A second run is a no-op. Requires `DATABASE_URL` and Phase 4 R2 env vars when processing remote images.

## JSONB behavior fields (no migration)

`users.behavior` is schemaless JSONB. Typed fields such as `onboarding_step` are added at runtime by `@unveiled/auth` onboarding helpers — no Drizzle migration is required when extending `UserBehavior` in TypeScript.
