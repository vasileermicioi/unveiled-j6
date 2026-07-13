## ADDED Requirements

### Requirement: Membership HQ Ladle and Playwright coverage
The system SHALL provide Ladle stories for Membership HQ list/detail (existing or extended) and for adjust-credits, freeze, refund, and comp-ticket mutation confirm forms under `apps/web/app/components/admin/`. Playwright SHALL cover `admin-users.feature` scenarios in `e2e/specs/admin-users.spec.ts` with verbatim titles and proximity selectors, exercising SSR list/detail and mutation pages (detail panel Gherkin maps to `/admin/users/:id` + linked form pages). Soft-deleted members remain out of list/detail success paths.

#### Scenario: Mutation confirm stories load
- **WHEN** Ladle is started after this change
- **THEN** adjust-credits, freeze (freeze/unfreeze/unavailable), refund, and comp-ticket story states render without runtime errors

#### Scenario: Admin-users scenarios are executable
- **WHEN** `bun run test:e2e -- e2e/specs/admin-users.spec.ts` runs with admin credentials and `DATABASE_URL` available
- **THEN** list, search, summary, detail, adjust, freeze/unfreeze, and comp-ticket scenarios pass, or skip only with documented env prerequisites
