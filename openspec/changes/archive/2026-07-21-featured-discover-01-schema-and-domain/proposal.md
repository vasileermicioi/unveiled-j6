## Why

Discover currently previews the next N upcoming catalog events (`listUpcomingEvents`), so curation is accidental chronology rather than an admin-owned list. Featured Discover needs a dedicated `featured_events` store and package helpers before any admin UI or Discover query swap.

## What Changes

- Add Drizzle schema `featured_events` (`event_id` → `events.id` ON DELETE CASCADE, `sort_order`, `created_at`) and generate a migration.
- Add catalog domain helpers in `@unveiled/db`: list featured (optional upcoming filter), list featured IDs, search non-featured candidates, add, remove.
- Cover helpers with package tests (add, duplicate rejection, remove keeps event, upcoming filter).
- Document the table in `docs/product/database/schema-overview.md` (minimal; full product behavior in step 04).
- **No** Discover route change, admin tab, nav/membership gating, or full demo-seed wiring in this step.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-catalog`: Persist an admin-curated featured list in `featured_events` keyed by `events.id` (no duplicated event payload); cascade on event delete; remove-from-featured deletes only the join row; domain helpers for list / search-not-featured / add / remove with append `sort_order`.

## Impact

- **Schema:** `packages/db/src/schema/featured-events.ts` + export from `schema/index.ts`; migration under `packages/db`.
- **Domain:** `packages/db/src/catalog/featured-events.ts` (catalog ownership for Discover reads); export from catalog barrel / package surface as needed.
- **Errors:** likely extend `CatalogValidationError` codes for missing event / already featured.
- **Docs:** `docs/product/database/schema-overview.md` tables list + `featured_events` section.
- **Tests:** new or extended catalog unit/integration tests in `packages/db`.
- **Unchanged this step:** `apps/web` Discover route, admin UI, nav, membership gates, seed (optional smoke OK).
- **Source brief:** `.dev-plan/current-iteration/featured-discover-01-schema-and-domain.md`
- **Parent:** `.dev-plan/current-iteration/featured-discover-parent-guide.md`
- **Consumed by:** `featured-discover-02-admin-tab`
- **Verification:** `bun run lint`, `bun run typecheck`, package tests for featured helpers
