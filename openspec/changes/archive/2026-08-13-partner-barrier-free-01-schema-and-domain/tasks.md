## 1. Setup

- [x] 1.1 Read step plan + parent guide; confirm artifacts (`packages/db/src/schema/partners.ts`, `packages/db/src/catalog/partners.ts` create/update/get/list, `packages/db/src/schema/events.ts` `barrierFree`, opening-hours as the optional-flag pattern)
- [x] 1.2 Lock write semantics for implementer notes: omit-on-create → `NULL`; update `true` sets; update `null` clears; omitted on update leaves existing; `false` coerces to `NULL`; do not dual-write `events.barrier_free`

## 2. Schema & migration

- [x] 2.1 Add `barrierFree: boolean("barrier_free")` (nullable, no default) to Drizzle `partners`
- [x] 2.2 Run `bun run db:generate`; review migration SQL (`ADD COLUMN "barrier_free" boolean` — no DEFAULT, no NOT NULL, no invented backfill); keep the migration

## 3. Catalog domain writes

- [x] 3.1 Extend `CreatePartnerInput` / `UpdatePartnerInput` with `barrierFree?: boolean | null`
- [x] 3.2 Persist on create (`undefined` / `null` / `false` → `NULL`; `true` → `true`) and update (omit leaves existing; `true` sets; `null` or `false` clears)
- [x] 3.3 Confirm `getPartnerById`, `listPartners` (`getTableColumns(partners)`), `listFeaturedPartners`, and create/update `.returning()` expose `barrierFree` without a new query API

## 4. Tests

- [x] 4.1 Add `packages/db/src/catalog/barrier-free.integration.test.ts` (skip when `DATABASE_URL` is unset): omit-on-create → `null`; create `true`; update set; update clear; get + list return the field
- [x] 4.2 Confirm existing event create/update tests still pass (event column untouched; no partner→event dual-write)

## 5. Verification & handoff

- [x] 5.1 Run `bun run db:generate` — exits 0; new migration includes `partners.barrier_free`
- [x] 5.2 Run `cd packages/db && bun test` — exits 0 (integration skips without `DATABASE_URL`)
- [x] 5.3 Run `bun run typecheck` and `bun run lint` — exit 0
- [x] 5.4 Optional one-line `partners.barrier_free` note in `docs/product/database/schema-overview.md`; mark step 01 done in `01-partner-barrier-free-parent-guide.md`; do not edit Gherkin, partner form, event form, seed event flags, or `events.barrier_free`
