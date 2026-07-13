## ADDED Requirements

### Requirement: Phase 7 profile Playwright and Ladle coverage
The system SHALL ship Playwright coverage at `e2e/specs/profile.spec.ts` for in-scope `profile.feature` scenarios (identity, password-change entry, preferences, wallet, refill, billing view/update/cancel entry points) using verbatim Scenario titles and proximity selectors. Ladle SHALL include stories for profile billing and preferences compositions (and related profile pages as needed). GDPR export/delete page mechanics remain Phase 8; entry-link visibility MAY be asserted when links are present. Customer Portal deep hosted flows MAY assert SSR redirect / opt-in policy documented in `e2e/README.md` rather than requiring full Stripe Portal automation in default CI.

#### Scenario: Profile spec covers in-scope scenarios
- **WHEN** `bun run test:e2e` runs `e2e/specs/profile.spec.ts` against the configured test environment
- **THEN** in-scope Phase 7 profile scenarios pass, or are skipped only for documented CI/env prerequisites or named Phase 8 deferrals

#### Scenario: Profile billing and preferences stories load
- **WHEN** web Ladle stories are opened after this change
- **THEN** billing and preferences (and cancel confirm) states render without runtime errors

#### Scenario: Coverage matrix profile rows leave unshipped
- **WHEN** Phase 7 closes
- **THEN** `profile.feature` rows are `pass`, `skip`, or `deferred` — not `unshipped`
