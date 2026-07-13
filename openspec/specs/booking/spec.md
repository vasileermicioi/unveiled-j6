# Booking

Event booking persistence, atomic purchase transactions, SSR book/confirm surfaces, and confirmation email.

## Requirements

### Requirement: Bookings persistence
The system SHALL persist event bookings in `public.bookings` with a generated primary key, foreign keys to `users`, `events`, and denormalized `partner_id`, ticket count, total credits charged, status (`CONFIRMED` | `WAITLIST` | `CANCELLED` | `USED`), redemption fields, `idempotency_key`, and timestamps. Foreign keys SHALL use `ON DELETE RESTRICT`.

#### Scenario: Unique idempotency per user
- **WHEN** two booking rows would share the same `(user_id, idempotency_key)`
- **THEN** the database rejects the duplicate insert

#### Scenario: Booking row shape is queryable
- **WHEN** the booking domain inserts a confirmed booking for a member and event
- **THEN** the row stores `user_id`, `event_id`, `partner_id`, `tickets_count`, `total_credits`, `status`, and `idempotency_key`

### Requirement: Transactional database access
The system SHALL provide a Drizzle-capable database client that supports multi-statement transactions and row locking for the booking path, exported from `@unveiled/db` alongside the existing neon-http client.

#### Scenario: Transaction API available
- **WHEN** the booking domain opens a write transaction
- **THEN** it uses the transactional client (not neon-http-only) so `SELECT … FOR UPDATE` can run

#### Scenario: HTTP client remains for reads
- **WHEN** catalog or session code needs a non-transactional query client
- **THEN** it MAY continue to use the existing `createDb` neon-http factory

### Requirement: Atomic booking transaction
The system SHALL create purchase bookings only through a single Postgres transaction that locks the event row, verifies subscription eligibility and capacity and credits, decrements capacity and credits, writes a `CONFIRMED` booking, and writes a negative `BOOKING` ledger entry (unless `skipCreditCharge`). The Booking domain SHALL be the only writer of purchase bookings and `BOOKING` ledger rows.

#### Scenario: Successful booking
- **WHEN** an eligible member confirms a booking with sufficient capacity and credits
- **THEN** a confirmed booking is created, credits and capacity decrease, and a `BOOKING` ledger entry is recorded

#### Scenario: Booking fails — insufficient credits
- **WHEN** credits are insufficient for `creditPrice × ticket count`
- **THEN** the booking is rejected and no credits, capacity, or ledger changes occur

#### Scenario: Idempotent retry
- **WHEN** the same `(user_id, idempotency_key)` is submitted again after success
- **THEN** no duplicate booking or credit/capacity change occurs and the original redemption info is returned

#### Scenario: Ticket quantity bounds
- **WHEN** a booking is requested with a ticket count outside 1–3
- **THEN** the booking is rejected without mutating credits, capacity, or ledger

### Requirement: Subscription gate inside booking
The system SHALL allow booking only for `ACTIVE` and `CANCELLED_PENDING` subscriptions. `PAST_DUE` SHALL show a credits-frozen / update-payment message. `INACTIVE` and `UNPAID` SHALL redirect to membership checkout. Unauthenticated users SHALL be redirected to sign-in.

#### Scenario: Booking requires authentication
- **WHEN** an unauthenticated user tries to book an event
- **THEN** they are redirected to sign in

#### Scenario: Booking requires an eligible subscription
- **WHEN** a signed-in member with `INACTIVE` or `UNPAID` status attempts to book
- **THEN** they are redirected to the membership checkout page

#### Scenario: Booking fails — subscription frozen (past due)
- **WHEN** subscription status is `PAST_DUE`
- **THEN** the booking is rejected with a credits-frozen / update-payment message and no credits, capacity, or ledger changes occur

#### Scenario: Cancelled-pending members may still book
- **WHEN** a signed-in member with `CANCELLED_PENDING` status confirms a booking with sufficient capacity and credits
- **THEN** a confirmed booking is created as for an `ACTIVE` member

### Requirement: Redemption info by ticket type
The system SHALL attach redemption info to each confirmed booking according to the event's ticket type and secret-code mode.

#### Scenario: Manual secret code
- **WHEN** a booking is confirmed for `SECRET_CODE` / `MANUAL`
- **THEN** the booking stores the event's admin-configured secret code as redemption info

#### Scenario: Shared generated secret code
- **WHEN** a booking is confirmed for `SECRET_CODE` / `SHARED_GENERATED`
- **THEN** the booking stores one shared generated code, created on first booking of that event and reused for later bookings

#### Scenario: Unique per-booking secret code
- **WHEN** a booking is confirmed for `SECRET_CODE` / `UNIQUE_PER_BOOKING`
- **THEN** the booking stores a freshly generated code unique to that booking

#### Scenario: Voucher redemption
- **WHEN** a booking is confirmed for `VOUCHER`
- **THEN** the booking stores the event's promo code and partner event website URL

### Requirement: Booking confirmation surfaces and email
The system SHALL expose SSR pages at `/:locale/events/:id/book` (GET form + POST mutation) and `/:locale/events/:id/book/confirm`, communicate the “SECURE RSVP // NO REFUNDS” policy at booking, and SHALL send a Resend confirmation email with redemption info and an `.ics` attachment after a successful booking commit. Email send failure SHALL NOT roll back the booking.

#### Scenario: Post-booking actions
- **WHEN** a booking is confirmed
- **THEN** the member can view/copy redemption info, download an ICS calendar file, and see support contact on the confirm page

#### Scenario: Booking confirmation email
- **WHEN** a booking is confirmed
- **THEN** the member receives a confirmation email with redemption info and an ICS attachment

#### Scenario: No member self-cancel
- **WHEN** a member views book or confirm surfaces
- **THEN** no member-facing action exists to cancel the booking or request a refund

### Requirement: Sold-out without waitlist (Phase 6)
The Phase 6 requirement that sold-out bookings reject without a waitlist offer is superseded for Phase 7 member UX. The system SHALL still reject the booking transaction itself when remaining capacity is less than the requested ticket count (no booking row created). For authenticated eligible members, the system SHALL offer waitlist join instead of only showing a closed sold-out error with no member path.

#### Scenario: Sold out — automatic waitlist offer
- **WHEN** remaining capacity is less than the requested ticket count
- **THEN** the booking is not created and the member is offered waitlist join

#### Scenario: Insufficient capacity still rejects booking
- **WHEN** a book POST fails with sold-out / capacity error
- **THEN** no booking or credit ledger mutation occurs for that attempt

### Requirement: My Tickets list
The system SHALL provide an authenticated, paginated SSR `/bookings` list of the member’s bookings ordered by most recent, with empty state and redemption-oriented ticket presentation. Page size SHALL be 20. Pagination SHALL use GET `?page=` with SSR links and SHALL work without client-only fetching. The list SHALL NOT offer member self-cancel or refund actions.

#### Scenario: Member views tickets
- **WHEN** a signed-in member with at least one booking visits `/bookings`
- **THEN** they see their tickets with redemption information affordances and can paginate via `?page=` without client-only fetching

#### Scenario: Empty tickets list
- **WHEN** a signed-in member has no bookings
- **THEN** they see an empty state on `/bookings`

#### Scenario: My Tickets is read-only for members
- **WHEN** a member views `/bookings`
- **THEN** no member-facing action exists to cancel a booking or request a refund

### Requirement: My Tickets navigation
The system SHALL expose a signed-in member navigation link labeled per locale inventory (`Meine Tickets` / `My Tickets`) that routes to `/:locale/bookings`.

#### Scenario: Member opens My Tickets from nav
- **WHEN** a signed-in USER uses the app shell navigation
- **THEN** a My Tickets link is available and navigates to their bookings list
