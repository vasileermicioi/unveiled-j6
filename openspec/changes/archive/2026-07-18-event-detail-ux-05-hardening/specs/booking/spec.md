## ADDED Requirements

### Requirement: Product Gherkin ticket bounds

`docs/product/features/booking.feature` SHALL document guest preview max 3 and member max = `min(floor(credits ÷ creditPrice), remainingCapacity)`, and SHALL NOT require a universal hard max of 3 for successful bookings when credits and capacity allow a higher count. Capacity and credit rejection scenarios remain authoritative. Playwright covering ticket quantity on detail/book SHALL align with these bounds (guest + disabled at 3; eligible member can select more than 3 when seeded credits and capacity allow).

#### Scenario: Feature file matches server and UI

- **WHEN** an implementer reads `booking.feature` after this feature ships
- **THEN** background/scenarios describe credit- and capacity-aware limits for members
- **AND** they do not state that every successful booking must use a ticket count between 1 and 3 inclusive as a hard universal cap

#### Scenario: Guest preview still capped at three in BDD

- **WHEN** a guest views a bookable event detail checkout affordance under Playwright
- **THEN** the ticket quantity control does not exceed 3 (e.g. increment disabled at 3)

#### Scenario: Eligible member can select above three in BDD

- **WHEN** a seeded ACTIVE member with sufficient credits views a bookable event with remaining capacity allowing more than 3 tickets
- **THEN** Playwright can select a ticket count greater than 3 on detail or book surfaces
