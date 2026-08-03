## 1. Setup

- [x] 1.1 Confirm active-event definition locked in design (`date_time >= now` ∧ `remaining_capacity > 0`) and skim parent guide non-goals
- [x] 1.2 Skim `packages/db/src/catalog/partners.ts`, `events` schema, and existing `catalog.integration.test.ts` partner list cases

## 2. Domain API

- [x] 2.1 Add `PartnerSort` (`"name" | "created" | "events"`), `PartnerListItem` (Partner + `eventCount` / `activeEventCount`), and extend `ListPartnersOptions` with `sort?`, `desc?`, `now?`
- [x] 2.2 Add shared `activeEventCondition(now)` (or equivalent) helper export for reuse by later steps
- [x] 2.3 Rewrite `listPartners` to left-join/group aggregate total + active event counts; apply sort/direction with stable id tiebreak; keep default `created_at desc, id desc` when `sort` omitted; coalesce counts to 0
- [x] 2.4 Confirm `countPartners` still counts name-filtered partner rows only (no sort effect); export any new types from package index if required
- [x] 2.5 Fix TypeScript call sites that break on widened `listPartners` return type (seed, admin route mappers, tests) without changing UI behavior

## 3. Tests

- [x] 3.1 Add integration coverage: sort by name / created / events × asc/desc with expected order
- [x] 3.2 Add coverage: `eventCount` / `activeEventCount` with pinned `now` (past, upcoming sold-out, upcoming with capacity)
- [x] 3.3 Add coverage: name filter + `countPartners` agreement; default omit-sort order unchanged; partners with zero events return 0/0

## 4. Docs & cleanup

- [x] 4.1 Mark step `partner-list-and-sales-export-01-list-domain` done in `.dev-plan/current-iteration/partner-list-and-sales-export-parent-guide.md`
- [x] 4.2 Do **not** archive/sync main `openspec/specs/partner-catalog/spec.md` until apply/archive — delta lives in this change

## 5. Verification

- [x] 5.1 Run `bun run typecheck` — exits 0
- [x] 5.2 Run `bun run lint` — exits 0
- [x] 5.3 Run partner list / catalog tests under `packages/db` — pass
- [x] 5.4 Confirm `bun run db:generate` is no-op / no new migration expected
  <!-- Also restored missing `drizzle/meta/0015_snapshot.json` so generate stays a no-op (0015 SQL existed without snapshot). -->
