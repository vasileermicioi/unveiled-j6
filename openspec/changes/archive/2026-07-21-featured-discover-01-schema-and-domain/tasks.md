## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/featured-discover-01-schema-and-domain.md` and parent guide release criteria / non-goals
- [x] 1.2 Confirm prerequisites: `packages/db/src/schema/saved-events.ts`, `packages/db/src/catalog/events.ts` (`listEvents` / `listUpcomingEvents`), `docs/product/database/schema-overview.md`

## 2. Schema and migration

- [x] 2.1 Add `packages/db/src/schema/featured-events.ts` (`event_id` PK FK → `events.id` ON DELETE CASCADE, `sort_order`, `created_at`)
- [x] 2.2 Export from `packages/db/src/schema/index.ts`
- [x] 2.3 Run `bun run db:generate`, review migration SQL (CASCADE + PK), document migrate path

## 3. Domain helpers

- [x] 3.1 Add `packages/db/src/catalog/featured-events.ts` with `listFeaturedEvents`, `listFeaturedEventIds`, `searchEventsNotFeatured`, `addFeaturedEvent`, `removeFeaturedEvent`
- [x] 3.2 Extend `CatalogErrorCode` / `CatalogValidationError` for duplicate featured (reuse `EVENT_NOT_FOUND`)
- [x] 3.3 Export helpers from `packages/db/src/catalog/index.ts`

## 4. Tests and docs

- [x] 4.1 Add package tests covering add, duplicate rejection, remove keeps `events` row, upcoming filter (skip if no `DATABASE_URL`)
- [x] 4.2 Document `featured_events` in `docs/product/database/schema-overview.md` (tables list + short field table)

## 5. Validation and handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Run scoped package tests for featured helpers (exit 0)
- [x] 5.3 Confirm no Discover/admin UI (`apps/web` routes) was changed
- [x] 5.4 Mark step done in `.dev-plan/current-iteration/featured-discover-parent-guide.md`
