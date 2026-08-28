## ADDED Requirements

### Requirement: Canonical credits Gherkin records cancel-all REFUND
`docs/product/features/credits-subscription.feature` SHALL state that `REFUND` ledger rows are produced by (1) the existing admin manual goodwill refund and (2) event-level cancel-all, where the refunded amount equals each cancelled booking's `total_credits` when that amount is greater than 0. Single-booking admin cancel SHALL still NOT write a `REFUND`. Playwright `e2e/specs/credits-subscription.spec.ts` SHALL include a test titled verbatim `Scenario: Event cancel-all writes REFUND ledger rows`. That test MAY skip with a documented pointer to domain integration tests and/or the booking cancel-all e2e; it MUST NOT use `@skip-no-ui`.

#### Scenario: Event cancel-all writes REFUND ledger rows
- **WHEN** an admin cancels all confirmed bookings for an event
- **THEN** each member who was charged credits receives that amount back
- **AND** a REFUND ledger entry is recorded per refunded booking with a unique idempotency key
- **AND** Playwright uses that Gherkin title verbatim
