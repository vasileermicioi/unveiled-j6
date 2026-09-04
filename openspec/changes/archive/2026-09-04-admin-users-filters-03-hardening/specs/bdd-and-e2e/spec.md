## MODIFIED Requirements

### Requirement: Admin users Playwright coverage
The system SHALL map `docs/product/features/admin-users.feature` scenarios to `e2e/specs/admin-users.spec.ts` using verbatim Gherkin `Scenario:` titles as Playwright `test()` titles and proximity/layout selectors per `docs/product/testing/bdd-and-e2e.md`. The admin-users spec SHALL cover the shipped Membership HQ filter table: merged Member cell (name link + email line), Created column presence, header-sort round trip (toggle + new-column defaults, filters preserved), per-column filter round trips (subscription enum dropdown, credits/bookings/event-opens numeric ranges, created from/to date range), filter+sort+pagination composition, and reset-filters link. Admin waitlist promote, admin booking cancel, and admin credit/freeze/comp/refund scenarios SHALL pass in their feature-mapped specs (`waitlist.spec.ts`, `booking.spec.ts`, `credits-subscription.spec.ts`) or be listed as named deferrals with reason and owner limited to remaining Phase 8 / `seo-launch-polish-03` when blocked by env or harness — not by missing UI. The coverage matrix and `e2e/README.md` SHALL reflect the updated inventory with no silent skips and no lingering “Phase 8 — UI not built” reasons for shipped admin-ops surfaces.

#### Scenario: Admin users spec exists
- **WHEN** Phase 8 admin-ops hardens
- **THEN** `admin-users.spec.ts` is present and executable in CI/local e2e

#### Scenario: Coverage matrix reflects admin-ops close-out
- **WHEN** an implementer opens `docs/product/testing/coverage-matrix.md` after this change
- **THEN** `admin-users.feature` rows point at `admin-users.spec.ts` (or named env skips) instead of `unshipped`, and admin waitlist/cancel/credit rows are `pass`, env `skip`, or `deferred` → `seo-launch-polish-03` with an explicit non-UI reason

#### Scenario: Phase 7 admin UI skips are resolved
- **WHEN** admin-ops step 05 completes
- **THEN** waitlist admin visibility/promote, booking admin cancel, and credits-subscription admin adjust/freeze/comp/refund scenarios no longer skip solely because “Phase 8 — … UI” is missing

#### Scenario: Filter and sort scenarios are executable
- **WHEN** `bun run test:e2e -- e2e/specs/admin-users.spec.ts` runs with admin credentials and `DATABASE_URL` available
- **THEN** merged-cell, Created-column, header-sort, per-column-filter, filter+sort+pagination composition, and reset scenarios pass, or skip only with documented `DATABASE_URL` / `E2E_ADMIN_*` prerequisites

#### Scenario: Selectors follow the proximity contract
- **WHEN** admin-users filter/sort e2e coverage is reviewed
- **THEN** assertions use `getByRole` / `getByText` / `getByLabel` (or equivalent layout/proximity queries) scoped to table/row/header regions with no assertions coupled to admin CSS class names and no bare `input[name=…]` locators for labeled fields
