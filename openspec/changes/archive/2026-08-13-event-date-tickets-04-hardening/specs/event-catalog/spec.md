## ADDED Requirements

### Requirement: Date & tickets BDD and docs

`docs/product/features/admin-events.feature` SHALL include scenarios titled `Timing mode is first on Date & tickets`, `All day hides time inputs`, `Time slot shows times`, `Shared capacity is one pool`, `Per-date capacities persist`, `Range rebuild stamps default capacity`, and `Capacity and inventory totals mismatch`. Playwright in `e2e/specs/admin-events.spec.ts` SHALL use those titles verbatim. `Total credits shown on the form` and `Update an event's capacity` SHALL remain. Coverage-matrix rows SHALL exist for the new titles (pass or explicit R2/env skip). Canonical docs SHALL describe Date & tickets field order, All day hiding times, Shared vs Per date, per-row capacity, totals, `capacity_mode` / `occurrence_capacities`, and event-scoped booking remaining: `docs/product/ui/ui-component-map.md` (Events row), `docs/product/database/schema-overview.md`, `docs/product/extras/gaps-and-decisions.md`.

#### Scenario: Timing mode is first on Date & tickets

- **WHEN** I open the new-event form and go to step 2
- **THEN** I see Timing mode before Capacity allocation, ticket type, and the datetime list

#### Scenario: All day hides time inputs

- **WHEN** I set Timing mode to All day
- **THEN** hour and minute inputs are hidden on the range builder and datetime rows
- **AND** date fields remain

#### Scenario: Time slot shows times

- **WHEN** I set Timing mode to Time slot
- **THEN** datetime rows and range slots show time inputs

#### Scenario: Shared capacity is one pool

- **WHEN** I create an event with Capacity allocation Shared across all dates and capacity 10 and two datetimes
- **THEN** the event’s total capacity is 10
- **AND** datetime rows do not show a capacity input

#### Scenario: Per-date capacities persist

- **WHEN** I create an event with Capacity allocation Per date, default capacity 5, and two datetime rows set to 4 and 6
- **THEN** the stored occurrence_capacities are 4 and 6 in datetime order
- **AND** total capacity equals 10

#### Scenario: Range rebuild stamps default capacity

- **WHEN** Capacity allocation is Per date with capacity 8
- **AND** I generate a date range
- **THEN** each generated datetime row’s capacity is 8

#### Scenario: Capacity and inventory totals mismatch

- **WHEN** I am creating a VOUCHER_PROMO event with datetime capacity total 10 and 7 codes previewed
- **THEN** the capacity and inventory totals are shown in danger styling
- **AND** submitting is rejected until they match

#### Scenario: Coverage lists Date & tickets scenarios

- **WHEN** I read the admin-events coverage matrix
- **THEN** it includes the Date & tickets scenario titles (pass or explicit environment skip)

### Requirement: Voucher inventory no longer hides capacity

Voucher create/edit SHALL still require promo or PDF inventory and SHALL still persist inventory only after SSR POST. The Date & tickets step SHALL show the capacity allocation controls. Total capacity SHALL equal inventory count on a successful save (enforced by mismatch reject), not by hiding the capacity field.

#### Scenario: Admin uploads promo codes with preview

- **WHEN** I select a text or CSV file (or paste codes)
- **THEN** the UI previews one non-empty code per line
- **AND** available codes/tickets total equals that count
- **AND** submitting succeeds only when datetime capacity total equals that count

#### Scenario: Admin uploads a master PDF and previews tickets

- **WHEN** I choose split-one-file import and the UI shows a ticket count from the split
- **THEN** submitting succeeds only when datetime capacity total equals that ticket count
- **AND** there is a visible capacity allocation control

#### Scenario: Admin uploads multiple PDF files as tickets

- **WHEN** I choose multiple-files import and the UI shows a ticket count equal to the number of files
- **THEN** submitting succeeds only when datetime capacity total equals that file count
- **AND** there is a visible capacity allocation control

### Requirement: Default values include capacity allocation

Given an admin creates an event without specifying capacity, ticket type, timing mode, or capacity allocation, the system SHALL default to `totalCapacity` 10, `ticketType` `SECRET_CODE`, `timingMode` `TIME_SLOT`, and `capacityMode` `SHARED`.

#### Scenario: Default values on creation

- **WHEN** I create an event without specifying capacity, ticket type, timing mode, or capacity allocation
- **THEN** it defaults to totalCapacity 10, ticketType "SECRET_CODE", timingMode "TIME_SLOT", capacityMode "SHARED"
