## Why

Step 02 merged the Membership HQ table rebuild (merged Member cell, Created column, sortable headers, full SSR GET filter bar backed by step-01 domain), but release coverage still pins the old two-column unsorted table: Ladle stories only render `Default`/`Empty`, Playwright only covers List/Search, and `admin-users.feature` / pagination docs / coverage matrix still describe `q`+`role` only. Until stories, e2e, and canonical docs match the shipped table, regressions in filters/sort go unnoticed and the `admin-users-filters` parent feature cannot close.

## What Changes

- Extend Ladle coverage for `AdminUsersListPage` / `AdminUsersTable`: merged name+email cell, Created values (set + empty), sorted-header states, filtered-empty state, in DE+EN; extend `mockMemberListItem` / `mockAdminListQuery` fixtures only as needed (no domain changes).
- Update Playwright `e2e/specs/admin-users.spec.ts` with verbatim Gherkin titles and proximity/layout selectors only: merged Member cell, Created column presence, header-sort round trip, per-column filter round trips (subscription enum dropdown, credits/bookings/event-opens numeric ranges, created date range), filter+sort+pagination composition, reset-filters link.
- Sync canonical docs: `docs/product/features/admin-users.feature` scenarios for merged cell / Created / sortable headers / full filter bar, `docs/product/extras/pagination-and-search.md` rows (new params, page size 25 unchanged, server-side ILIKE/range semantics), `docs/product/testing/coverage-matrix.md` + `e2e/README.md` inventory (no silent skips; named `DATABASE_URL` / `E2E_ADMIN_*` env-skips only).
- Out of scope: further domain/UI changes (steps 01/02 own semantics/layout); other admin tabs; detail-page or mutation changes.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-users`: Users-tab release coverage — Ladle stories for merged cells, Created dates, sorted and filtered states (DE/EN), and Playwright-backed list/sort/filter contract kept in sync with `admin-users.feature` and pagination extras.
- `bdd-and-e2e`: Admin-users Playwright contract extended to merged-cell / Created / sortable-header / per-column-filter / filter+sort+pagination+reset scenarios with verbatim titles and proximity/layout selectors; coverage matrix rows updated with no silent skips.

## Impact

- **App stories (`apps/web`):** `app/components/admin/AdminUsersListPage.stories.tsx`, `app/components/admin/AdminUsersTable.tsx` (stories only, no UI change), `app/components/stories/fixtures.ts` (`mockMemberListItem`, `mockAdminListQuery`), `.ladle` smoke via `bun run stories`.
- **E2E:** `e2e/specs/admin-users.spec.ts` (new filter/sort scenarios), `e2e/fixtures/admin-users.ts` helpers only if needed, `e2e/README.md` inventory.
- **Product SoT:** `docs/product/features/admin-users.feature`, `docs/product/extras/pagination-and-search.md`, `docs/product/testing/coverage-matrix.md`.
- **Planning mirror:** `openspec/specs/{admin-users,bdd-and-e2e}` via this change's deltas (not product SoT).
- **Parent close-out:** `.dev-plan/current-iteration/05-admin-users-filters-parent-guide.md` mark `admin-users-filters-03-hardening` done; closes the feature.
- **Source brief:** `.dev-plan/current-iteration/08-admin-users-filters-03-hardening.md`
- **Depends on:** `admin-users-filters-02-ui` (merged)
- **Consumed by:** closes `admin-users-filters`
- **Verification:** `bun run lint`; `bun run typecheck`; `bun run test:e2e -- e2e/specs/admin-users.spec.ts`
