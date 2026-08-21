## MODIFIED Requirements

### Requirement: Booking confirmation surfaces and email
The system SHALL expose SSR pages at `/:locale/events/:id/book` (GET form + POST mutation) and `/:locale/events/:id/book/confirm`, communicate the “SECURE RSVP // NO REFUNDS” policy at booking, and SHALL send a Resend confirmation email with redemption info and an `.ics` attachment after a successful booking commit. Email send failure SHALL NOT roll back the booking. After booking, the confirm page SHALL present per-ticket redemptions from `booking_tickets`: members can copy textual redemption codes when present, reveal/hide those codes (masked by default), download PDF vouchers when applicable, download an `.ics` calendar file, and see support contact. Confirm page time chrome, ICS `DTSTART`, booking ticket card datetime, and confirmation-email “when” fields SHALL use `bookings.date_time`, not the event’s next upcoming datetime. The book GET/POST SHALL parse `dateTime` / `date_time`, re-validate the slot, and show that slot’s unit price. Book, confirm, and ticket-card chrome SHALL show the event title resolved for the page `/:locale` (requested locale → other locale → canonical). Booking-confirmation email SHALL use that same resolved title for the email `locale` already passed to the renderer. ICS `SUMMARY` MAY keep canonical `title`.

#### Scenario: Post-booking actions
- **WHEN** a booking is confirmed
- **THEN** the member can copy redemption codes (when textual), reveal/hide those codes, download PDF vouchers when applicable, download an ICS calendar file, and see support contact on the confirm page
- **AND** each `booking_tickets` row is listed (not only booking-level `redemption_*`)

#### Scenario: Booking confirmation email
- **WHEN** a booking is confirmed
- **THEN** the member receives a confirmation email with redemption info and an ICS attachment

#### Scenario: Confirmation calendar uses booked datetime
- **WHEN** a member books a non-primary future slot and downloads ICS or views confirm/email time fields
- **THEN** those surfaces use the booked datetime, not the event’s next upcoming datetime

#### Scenario: No member self-cancel
- **WHEN** a member views book or confirm surfaces
- **THEN** no member-facing action exists to cancel the booking or request a refund

#### Scenario: Book page shows locale title
- **WHEN** a member opens `/en/events/:id/book` for an event with `title_en = "Concert"` and `title_de = "Konzert"`
- **THEN** the book chrome title is "Concert"

#### Scenario: Confirmation email uses locale title
- **WHEN** a booking confirmation email is sent with locale `en` for that same event
- **THEN** the subject and body use "Concert"
- **AND** the ICS attachment MAY still use canonical `title`

### Requirement: My Tickets list
The system SHALL provide an authenticated, paginated SSR `/bookings` list of the member’s bookings ordered by most recent, with empty state and redemption-oriented ticket presentation that lists per-ticket redemptions from `booking_tickets` (masked codes with reveal, PDF download when applicable). Page size SHALL be 20. Pagination SHALL use GET `?page=` with SSR links and SHALL work without client-only fetching. The list SHALL NOT offer member self-cancel or refund actions. Bookings pages SHALL remain `robots: noindex`. Each ticket card SHALL show the event title resolved for the page `/:locale`.

#### Scenario: Member views tickets
- **WHEN** a signed-in member with at least one booking visits `/bookings`
- **THEN** they see their tickets with per-ticket redemption affordances (masked codes and/or PDF download) and can paginate via `?page=` without client-only fetching

#### Scenario: Empty tickets list
- **WHEN** a signed-in member has no bookings
- **THEN** they see an empty state on `/bookings`

#### Scenario: My Tickets is read-only for members
- **WHEN** a member views `/bookings`
- **THEN** no member-facing action exists to cancel a booking or request a refund

#### Scenario: Ticket card title follows page locale
- **WHEN** a member opens `/en/bookings` for a booking whose event has `title_en = "Concert"` and `title_de = "Konzert"`
- **THEN** the ticket card title is "Concert"
