## Context

Parent feature: Featured partners (`.dev-plan/current-iteration/featured-partners-parent-guide.md`). Step 01 is schema + domain only.

Featured events already ships the pattern to mirror: `packages/db/src/schema/featured-events.ts`, `packages/db/src/catalog/featured-events.ts`, and `featured-events.integration.test.ts`. Partners catalog helpers live in `packages/db/src/catalog/partners.ts` (`listPartners`, `getPartnerById`, name-only `ilike` search). Discover Partner venues curation is deferred to step 02; this step only makes persistence + package APIs available.

Constraints: business logic in `@unveiled/db`; no `apps/web` changes; do not invent partner-portal fields; product SoT docs deferred to step 03 unless a minimal reviewer note is needed.

## Goals / Non-Goals

**Goals:**

- Persist admin-curated membership in `featured_partners` without duplicating partner payload columns.
- Package helpers: list featured (optional `limit`), search candidates excluding already-featured, add (append `sort_order`), remove (join row only).
- Migration + barrel exports + integration tests.

**Non-Goals:**

- Admin Featured partners tab / SSR forms (step 02).
- Discover query swap, demo seed featured partners (step 02).
- Full product docs / BDD / e2e (step 03).
- Reorder / move-up-down APIs; hard rejection when curated list exceeds 8.
- Partner portal / check-in.

## Decisions

1. **Join table keyed by `partner_id` (PK = `partner_id`)**
   - **Choice:** `featured_partners.partner_id` uuid PK + FK → `partners.id` **ON DELETE CASCADE**; columns `sort_order` integer NOT NULL, `created_at` timestamptz NOT NULL default now. No separate surrogate uuid.
   - **Rationale:** Mirrors `featured_events`; one row per partner; unique by construction; remove-from-featured ≠ delete venue; cascade clears orphans when a partner is deleted.
   - **Alternatives:** Surrogate PK + unique `partner_id` (extra column); soft-delete flag; array on a settings row.

2. **Catalog module ownership (`packages/db/src/catalog/featured-partners.ts`)**
   - **Choice:** Domain helpers under catalog next to `featured-events` / `partners`. Export from `catalog/index.ts` (and schema from `schema/index.ts`).
   - **Rationale:** Discover reads and admin mutations (step 02) share the same helpers; keeps curation out of `apps/web` route files.
   - **Alternatives:** `admin/featured-partners.ts` (splits read path); helpers only in schema file (no validation).

3. **Append `sort_order` on add**
   - **Choice:** On `addFeaturedPartner`, set `sort_order = (MAX(sort_order) ?? -1) + 1`; reject if already featured.
   - **Rationale:** Matches featured events and parent non-goal (no drag-and-drop reorder).
   - **Alternatives:** Caller-supplied order; `created_at`-only ordering.

4. **Helper surface**
   - **Choice:**
     - `listFeaturedPartners(db, { limit? })` — join `partners`, return `FeaturedPartnerRow = Partner & { sortOrder }`, order by `sort_order` asc then partner `name` asc (stable secondary; `created_at` acceptable if name ties poorly in practice — prefer `name` to match step brief). Apply SQL `limit` when provided (Discover will pass `8`).
     - `searchPartnersNotFeatured(db, { q?, limit?, offset? })` — reuse partners name `ilike` search (not address — `listPartners` does not search address); exclude ids already in `featured_partners`.
     - `addFeaturedPartner(db, partnerId)` — require partner exists (`PARTNER_NOT_FOUND`); reject duplicate (`ALREADY_FEATURED`); append sort_order.
     - `removeFeaturedPartner(db, partnerId)` — delete featured row only; do not delete `partners` row (idempotent delete OK).
   - **Rationale:** Matches step brief; enough for step 02 admin + Discover without redesign. No `listFeaturedPartnerIds` required unless search exclusion needs it — `notExists` subquery is enough (same as featured events’ search path).
   - **Alternatives:** Hard-fail when curated count ≥ 8 (parent: Discover caps display; admin may hold longer list).

5. **Errors via existing `CatalogValidationError` codes**
   - **Choice:** Reuse `PARTNER_NOT_FOUND` and `ALREADY_FEATURED` — no new error codes.
   - **Rationale:** Already on `CatalogErrorCode`; consistent with partners / featured-events APIs.
   - **Alternatives:** New `PARTNER_ALREADY_FEATURED` (unnecessary split).

6. **Tests: integration when `DATABASE_URL` set**
   - **Choice:** Mirror `featured-events.integration.test.ts` — skip with warn if no DB; cover list order, add append, duplicate reject, remove keeps partner, search excludes featured. Optionally assert partner delete cascades featured row when easy to include.
   - **Rationale:** FK/joins need Postgres; matches package norms.
   - **Alternatives:** Pure unit mocks; defer tests to step 02 (reject — step verification requires them).

7. **Docs: defer schema overview to step 03**
   - **Choice:** Do not require `docs/product/database/schema-overview.md` update in this step (prefer documenting with the rest of product docs in step 03). Minimal note OK only if reviewers need it.
   - **Rationale:** Step brief cleanup section; product SoT batching in step 03.

## Risks / Trade-offs

- **[Risk] Concurrent add races on `sort_order` / duplicate** → Mitigation: unique PK on `partner_id`; accept rare gaps on sort_order under race (same as featured events).
- **[Risk] Admin curates more than 8 while Discover shows 8** → Mitigation: intentional per parent guide; list helper `limit` is display-only.
- **[Risk] Accidental apps/web edits** → Mitigation: verify git diff excludes `apps/web` for this step.
- **[Trade-off] openspec/specs are not product SoT** → Delta still written under `partner-catalog`; implementers update `docs/product/` in step 03.

## Migration Plan

1. Add Drizzle schema + export; `bun run db:generate`; review SQL (FK CASCADE, PK, columns).
2. Implement helpers + integration tests; apply with `bun run db:migrate` when verifying against a DB.
3. `bun run lint`, `bun run typecheck`, scoped `bun test` for featured-partners helpers.
4. Rollback = revert migration + schema (drop `featured_partners`). No apps/web deploy dependency for this slice alone; migrate before step 02 uses the table.

## Open Questions

- None blocking for step 01. Display cap vs hard-reject on 9th add remains a parent open question for step 02 if product changes mind; default stays Discover `limit: 8` only.
