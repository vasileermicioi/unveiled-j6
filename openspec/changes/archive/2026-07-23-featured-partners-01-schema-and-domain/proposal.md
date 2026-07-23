## Why

Discover’s Partner venues marquee still draws from the general partner catalog rather than an admin-curated list. Featured partners needs a `featured_partners` join table and `@unveiled/db` helpers (mirroring `featured_events`) before admin UI or Discover can consume a real curated store.

## What Changes

- Add Drizzle schema `featured_partners` (`partner_id` → `partners.id` ON DELETE CASCADE, `sort_order`, `created_at`) and generate a migration.
- Add catalog domain helpers in `@unveiled/db`: `listFeaturedPartners` (optional `limit`), `searchPartnersNotFeatured`, `addFeaturedPartner` (append `sort_order`), `removeFeaturedPartner` (join row only).
- Cover helpers with package integration tests (list order, add append, duplicate reject, remove keeps partner, search excludes featured).
- Export schema + catalog from package barrels.
- **No** admin routes/UI, Discover wire-up, demo seed, product-docs/e2e, reorder APIs, or hard max-8 rejection on add (steps 02–03 / out of scope).

## Capabilities

### New Capabilities

- `partner-catalog`: Persist an admin-curated Discover partners list in `featured_partners` keyed by `partners.id` (no duplicated partner payload); cascade on partner delete; remove-from-featured deletes only the join row; domain helpers for list / search-not-featured / add / remove with append `sort_order` and optional list limit for Discover’s “up to 8”.

### Modified Capabilities

- _(none)_

## Impact

- **Schema:** `packages/db/src/schema/featured-partners.ts` + export from `schema/index.ts`; migration under `packages/db`.
- **Domain:** `packages/db/src/catalog/featured-partners.ts`; export from `catalog/index.ts`.
- **Errors:** reuse `CatalogValidationError` codes `PARTNER_NOT_FOUND` and `ALREADY_FEATURED` (already defined).
- **Tests:** `packages/db/src/catalog/featured-partners.integration.test.ts` (skip/warn if no `DATABASE_URL`).
- **Docs this step:** prefer deferring full `docs/product/database/schema-overview.md` update to step 03 (per step brief); no Gherkin/e2e.
- **Unchanged this step:** `apps/web`, Discover, admin Featured partners UI, seed, reorder / move-up-down, hard max-8 on add.
- **Source brief:** `.dev-plan/current-iteration/featured-partners-01-schema-and-domain.md`
- **Parent:** `.dev-plan/current-iteration/featured-partners-parent-guide.md`
- **Depends on:** none
- **Consumed by:** `featured-partners-02-admin-and-discover`
- **Verification:** `bun run lint`, `bun run typecheck`, `bun test packages/db/src/catalog/featured-partners.integration.test.ts` when `DATABASE_URL` is set
