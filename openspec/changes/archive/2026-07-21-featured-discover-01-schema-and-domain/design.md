## Context

Parent feature: Featured Discover & membership browse split (`.dev-plan/current-iteration/featured-discover-parent-guide.md`). Step 01 is schema + domain only.

Today Discover loads `listUpcomingEvents(db, { limit: 6 })` from `apps/web/app/routes/[locale]/discover.tsx`. There is no curated featured list. Join-table precedent: `saved_events` (`packages/db/src/schema/saved-events.ts`). Catalog search/list patterns live in `packages/db/src/catalog/events.ts` (`listEvents`, `listUpcomingEvents`, title/partner `ilike` search).

Constraints: business logic in `@unveiled/db`; no apps/web UI this step; Europe/Berlin display unchanged; `date_time` comparisons use UTC `Date`/`now` like existing catalog helpers; product SoT updates for full Discover/browse behavior deferred to steps 03–04 (schema overview only here).

## Goals / Non-Goals

**Goals:**

- Persist admin-curated membership in `featured_events` without duplicating event payload columns.
- Package helpers: list featured (+ optional upcoming filter), list featured IDs, search candidates excluding already-featured, add (append `sort_order`), remove (join row only).
- Migration + schema overview mention + package tests.

**Non-Goals:**

- Admin Featured tab / SSR forms (step 02).
- Discover query swap, nav label, membership gating (step 03).
- Full product docs / BDD / seed polish (step 04).
- Drag-and-drop reorder UI; algorithmic auto-featuring; partner-managed lists.

## Decisions

1. **Join table keyed by `event_id` (PK = `event_id`)**
   - **Choice:** `featured_events.event_id` uuid PK + FK → `events.id` **ON DELETE CASCADE**; columns `sort_order` integer NOT NULL, `created_at` timestamptz NOT NULL default now. No separate surrogate uuid.
   - **Rationale:** One row per event; unique by construction; matches “remove featured ≠ delete event”; cascade clears orphan featured rows when catalog deletes an event. Parent guide already chose unique `event_id`.
   - **Alternatives:** Surrogate PK + unique `event_id` (extra column, no benefit); soft-delete flag (complicates search-not-featured); array on a settings row (harder to query/join).

2. **Catalog module ownership (`packages/db/src/catalog/featured-events.ts`)**
   - **Choice:** Domain helpers live under catalog (same package surface as `events` / `discovery`), not `admin/`. Export from `catalog/index.ts` (and thus `@unveiled/db` via catalog re-export).
   - **Rationale:** Discover reads are catalog concerns; admin tab (step 02) will call the same helpers. Keeps booking/admin packages free of Discover curation.
   - **Alternatives:** `admin/featured-events.ts` (splits read path awkwardly); put helpers only in schema file (no validation layer).

3. **Append `sort_order` on add**
   - **Choice:** On `addFeaturedEvent`, set `sort_order = (MAX(sort_order) ?? -1) + 1` (or equivalent) in one insert path; reject if `event_id` already featured.
   - **Rationale:** Stable display order without reorder UI this step; parent guide: order by `sort_order` then `date_time` on Discover later.
   - **Alternatives:** Always 0 / use `created_at` only (weaker explicit order); require caller-supplied order (admin UX burden later).

4. **Helper surface**
   - **Choice:**
     - `listFeaturedEvents(db, { upcomingOnly?, now? })` — join `events`, return event rows + `sort_order`, ordered by `sort_order` asc then `date_time` asc; when `upcomingOnly`, filter `date_time >= now`.
     - `listFeaturedEventIds(db)` — ids only for admin/search exclusion.
     - `searchEventsNotFeatured(db, { q?, limit?, offset? })` — reuse title/partner search like `listEvents`, exclude ids in `featured_events`.
     - `addFeaturedEvent(db, eventId)` — require event exists (`EVENT_NOT_FOUND`); reject duplicate (`ALREADY_FEATURED` or similar); append sort_order.
     - `removeFeaturedEvent(db, eventId)` — delete featured row only (idempotent no-op or not-found OK — prefer delete-then-done; do not throw if missing unless existing catalog style prefers otherwise).
   - **Rationale:** Matches step brief; enough for step 02 admin without redesign.
   - **Alternatives:** Single mega-list with filters only (harder for candidate search); soft errors for duplicate as success (parent prefers validation error / unique constraint).

5. **Errors via `CatalogValidationError`**
   - **Choice:** Extend `CatalogErrorCode` with at least `ALREADY_FEATURED` (reuse `EVENT_NOT_FOUND` for missing event). Throw from add path.
   - **Rationale:** Consistent with partners/events catalog APIs.
   - **Alternatives:** Silent idempotent add (weaker admin feedback); generic `REQUIRED_FIELD`.

6. **Tests: integration when `DATABASE_URL` set**
   - **Choice:** Follow `discovery.integration.test.ts` pattern — skip with warn if no DB; cover add, duplicate rejection, remove keeps `events` row, upcoming filter. Schema-only unit assert optional if useful.
   - **Rationale:** FK cascade and real joins need Postgres; matches package norms.
   - **Alternatives:** Pure unit mocks of drizzle (brittle); defer all tests to step 02 (reject — step verification requires them).

7. **Docs: schema overview only**
   - **Choice:** Add `featured_events` to the tables summary and a short field table next to `saved_events`. Do not rewrite Discover Gherkin yet.
   - **Rationale:** Step 04 owns full product behavior docs; schema SoT should not lag the migration.

## Risks / Trade-offs

- **[Risk] Concurrent add races on `sort_order` / duplicate** → Mitigation: unique PK on `event_id` (DB rejects duplicate); accept rare gaps/ties on sort_order under race (append max is best-effort); no transaction pool required for MVP.
- **[Risk] Past featured rows clutter admin later** → Mitigation: intentional per parent guide; Discover will filter upcoming; admin lists all until removed (step 02).
- **[Risk] Accidental Discover/UI edits** → Mitigation: verify git diff excludes `apps/web` routes/components except if package imports require zero touch.
- **[Trade-off] openspec/specs are not product SoT** → Delta still written; implementers update `docs/product/database/schema-overview.md` now and feature docs in step 04.

## Migration Plan

1. Add Drizzle schema + export; `bun run db:generate`; review SQL (FK CASCADE, PK).
2. Implement helpers + tests; document migrate (`bun run db:migrate` / build pipeline).
3. Update schema overview.
4. `bun run lint`, `bun run typecheck`, scoped `bun test` for featured helpers.
5. Rollback = revert migration + schema (down migration if generated; otherwise drop table). No apps/web deploy dependency for this slice alone, but migrate before step 02/03 use the table.

## Open Questions

- None blocking for step 01. Membership “active” definition and nav redirects remain parent open questions for step 03.
