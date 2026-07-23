## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/featured-partners-01-schema-and-domain.md` and parent guide release criteria / non-goals
- [x] 1.2 Confirm prerequisites: `packages/db/src/schema/featured-events.ts`, `packages/db/src/catalog/featured-events.ts` (+ integration test), `packages/db/src/schema/partners.ts`, `packages/db/src/catalog/partners.ts`, schema/catalog barrels
- [x] 1.3 Re-read featured-events schema + catalog + integration tests as the implementation template

## 2. Schema and migration

- [x] 2.1 Add `packages/db/src/schema/featured-partners.ts` (`partner_id` PK FK → `partners.id` ON DELETE CASCADE, `sort_order`, `created_at`)
- [x] 2.2 Export from `packages/db/src/schema/index.ts`
- [x] 2.3 Run `bun run db:generate`, review migration SQL (CASCADE + PK + columns); apply locally with `bun run db:migrate` when verifying against a DB

## 3. Domain helpers

- [x] 3.1 Add `packages/db/src/catalog/featured-partners.ts` with `listFeaturedPartners` (optional `limit`), `searchPartnersNotFeatured`, `addFeaturedPartner`, `removeFeaturedPartner`, and `FeaturedPartnerRow`
- [x] 3.2 Reuse `CatalogValidationError` codes `PARTNER_NOT_FOUND` and `ALREADY_FEATURED` (no new codes)
- [x] 3.3 Export helpers from `packages/db/src/catalog/index.ts`

## 4. Tests

- [x] 4.1 Add `packages/db/src/catalog/featured-partners.integration.test.ts` covering list order, add append, duplicate reject, remove keeps partner, search excludes already-featured (skip/warn if no `DATABASE_URL`)

## 5. Validation and handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Run `bun test packages/db/src/catalog/featured-partners.integration.test.ts` when `DATABASE_URL` is set (exit 0)
- [x] 5.3 Confirm no `apps/web` routes/UI, Discover, seed, or product-docs changes in this step
- [x] 5.4 Mark step 01 done in `.dev-plan/current-iteration/featured-partners-parent-guide.md`
