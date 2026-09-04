## MODIFIED Requirements

### Requirement: Membership HQ Ladle and Playwright coverage
The system SHALL provide Ladle stories for Membership HQ list/detail (existing or extended) and for adjust-credits, freeze, refund, and comp-ticket mutation confirm forms under `apps/web/app/components/admin/`. The Membership HQ list stories SHALL cover the shipped filter-table layout: one merged Member column (display name linked to member detail on line one, email on line two), Created registration-date column (Europe/Berlin calendar day, including empty), sortable header states, filtered and filtered-empty states, in DE and EN. Playwright SHALL cover `admin-users.feature` scenarios in `e2e/specs/admin-users.spec.ts` with verbatim titles and proximity selectors, exercising SSR list/detail and mutation pages (detail panel Gherkin maps to `/admin/users/:id` + linked form pages) plus merged-cell display, Created column, sortable headers, every column filter (subscription enum, credits/bookings/event-opens numeric ranges, created date range) composing with sort, pagination, and reset. Soft-deleted members remain out of list/detail success paths.

#### Scenario: Mutation confirm stories load
- **WHEN** Ladle is started after this change
- **THEN** adjust-credits, freeze (freeze/unfreeze/unavailable), refund, and comp-ticket story states render without runtime errors

#### Scenario: Admin-users scenarios are executable
- **WHEN** `bun run test:e2e -- e2e/specs/admin-users.spec.ts` runs with admin credentials and `DATABASE_URL` available
- **THEN** list, search, summary, detail, adjust, freeze/unfreeze, and comp-ticket scenarios pass, or skip only with documented env prerequisites

#### Scenario: Filter-table stories cover merged cells and Created dates
- **WHEN** Ladle builds the Membership HQ list stories
- **THEN** merged Member cells (name link + muted email line), Created dates (set and empty), sorted-header states, filtered states, and a filtered-empty state render in DE and EN without runtime errors

#### Scenario: Filter coverage stays green
- **WHEN** `e2e/specs/admin-users.spec.ts` runs with admin credentials and `DATABASE_URL`
- **THEN** the filter/sort scenarios (merged member display, Created column, sortable headers, every column filter composing with pagination and reset) pass and the matrix shows no silent skips
