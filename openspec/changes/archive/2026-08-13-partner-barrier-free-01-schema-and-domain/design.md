## Context

Parent feature: move barrier-free from event to venue (`.dev-plan/current-iteration/01-partner-barrier-free-parent-guide.md`), step 01 — schema + partner catalog domain only.

Current state:

- `events.barrier_free` is a nullable boolean with no default (`packages/db/src/schema/events.ts`). Admin create/edit uses a native Yes/No select (`EventAdminBaseFields`); POST maps `"on"` → `true`, anything else → `null` (`admin-event-form.ts`). Clone copies `source.barrierFree`. Public DETAILS still reads `event.barrierFree`.
- `partners` has identity, structured address, logo, and opening hours (`has_opening_hours` / `opening_hours`) — no accessibility column.
- `CreatePartnerInput` / `UpdatePartnerInput` / `getPartnerById` / `listPartners` live in `packages/db/src/catalog/partners.ts`. `listPartners` selects `...getTableColumns(partners)`; `getPartnerById` and `listFeaturedPartners` return the full partner row.
- Public event detail already loads the hosting partner via `getPartnerById` for logo/hours (`apps/web/app/routes/[locale]/events/[id].tsx`) — unused for accessibility until step 02.

Product locks for this feature: barrier-free is a venue fact; stored tri-state is **`true | NULL`** (admin Yes → `true`, No → `null`); do not introduce a distinct stored `false`; member profile `accessibility` is unrelated. Backfill from mixed event values is **step 02** (`bool_or`).

Constraints: business logic in `@unveiled/db`; `public` schema only; catalog validation errors stay in `@unveiled/db`; no route/UI in this step; mirror opening-hours (domain first, admin form next).

## Goals / Non-Goals

**Goals:**

- Persist `partners.barrier_free` as a nullable boolean with no default (unset = `NULL`).
- Create/update accept and persist `true` or `NULL`; omit on create stores `NULL`; explicit `null` on update clears.
- Reads return `barrierFree` on get/list/featured partner paths used by admin and event-detail partner fetch.
- Tests cover omit/create-true/update-set/update-clear. Existing event create/update tests still pass (event column untouched).

**Non-Goals:**

- Partner admin form control (step 02).
- Removing the event form field, clone copy, seed event flag, or `events.barrier_free` column (step 02).
- Dual-writing event rows from partner writes.
- Public DETAILS cutover, Gherkin/e2e, Discover filters, member profile `accessibility`.
- Explicit stored `false` as “not barrier-free.”

## Decisions

1. **Nullable boolean, no default (match `events.barrier_free`)**
   - **Choice:** `barrierFree: boolean("barrier_free")` on Drizzle `partners` — nullable, no `.notNull()`, no `.default(...)`. Existing rows stay `NULL` after `ADD COLUMN`.
   - **Rationale:** Step plan requires matching today’s event column semantics so step 02 can backfill then drop the event column without a second type/default redesign.
   - **Alternatives:** `NOT NULL DEFAULT false` (collapses unset with “no”; contradicts parent `true | NULL` lock); copy opening-hours’ companion boolean (overkill for a single flag).

2. **Write semantics: `true` or `NULL` only; coerce `false` to `NULL`**
   - **Choice:** Shared helper used by create and update:
     | Input | Create | Update |
     |---|---|---|
     | omitted (`undefined`) | store `NULL` | leave existing |
     | `true` | store `true` | store `true` |
     | `null` | store `NULL` | store `NULL` (clear) |
     | `false` | store `NULL` | store `NULL` |
   - **Rationale:** Parent non-goal forbids a distinct stored `false`. Event UI already never posts `false` (`"on"` → `true`, else `null`). Coercing `false` keeps domain writes aligned with that contract even if a caller passes a boolean.
   - **Alternatives:** `input.barrierFree ?? null` (would persist `false`, matching raw event catalog inserts); reject `false` with `CatalogValidationError` (unnecessary — No means unset).

3. **No new catalog error code**
   - **Choice:** Do not add a `CatalogValidationError` for this field. It is optional; invalid-ish values coerce rather than reject.
   - **Rationale:** Opening hours needed validation because JSON shape can be wrong. A nullable boolean does not.
   - **Alternatives:** Reject non-boolean with `REQUIRED_FIELD` (no current caller can send that through typed inputs).

4. **Reads piggyback on existing selects — no new query API**
   - **Choice:** Do not add `getPartnerBarrierFree` or extra columns in list projections. `getPartnerById`, `listPartners` (`getTableColumns(partners)`), and `listFeaturedPartners` (`select { partner: partners }`) pick up the new column automatically. `createPartner` / `updatePartner` `.returning()` includes it.
   - **Rationale:** Step 02 event-detail already has the partner row in hand; this step only needs the field present on that type.
   - **Alternatives:** Explicit column lists (would miss the field and force a second wiring pass).

5. **Do not dual-write `events.barrier_free`**
   - **Choice:** Partner create/update MUST NOT `UPDATE events SET barrier_free = ...`. Event catalog create/update/clone keep writing `events.barrier_free` as today.
   - **Rationale:** Step plan lock; keeps this increment mergeable. Step 02 backfills partners from events (`bool_or`) then drops the event column.
   - **Alternatives:** Dual-write now (risks fighting mixed event values and complicates rollback).

6. **Tests live beside opening-hours, not inside event catalog tests**
   - **Choice:** Add `packages/db/src/catalog/barrier-free.integration.test.ts` mirroring `opening-hours.integration.test.ts` (skip when `DATABASE_URL` is unset). Cover: omit-on-create → `null`; create `true`; update `true`; update `null` clears; get + list return the field. Do not add event-catalog assertions here.
   - **Rationale:** Isolated partner-domain file; `cd packages/db && bun test` still runs it.
   - **Alternatives:** Fold into `catalog.integration.test.ts` (already large); pure unit test of the coerce helper only (would not prove persistence).

7. **Optional schema-overview note; no Gherkin this step**
   - **Choice:** One-line `partners.barrier_free` row in `docs/product/database/schema-overview.md` is allowed. Do not edit `admin-partners.feature` / `admin-events.feature` / `event-discovery.feature` (step 02).
   - **Rationale:** Step plan cleanup; canonical cutover docs wait until the event column is gone.

## Risks / Trade-offs

- **[Risk] Step 02 backfill sees mixed event values while partners stay NULL** → Accepted. This step does not invent a partner value. Step 02 uses `bool_or` (any event `true` wins; otherwise `null`); admins can correct after deploy.
- **[Risk] Callers that pass `false` silently become `NULL`** → Mitigation: document in helper JSDoc; test coerce; matches product Yes/No select.
- **[Risk] TypeScript `Partner` grows `barrierFree` and unused UI still compiles** → Desired; event detail ignores it until step 02.
- **[Trade-off] Two sources of truth until step 02** → Required for mergeability. Public DETAILS still reads the event column; partner writes do not sync events.
- **[Trade-off] Optional schema-overview draft** → Step 02 owns the full doc sweep; a one-line partners-section note keeps schema SoT honest if this PR lands alone.

## Migration Plan

1. Add `barrierFree: boolean("barrier_free")` to Drizzle `partners`; `bun run db:generate`; review SQL (`ADD COLUMN "barrier_free" boolean` — no DEFAULT, no NOT NULL, no backfill).
2. Thread `barrierFree?: boolean | null` through `CreatePartnerInput` / `UpdatePartnerInput`; persist with the write table above; rely on existing selects for reads.
3. Add `barrier-free.integration.test.ts`; run `cd packages/db && bun test` (integration skips without `DATABASE_URL`).
4. Optionally add the schema-overview one-liner; do not touch event schema, forms, seed event flags, or Gherkin.
5. Run `bun run typecheck` and `bun run lint`.
6. Rollback: drop `partners.barrier_free` (additive until step 02 depends on it). Do not drop `events.barrier_free`.

## Open Questions

- None blocking. Whether to patch `docs/product/database/schema-overview.md` in this PR or wait for step 02 is optional per the step plan — prefer a short partners-section note if the migration lands alone.
