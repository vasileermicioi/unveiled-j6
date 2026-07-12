# @unveiled/db

Drizzle ORM schema, migrations, and catalog domain logic for Unveiled Berlin **public** Postgres tables.

## Neon Auth boundary

Neon Auth hosts the Better Auth backend in the same Postgres project under the `neon_auth` schema (`user`, `session`, `account`, etc.). Those tables are **managed by Neon** — do not model or migrate them with Drizzle.

`public.users.id` stores the same id as the Better Auth session API. Link records in application code at signup; there is no Drizzle FK to `neon_auth`.

## Database clients

| Export | Driver | Use |
|---|---|---|
| `createDb(url)` | Neon HTTP (`drizzle-orm/neon-http`) | Reads and simple single-statement writes |
| `createTxDb(url)` | Neon `Pool` + WebSocket (`drizzle-orm/neon-serverless`) | Multi-statement transactions and `SELECT … FOR UPDATE` |

Booking and webhook ledger writes **must** use `createTxDb` (or a transaction opened from it). Catalog reads may keep using `createDb`.

`createTxDb` returns a Drizzle client with a `.pool` property. On Cloudflare Workers, create the client per request and call `pool.end()` when the request finishes (e.g. via `waitUntil`) so connections do not leak. Bun/Node scripts should also end the pool after the script completes.

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

### Phase 5 discovery (step 01+)

- `public.saved_events` — member bookmarks keyed by `(user_id, event_id)`

### Phase 6 payments & booking (step 01+)

- `public.bookings` — event bookings with `(user_id, idempotency_key)` uniqueness
- `public.credit_ledger` — credit movements; unique `idempotency_key` where not null

## Catalog domain exports

Business logic for admin catalog operations lives in `packages/db/src/catalog/` and is re-exported from `@unveiled/db`:

**Partners:** `createPartner`, `updatePartner`, `deletePartner`, `listPartners`, `getPartnerById`, `regenerateVenueCheckInToken`, `renamePartnerSyncEvents`

**Events:** `createEvent`, `createEventSeries`, `updateEvent`, `deleteEvent`, `listEvents`, `getEventById`, `recalculateRemainingCapacity`, `exportRedemptionCodesCsv`

**Discovery:** `listMemberFeedEvents`, `listMemberFeedMapEvents`, `MEMBER_FEED_PAGE_SIZE`, `MEMBER_FEED_MAP_MAX`, `saveEvent`, `unsaveEvent`, `isEventSaved`, `listSavedEventIds`, `listSavedUpcomingEvents`, `berlinTodayRange`, `berlinInclusiveDateRange`, `getBerlinCalendarDate`

**Images:** `attachImageToPartner`, `attachImageToEvent`, `deleteImageRecord`, `persistImageFromSource`

**Seed:** `runDemoSeed`, `shouldRunDemoSeed`

Validation failures throw `CatalogValidationError` with stable `code` values for SSR form mapping.

## Demo seed

`bun run seed:demo` inserts sample partners (remote logo URLs) and upcoming events **only when both `partners` and `events` are empty**. A second run is a no-op. Requires `DATABASE_URL` and Phase 4 R2 env vars when processing remote images.

## JSONB behavior fields (no migration)

`users.behavior` is schemaless JSONB. Typed fields such as `onboarding_step` are added at runtime by `@unveiled/auth` onboarding helpers — no Drizzle migration is required when extending `UserBehavior` in TypeScript.
