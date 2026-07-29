## MODIFIED Requirements

### Requirement: Booking confirmation surfaces and email

The system SHALL expose SSR pages at `/:locale/events/:id/book` (GET form + POST mutation) and `/:locale/events/:id/book/confirm`, communicate the “SECURE RSVP // NO REFUNDS” policy at booking, and SHALL send a Resend confirmation email with redemption info and an `.ics` attachment after a successful booking commit. Email send failure SHALL NOT roll back the booking. After booking, the confirm page SHALL present per-ticket redemptions from `booking_tickets`: members can copy textual redemption codes when present, reveal/hide those codes (masked by default), download PDF vouchers when applicable, download an `.ics` calendar file, and see support contact.

#### Scenario: Post-booking actions

- **WHEN** a booking is confirmed
- **THEN** the member can copy redemption codes (when textual), reveal/hide those codes, download PDF vouchers when applicable, download an ICS calendar file, and see support contact on the confirm page
- **AND** each `booking_tickets` row is listed (not only booking-level `redemption_*`)

#### Scenario: Booking confirmation email

- **WHEN** a booking is confirmed
- **THEN** the member receives a confirmation email with redemption info and an ICS attachment

#### Scenario: No member self-cancel

- **WHEN** a member views book or confirm surfaces
- **THEN** no member-facing action exists to cancel the booking or request a refund

### Requirement: My Tickets list

The system SHALL provide an authenticated, paginated SSR `/bookings` list of the member’s bookings ordered by most recent, with empty state and redemption-oriented ticket presentation that lists per-ticket redemptions from `booking_tickets` (masked codes with reveal, PDF download when applicable). Page size SHALL be 20. Pagination SHALL use GET `?page=` with SSR links and SHALL work without client-only fetching. The list SHALL NOT offer member self-cancel or refund actions. Bookings pages SHALL remain `robots: noindex`.

#### Scenario: Member views tickets

- **WHEN** a signed-in member with at least one booking visits `/bookings`
- **THEN** they see their tickets with per-ticket redemption affordances (masked codes and/or PDF download) and can paginate via `?page=` without client-only fetching

#### Scenario: Empty tickets list

- **WHEN** a signed-in member has no bookings
- **THEN** they see an empty state on `/bookings`

#### Scenario: My Tickets is read-only for members

- **WHEN** a member views `/bookings`
- **THEN** no member-facing action exists to cancel a booking or request a refund

### Requirement: Booking ticket redemption readers

The booking domain SHALL expose read helpers so list and by-id booking queries can include the related `booking_tickets` rows for a booking (ordered by ordinal). `listUserBookings` SHALL attach per-booking ticket redemptions for items on the current page. Member My Tickets and booking confirm call sites SHALL consume those ticket rows for redemption UI (not ignore them in favor of booking-level summary alone). Confirm loaders SHALL load `booking_tickets` for the owned booking (via `listBookingTickets` or equivalent).

#### Scenario: List includes ticket redemptions

- **WHEN** `listUserBookings` returns a page that includes a multi-ticket booking
- **THEN** each list item includes that booking’s `booking_tickets` rows ordered by ordinal

#### Scenario: Confirm loads ticket redemptions

- **WHEN** a member opens booking confirm for an owned booking
- **THEN** the page is rendered with that booking’s `booking_tickets` rows ordered by ordinal
