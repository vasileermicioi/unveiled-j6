## Why

The admin partners list at `/:locale/admin/partners` only returns flat `Partner` rows ordered by `created_at desc, id desc`, so the UI cannot sort by name / last-created / event volume or show an **Active events** column. This domain step unlocks those list features (UI in step 02) without schema migrations.

## What Changes

- Extend `listPartners` / `ListPartnersOptions` in `@unveiled/db` with `PartnerSort` (`name` | `created` | `events`), optional `desc`, and optional `now` for a testable active reference.
- Return per-partner `eventCount` and `activeEventCount` via aggregate over `events` (no new columns).
- Add a shared active-event predicate helper (`date_time >= now` and `remaining_capacity > 0`, Europe/Berlin `now` default) for reuse by later sales-export / dashboard-adjacent steps.
- Keep default order `created_at desc, id desc` when sort is omitted; keep name-only search and page-size 25 / offset pagination; `countPartners` stays aligned with the name filter.
- Add unit/integration coverage for sort modes, directions, active counts, and filter-count agreement.
- Out of scope: UI (step 02), sales-export (step 03), events list page, featured-partners queries, partner portal.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `partner-catalog`: Admin partner list domain SHALL support server-side sort (`name` / `created` / `events`, each asc/desc) and SHALL return per-partner total and active event counts from aggregates over `events`, without new schema columns. Pagination counts SHALL honor the same name filter.

## Impact

- **Domain (`@unveiled/db`):** `packages/db/src/catalog/partners.ts` (`listPartners`, `countPartners`, `ListPartnersOptions`, new `PartnerSort` + list row type); shared active-event predicate helper; catalog integration tests.
- **No UI / route changes** in this step — callers still get a stable default when sort is omitted; return type gains count fields (callers that expect bare `Partner[]` must accept the widened row type or map).
- **No migrations** — counts are query-time only.
- **Source brief:** `.dev-plan/current-iteration/partner-list-and-sales-export-01-list-domain.md`
- **Parent:** `.dev-plan/current-iteration/partner-list-and-sales-export-parent-guide.md`
- **Depends on:** none (first child step); active-event definition locked as parent guide proposal (`date_time >= now` ∧ `remaining_capacity > 0`).
- **Consumed by:** `partner-list-and-sales-export-02-list-ui`
- **Verification:** `bun run typecheck`; `bun run lint`; `cd packages/db && bun test` (partner list coverage); `db:generate` no-op / no migrations
