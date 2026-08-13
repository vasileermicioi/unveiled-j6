## ADDED Requirements

### Requirement: Booking feature documents slot selection
`docs/product/features/booking.feature` SHALL describe datetime selection on event detail / book, charging the selected occurrence’s credits, event-level capacity, and confirm/ICS/email using `bookings.date_time`. The old “no datetime slot selection” / “without a slot selection step” / “next upcoming datetime for calendar/ICS” wording SHALL be removed. Playwright in `e2e/specs/booking.spec.ts` SHALL include a test titled exactly `Scenario: Book a priced datetime slot`. `docs/product/database/schema-overview.md` SHALL list `bookings.date_time` (`timestamptz NOT NULL`, booked occurrence) and SHALL NOT list denormalized `events.date_time` as the ICS/email calendar source. `docs/product/extras/gaps-and-decisions.md` SHALL NOT say MVP booking remains event-scoped. Capacity and voucher inventory SHALL remain documented as event-level.

#### Scenario: Coverage traces slot booking
- **WHEN** the coverage matrix is updated for this feature
- **THEN** it includes a row for booking a priced datetime slot (pass or explicit environment skip)
- **AND** that row does not use `@skip-no-ui`

#### Scenario: Book a priced datetime slot
- **GIVEN** I am signed in with an "ACTIVE" subscription
- **AND** the event has multiple future datetimes with different credit prices
- **AND** the event has enough remaining capacity and I have enough credits
- **WHEN** I select a non-primary future datetime and confirm the booking
- **THEN** a confirmed booking is stored with that `date_time`
- **AND** credits deducted equal that occurrence’s price times ticket count
- **AND** remaining capacity decreases by the ticket count (event-level)
- **AND** confirmation surfaces use the booked datetime for calendar/ICS display

#### Scenario: Successful booking Gherkin is slot-aware
- **WHEN** a reader opens the Successful booking scenario in `booking.feature`
- **THEN** it does not say the booking is event-scoped or that there is no datetime slot selection
- **AND** credits charged are the selected occurrence price × ticket count

#### Scenario: Post-booking calendar uses booked datetime
- **WHEN** a reader opens the Post-booking actions scenario in `booking.feature`
- **THEN** ICS / confirm / email time fields are specified as the booked datetime
- **AND** they are not specified as the event’s next upcoming datetime

## MODIFIED Requirements

### Requirement: Product Gherkin ticket bounds

`docs/product/features/booking.feature` SHALL document guest preview max 3 and member max = `min(floor(credits ÷ selected occurrence creditPrice), remainingCapacity)` (and voucher inventory when applicable), and SHALL NOT require a universal hard max of 3 for successful bookings when credits and capacity allow a higher count. Capacity and credit rejection scenarios remain authoritative. Playwright covering ticket quantity on detail/book SHALL align with these bounds (guest + disabled at 3; eligible member can select more than 3 when seeded credits and capacity allow). Changing the selected future datetime SHALL be specified as recomputing that maximum.

#### Scenario: Feature file matches server and UI

- **WHEN** an implementer reads `booking.feature` after this feature ships
- **THEN** background/scenarios describe credit- and capacity-aware limits for members using the selected occurrence price
- **AND** they do not state that every successful booking must use a ticket count between 1 and 3 inclusive as a hard universal cap

#### Scenario: Guest preview still capped at three in BDD

- **WHEN** a guest views a bookable event detail checkout affordance under Playwright
- **THEN** the ticket quantity control does not exceed 3 (e.g. increment disabled at 3)

#### Scenario: Eligible member can select above three in BDD

- **WHEN** a seeded ACTIVE member with sufficient credits views a bookable event with remaining capacity allowing more than 3 tickets
- **THEN** Playwright can select a ticket count greater than 3 on detail or book surfaces
