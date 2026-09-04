## 1. Setup and prerequisites

- [x] 1.1 Read `.dev-plan/current-iteration/08-admin-users-filters-03-hardening.md`, the parent guide `05-admin-users-filters-parent-guide.md`, this change's proposal/specs/design, and confirm step-02 UI (merged Member cell, Created column, sortable headers, full filter bar) exists on `/:locale/admin/users` — verify by naming the three hardening tracks (stories, e2e, docs) and the no-domain/UI-change boundary in the apply session.
- [x] 1.2 Inventory stale coverage via `rg` over `AdminUsersListPage.stories.tsx`, `apps/web/app/components/stories/fixtures.ts`, `e2e/specs/admin-users.spec.ts`, `docs/product/features/admin-users.feature`, `docs/product/extras/pagination-and-search.md`, `docs/product/testing/coverage-matrix.md`, `e2e/README.md` and record every `q`-only / two-column / unsorted-table pin — verify the hit list is captured before editing.

## 2. Ladle stories and fixtures

- [x] 2.1 Extend `mockAdminListQuery` to the shipped `AdminUsersListQuery` shape (subscription incl. `NONE`, credits/bookings/eventOpens min/max, createdFrom/createdTo, sort/dir) and add member variants (second member, empty-Created member) in `apps/web/app/components/stories/fixtures.ts` additively without changing existing export identities — verify with `bun run typecheck` passing.
- [x] 2.2 Extend `apps/web/app/components/admin/AdminUsersListPage.stories.tsx` with merged-cell, Created set/empty, sorted-header, filtered, and filtered-empty states in DE+EN reusing shipped copy keys and `admin-table` theme classes — verify `bun run stories` builds with exit 0 and new stories render without errors.

## 3. Playwright

- [x] 3.1 Add merged Member cell + Created column presence scenarios to `e2e/specs/admin-users.spec.ts` with verbatim Gherkin titles and table/row-scoped `getByRole`/`getByText` proximity selectors — verify the new tests pass locally or skip only for documented `DATABASE_URL` / `E2E_ADMIN_*` prerequisites.
- [x] 3.2 Add header-sort round-trip scenario (toggle dir, new-column defaults, filters preserved in URL) with proximity selectors — verify sort URLs toggle while active filters stay in the query string.
- [x] 3.3 Add per-column filter round trips (subscription enum dropdown, credits/bookings/event-opens numeric ranges, created from/to date range) plus filter+sort+pagination composition and reset-filters scenarios with `getByLabel` form selectors — verify filter URLs persist across pagination and Reset returns to the default list with no bare `input[name=…]` locators for labeled fields.

## 4. Canonical docs sync

- [x] 4.1 Sync `docs/product/features/admin-users.feature` (merged Member column, Created date, sortable headers, full filter bar + reset; titles verbatim-match Playwright `test()` strings) — verify `rg "Scenario:"` titles match 1:1 between the feature file and `admin-users.spec.ts`.
- [x] 4.2 Sync `docs/product/extras/pagination-and-search.md` (new `/admin/users` params, page size 25 unchanged, server-side ILIKE/range/date semantics, invalid-input-ignored rule) — verify the users rows no longer describe `q`+`role`-only search.
- [x] 4.3 Sync `docs/product/testing/coverage-matrix.md` and `e2e/README.md` (new filter/sort rows pointing at Playwright titles with `pass` or named env `skip`; remove/retire old two-column rows; no silent skips) — verify every touched Scenario maps to a Playwright title or an explicit `DATABASE_URL` / `E2E_ADMIN_*` deferral.

## 5. Validation and handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` and fix all findings — verify both commands exit 0.
- [x] 5.2 Run `bun run test:e2e -- e2e/specs/admin-users.spec.ts` — verify in-scope scenarios pass or skip only with named `DATABASE_URL` / `E2E_ADMIN_*` rationale.
- [x] 5.3 Update `.dev-plan/current-iteration/05-admin-users-filters-parent-guide.md` to mark `admin-users-filters-03-hardening` done and prepare a PR/handoff linking the change ID and parent guide — verify the PR description lists scope, verification results, and out-of-scope items.
