## Why

Accessibility is a venue property, but today `events.barrier_free` is a nullable boolean set on each event (`EventAdminBaseFields` select; clone copies it). Admins can disagree across events at the same partner. This step is the schema + partner-catalog foundation for parent feature `01-partner-barrier-free` (step 01 of 02) so step 02 can cut over UI and drop the event column without a second migration design.

## What Changes

- Add `partners.barrier_free` boolean, **nullable**, no default (unset = `NULL`), matching today's event column semantics.
- Drizzle schema + generated migration (`bun run db:generate`). Existing partner rows stay `NULL` (no invented backfill in this step; step 02 uses `bool_or` from events).
- Extend `CreatePartnerInput` / `UpdatePartnerInput`; persist on create/update; return `barrierFree` on partner selects/list items used by admin and public event-detail partner fetch.
- Unit/integration tests: create/update accept `true` and `null`/omit; omit on create stores `null`; update can set and clear (`null`).
- Out of scope: partner admin form control; event form removal; dropping `events.barrier_free`; event detail cutover; seed fixture move; e2e; canonical product docs (brief schema note allowed). Do **not** dual-write event rows from partner writes yet. Event create/update/clone behavior is unchanged.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `partner-catalog`: Persist optional barrier-free accessibility on `partners.barrier_free` as a nullable boolean (`true` or `NULL`). Create MAY omit the field and MUST store `NULL`. Update SHALL accept `true` or `NULL` (clear). Reads used by admin and public event-detail partner fetches SHALL return `barrierFree`.

## Impact

- **DB:** `packages/db/src/schema/partners.ts`, new Drizzle migration under `packages/db/drizzle/`. Optional one-line note on `partners.barrier_free` in `docs/product/database/schema-overview.md`; full cutover docs wait for step 02.
- **Domain:** `packages/db/src/catalog/partners.ts` (`CreatePartnerInput` / `UpdatePartnerInput` / create/update/get/list). `listPartners` already spreads `getTableColumns(partners)`; `getPartnerById` and `listFeaturedPartners` select the full partner row — new column returns automatically once persisted.
- **Dependents:** Admin partner routes and event-detail partner fetch continue to omit the field until step 02 (NULL default keeps existing behavior). `events.barrier_free` stays the live source this step.
- **Source brief:** `.dev-plan/current-iteration/01-partner-barrier-free-01-schema-and-domain.md`
- **Parent:** `.dev-plan/current-iteration/01-partner-barrier-free-parent-guide.md`
- **Verification:** `bun run db:generate`; `cd packages/db && bun test`; `bun run typecheck`; `bun run lint`
