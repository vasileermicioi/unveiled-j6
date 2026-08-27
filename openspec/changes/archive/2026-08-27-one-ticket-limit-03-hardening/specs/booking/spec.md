## ADDED Requirements

### Requirement: Canonical Gherkin matches one-ticket behavior
`docs/product/features/booking.feature` SHALL describe one ticket per occurrence, `ALREADY_BOOKED` rejection, and the already-booked checkout message. It SHALL NOT require a ticket-quantity control or allow selecting more than one ticket on member checkout. Background SHALL NOT say members may select up to `min(floor(credits ÷ price), remainingCapacity)` tickets or that a successful booking is not limited by a hard max of 3. Successful booking, priced-slot, sold-out, insufficient-credits, and insufficient-voucher scenarios SHALL use ticket count **1** (credits × 1, capacity − 1). Playwright `e2e/specs/booking.spec.ts` test titles SHALL match those `Scenario:` lines verbatim. Coverage-matrix rows SHALL map the new titles (`pass` when `DATABASE_URL` is set; never `@skip-no-ui` for already-booked UI). `docs/product/database/schema-overview.md` SHALL document `tickets_count = 1` on new writes and the partial unique index on active `(user_id, event_id, date_time)`. `docs/product/extras/content-i18n-inventory.md` SHALL include the locked already-booked DE/EN copy. `docs/product/sitemap/sitemap.md` SHALL note one-ticket book + already-booked when the hour is held. `docs/product/ui/ui-component-map.md` and `docs/product/extras/gaps-and-decisions.md` SHALL NOT describe a member qty stepper. Grandfathered `tickets_count > 1` display (`Multi-ticket promo codes are listed separately`) SHALL remain.

#### Scenario: Member cannot select more than one ticket
- **WHEN** I view the event detail checkout panel or book page as a booking-eligible member
- **THEN** I cannot increase quantity above one ticket
- **AND** Playwright uses the title `Scenario: Member cannot select more than one ticket`

#### Scenario: Reopening a booked single-slot event
- **WHEN** I am a booking-eligible member with a `CONFIRMED` booking for a single-occurrence event
- **AND** I open that event’s detail or book page
- **THEN** I see the already-booked message
- **AND** I can follow My Tickets to `/:locale/bookings`
- **AND** I do not see a control to confirm another booking
- **AND** Playwright uses that Gherkin title verbatim

#### Scenario: Booked hour on a multi-hour event
- **WHEN** I have a `CONFIRMED` booking for the morning occurrence only
- **AND** I open the event with that morning datetime selected
- **THEN** I see the already-booked message and My Tickets link
- **AND** I can select the evening occurrence and book one ticket there
- **AND** Playwright uses that Gherkin title verbatim

## MODIFIED Requirements

### Requirement: Product Gherkin ticket bounds
`docs/product/features/booking.feature` SHALL document one ticket per occurrence on member checkout (no quantity stepper or select). It SHALL NOT document a guest preview max of 3, a member max of `min(floor(credits ÷ creditPrice), remainingCapacity)` as a selectable count, or Playwright that selects more than 3 tickets. Capacity and credit rejection scenarios remain authoritative for **one** ticket. Playwright covering checkout SHALL assert there is no control to increase ticket count. Changing the selected future datetime SHALL recompute the one-ticket credit total from that slot’s price.

#### Scenario: Feature file matches server and UI
- **WHEN** an implementer reads `booking.feature` after this feature ships
- **THEN** background/scenarios describe one ticket per occurrence for members using the selected occurrence price
- **AND** they do not state that members may select a ticket count greater than 3
- **AND** they do not state that every successful booking uses a 1–3 hard universal cap as the product rule — the product rule is qty 1

#### Scenario: Guest preview has no quantity control
- **WHEN** a guest views a bookable event detail checkout affordance under Playwright
- **THEN** there is no ticket-quantity control (no guest preview cap of 3)

#### Scenario: Eligible member cannot select above one in BDD
- **WHEN** a seeded ACTIVE member with sufficient credits views a bookable event
- **THEN** Playwright cannot increase ticket count above 1 on detail or book surfaces

### Requirement: Booking feature documents slot selection
`docs/product/features/booking.feature` SHALL describe datetime selection on event detail / book, charging the selected occurrence’s credits × **1**, event-level capacity decrement of **1**, and confirm/ICS/email using `bookings.date_time`. The old “no datetime slot selection” / “without a slot selection step” / “next upcoming datetime for calendar/ICS” wording SHALL be removed. Playwright in `e2e/specs/booking.spec.ts` SHALL include a test titled exactly `Scenario: Book a priced datetime slot`. `docs/product/database/schema-overview.md` SHALL list `bookings.date_time` (`timestamptz NOT NULL`, booked occurrence) and SHALL NOT list denormalized `events.date_time` as the ICS/email calendar source. `docs/product/extras/gaps-and-decisions.md` SHALL NOT say MVP booking remains event-scoped. Capacity and voucher inventory SHALL remain documented as event-level.

#### Scenario: Coverage traces slot booking
- **WHEN** the coverage matrix is updated for this feature
- **THEN** it includes a row for booking a priced datetime slot (pass or explicit environment skip)
- **AND** that row does not use `@skip-no-ui`

#### Scenario: Book a priced datetime slot
- **GIVEN** I am signed in with an "ACTIVE" subscription
- **AND** the event has multiple future datetimes with different credit prices
- **AND** the event has enough remaining capacity and I have enough credits
- **WHEN** I select a non-primary future datetime and confirm the booking
- **THEN** a confirmed booking is stored with that `date_time` and `tickets_count = 1`
- **AND** credits deducted equal that occurrence’s price times 1
- **AND** remaining capacity decreases by 1 (event-level)
- **AND** confirmation surfaces use the booked datetime for calendar/ICS display

#### Scenario: Successful booking Gherkin is slot-aware
- **WHEN** a reader opens the Successful booking scenario in `booking.feature`
- **THEN** it does not say the booking is event-scoped or that there is no datetime slot selection
- **AND** credits charged are the selected occurrence price × 1
- **AND** remaining capacity decreases by 1

#### Scenario: Post-booking calendar uses booked datetime
- **WHEN** a reader opens the Post-booking actions scenario in `booking.feature`
- **THEN** ICS / confirm / email time fields are specified as the booked datetime
- **AND** they are not specified as the event’s next upcoming datetime

### Requirement: Already-booked checkout messaging
When a booking-eligible member views `/events/:id` or `/events/:id/book` and the selected (or only) future occurrence is one they already hold as `CONFIRMED` or `USED`, the system SHALL NOT show a confirm-booking form or book CTA for that occurrence. It SHALL show this copy verbatim — DE: `Du hast das bereits gebucht. Du kannst es unter Meine Tickets nachschauen.` EN: `You've already booked this. You can check it in My Tickets.` — and a link labeled `Meine Tickets` / `My Tickets` to `/:locale/bookings`. If the event has other future occurrences the member does not hold, those hours SHALL remain selectable and bookable. A POST that loses the race (`ALREADY_BOOKED`) SHALL render the same message and link rather than a generic booking error. Guests, past-due members, and membership-required viewers SHALL NOT receive already-booked treatment. For a booking-eligible member, a selected hour that is already held SHALL take priority over sold-out / waitlist chrome for that hour (past events still show past chrome, not already-booked). `docs/product/features/booking.feature` SHALL include scenarios titled `Reopening a booked single-slot event` and `Booked hour on a multi-hour event`. Playwright in `e2e/specs/booking.spec.ts` SHALL use those titles verbatim and SHALL cover detail and book (single-slot reopen) plus multi-hour booked vs other hour.

#### Scenario: Reopening a booked single-slot event
- **WHEN** I am a booking-eligible member with a `CONFIRMED` booking for a single-occurrence event
- **AND** I open that event’s detail or book page
- **THEN** I see the already-booked message
- **AND** I can follow My Tickets to `/:locale/bookings`
- **AND** I do not see a control to confirm another booking

#### Scenario: Booked hour on a multi-hour event
- **WHEN** I have a `CONFIRMED` booking for the morning occurrence only
- **AND** I open the event with that morning datetime selected
- **THEN** I see the already-booked message and My Tickets link
- **AND** I can select the evening occurrence and book one ticket there

#### Scenario: Book POST race shows already-booked copy
- **WHEN** I submit a booking POST for an occurrence I already hold as `CONFIRMED` or `USED`
- **THEN** I see the already-booked message and My Tickets link
- **AND** I do not see a generic booking-failed error
- **AND** I do not see a confirm-booking submit control

#### Scenario: Already-booked beats waitlist for the selected hour
- **WHEN** the event is sold out
- **AND** I already hold the selected future occurrence as `CONFIRMED` or `USED`
- **THEN** I see the already-booked message and My Tickets link
- **AND** I do not see a waitlist join CTA for that selected hour
