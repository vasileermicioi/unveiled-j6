## ADDED Requirements

### Requirement: Already-booked checkout messaging
When a booking-eligible member views `/events/:id` or `/events/:id/book` and the selected (or only) future occurrence is one they already hold as `CONFIRMED` or `USED`, the system SHALL NOT show a confirm-booking form or book CTA for that occurrence. It SHALL show this copy verbatim — DE: `Du hast das bereits gebucht. Du kannst es unter Meine Tickets nachschauen.` EN: `You've already booked this. You can check it in My Tickets.` — and a link labeled `Meine Tickets` / `My Tickets` to `/:locale/bookings`. If the event has other future occurrences the member does not hold, those hours SHALL remain selectable and bookable. A POST that loses the race (`ALREADY_BOOKED`) SHALL render the same message and link rather than a generic booking error. Guests, past-due members, and membership-required viewers SHALL NOT receive already-booked treatment. For a booking-eligible member, a selected hour that is already held SHALL take priority over sold-out / waitlist chrome for that hour (past events still show past chrome, not already-booked).

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

## MODIFIED Requirements

### Requirement: Detail page does not charge credits
The public event detail page SHALL NOT create bookings or ledger entries. Ticket-quantity steppers or selects SHALL NOT appear on detail. When a datetime slot is selected and that slot is **not** already held by the booking-eligible member, the primary book or login CTA SHALL include that occurrence as a `dateTime` query param (ISO instant). When the selected slot **is** already held (`CONFIRMED` or `USED`), detail SHALL omit the book CTA (and waitlist CTA) and SHALL NOT deep-link to a confirm form for that hour. A `qty` query, if present, SHALL be `1` or omitted. Credit deduction for purchases SHALL continue to occur only through the Booking domain on the dedicated `/:locale/events/:id/book` SSR form POST (or equivalent booking-domain writers such as waitlist promotion / admin comp — not from detail).

#### Scenario: Guest quantity does not book
- **WHEN** a guest views event detail
- **THEN** no ticket-quantity stepper or select is shown
- **AND** no booking row is created
- **AND** continuing requires authentication before any credit charge

#### Scenario: Eligible member quantity only deep-links
- **WHEN** an eligible member follows the primary book CTA from event detail for an hour they do not already hold
- **THEN** they navigate to `/:locale/events/:id/book` (optionally with a `dateTime` query and `qty=1` or no `qty`)
- **AND** no booking or ledger write occurs until the book page SSR POST succeeds

#### Scenario: Already-held hour has no book deep-link
- **WHEN** an eligible member views event detail with a selected occurrence they already hold
- **THEN** no book or waitlist CTA is shown for that hour
- **AND** no booking or ledger write occurs
