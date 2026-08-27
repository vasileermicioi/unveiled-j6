## ADDED Requirements

### Requirement: Canonical waitlist Gherkin is qty one
`docs/product/features/waitlist.feature` SHALL describe join with `requested_qty = 1` and SHALL NOT require a “requested ticket count” picker. Background SHALL treat sold-out as remaining capacity 0 (not “less than my requested ticket count”). Promotion SHALL attempt to book one ticket through the same atomic booking transaction. Existing Playwright `Scenario:` titles in `e2e/specs/waitlist.spec.ts` SHALL stay unless a Gherkin `Scenario:` line changes. Coverage-matrix waitlist rows keep their titles.

#### Scenario: Join the waitlist
- **WHEN** I choose to join the waitlist
- **THEN** a waitlist entry is created with `requested_qty = 1` and status `WAITING`
- **AND** the join form has no ticket-quantity control

#### Scenario: Promotion books one ticket
- **WHEN** capacity frees and the earliest eligible `WAITING` entry is promoted
- **THEN** the system books one ticket on my behalf through the same transaction as a normal booking
