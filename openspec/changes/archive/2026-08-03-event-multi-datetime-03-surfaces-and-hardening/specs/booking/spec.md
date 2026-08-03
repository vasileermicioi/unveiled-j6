## ADDED Requirements

### Requirement: Bookings remain event-scoped

Creating a booking SHALL continue to reference `events.id` only. The system SHALL NOT require the member to pick a datetime slot when an event has multiple datetimes. Capacity, credits, and inventory checks remain at event level.

#### Scenario: Book event with multiple datetimes

- **WHEN** a booking-eligible member books an event that has multiple future datetimes
- **THEN** the booking succeeds against the event without a slot selection step
- **AND** confirmation surfaces use the next upcoming datetime for calendar/ICS display

## MODIFIED Requirements

### Requirement: Booking confirmation surfaces and email

The system SHALL expose SSR pages at `/:locale/events/:id/book` (GET form + POST mutation) and `/:locale/events/:id/book/confirm`, communicate the “SECURE RSVP // NO REFUNDS” policy at booking, and SHALL send a Resend confirmation email with redemption info and an `.ics` attachment after a successful booking commit. Email send failure SHALL NOT roll back the booking. After booking, the confirm page SHALL present per-ticket redemptions from `booking_tickets`: members can copy textual redemption codes when present, reveal/hide those codes (masked by default), download PDF vouchers when applicable, download an `.ics` calendar file, and see support contact. Confirm page time chrome, ICS `DTSTART`, booking ticket card datetime, and confirmation-email “when” fields SHALL use the event’s **next upcoming** datetime (denormalized primary `date_time`), not an arbitrary past slot and not a member-selected occurrence.

#### Scenario: Post-booking actions

- **WHEN** a booking is confirmed
- **THEN** the member can copy redemption codes (when textual), reveal/hide those codes, download PDF vouchers when applicable, download an ICS calendar file, and see support contact on the confirm page
- **AND** each `booking_tickets` row is listed (not only booking-level `redemption_*`)

#### Scenario: Booking confirmation email

- **WHEN** a booking is confirmed
- **THEN** the member receives a confirmation email with redemption info and an ICS attachment

#### Scenario: Confirmation calendar uses next upcoming datetime

- **WHEN** a member books a multi-datetime event and downloads ICS or views confirm/email time fields
- **THEN** those surfaces use the event’s next upcoming datetime

#### Scenario: No member self-cancel

- **WHEN** a member views book or confirm surfaces
- **THEN** no member-facing action exists to cancel the booking or request a refund
