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
The system SHALL create purchase bookings only through a single Postgres transaction that locks the event row, verifies subscription eligibility and capacity and credits, decrements capacity and credits, writes a `CONFIRMED` booking, and writes a negative `BOOKING` ledger entry (unless `skipCreditCharge`). The Booking domain SHALL be the only writer of purchase bookings and `BOOKING` ledger rows. Ticket count shape validation SHALL require an integer ≥ 1 and SHALL NOT impose a hard upper bound of 3; remaining capacity and credit balance remain authoritative rejection reasons.

#### Scenario: Successful booking
- **WHEN** an eligible member confirms a booking with sufficient capacity and credits
- **THEN** a confirmed booking is created, credits and capacity decrease, and a `BOOKING` ledger entry is recorded

#### Scenario: Booking fails — insufficient credits
- **WHEN** credits are insufficient for `creditPrice × ticket count`
- **THEN** the booking is rejected and no credits, capacity, or ledger changes occur

#### Scenario: Idempotent retry
- **WHEN** the same `(user_id, idempotency_key)` is submitted again after success
- **THEN** no duplicate booking or credit/capacity change occurs and the original redemption info is returned

#### Scenario: Ticket quantity shape invalid
- **WHEN** a booking is requested with a non-integer ticket count or a count less than 1
- **THEN** the booking is rejected without mutating credits, capacity, or ledger

#### Scenario: Ticket quantity above three still bookable
- **WHEN** an eligible member confirms a booking for more than 3 tickets and capacity and credits are sufficient
- **THEN** a confirmed booking is created and credits and capacity decrease accordingly

### Requirement: Ticket count selection bounds
For guests viewing the public event detail checkout affordance, the system SHALL allow selecting a ticket count from 1 through 3 (preview only; booking remains auth-gated). For signed-in members on detail and book surfaces, the maximum selectable ticket count SHALL be the minimum of (a) floor(available credits ÷ event creditPrice) and (b) the event’s remaining capacity (with creditPrice ≤ 0 treated as capacity-only). The booking transaction SHALL accept any integer ticket count ≥ 1 that passes capacity and credit checks and SHALL NOT reject solely because the count is greater than 3.

#### Scenario: Guest preview capped at three
- **WHEN** a guest views a bookable event detail page
- **THEN** the ticket quantity control does not exceed 3

#### Scenario: Member max follows credits and capacity
- **WHEN** a signed-in member with 17 credits views a bookable event priced at 2 credits with remaining capacity 10
- **THEN** the maximum selectable ticket count is 8

#### Scenario: Booking succeeds above former hard cap
- **WHEN** an eligible member confirms a booking for 4 tickets and capacity and credits are sufficient
- **THEN** the booking is created and credits/capacity decrease accordingly

#### Scenario: Capacity still enforced
- **WHEN** the requested ticket count exceeds remaining capacity
- **THEN** the booking is rejected and no credits, capacity, or ledger changes occur

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

### Requirement: Admin booking cancellation domain
The system SHALL allow an admin to cancel a `CONFIRMED` booking with a reason, set status `CANCELLED`, increase event remaining capacity by the ticket count, trigger waitlist processing for that event, and MUST NOT refund credits as part of cancellation.

#### Scenario: Cancel confirmed booking
- **WHEN** an admin cancels a confirmed booking
- **THEN** the booking is `CANCELLED`, capacity increases by the booking's ticket count, waitlist processing runs for that event, and credits are unchanged by the cancel itself

#### Scenario: Reject non-confirmed cancel
- **WHEN** an admin attempts to cancel a booking that is not `CONFIRMED`
- **THEN** the operation is rejected and capacity, credits, and booking status are unchanged

### Requirement: Admin cancel booking page
The system SHALL provide `/:locale/admin/bookings/:id/cancel` as an SSR confirm + POST page for ADMIN users (`robots: noindex`) that cancels a `CONFIRMED` booking with a required reason, restores capacity, triggers waitlist processing, and MUST NOT refund credits as part of cancellation. The page MUST NOT use client-only mutation modals. Membership HQ member detail SHALL expose links to cancel confirmed bookings for that member.

#### Scenario: Cancel via admin page
- **WHEN** an admin submits cancel with a reason for a confirmed booking
- **THEN** booking status becomes `CANCELLED`, capacity and waitlist side effects run, credits are unchanged by the cancel, and the admin is redirected away from the confirm page

#### Scenario: Cancel page rejects non-confirmed booking
- **WHEN** an admin opens or submits cancel for a booking that is not `CONFIRMED`
- **THEN** the cancel does not change booking status and an on-page error or not-allowed state is shown

#### Scenario: Cancel page is admin-only
- **WHEN** a non-admin requests `/admin/bookings/:id/cancel`
- **THEN** access is denied

### Requirement: Admin booking cancel Playwright coverage
The system SHALL implement Playwright coverage for `booking.feature` scenarios `Admin cancels a confirmed booking` and `Cannot cancel a booking that is not confirmed` in `e2e/specs/booking.spec.ts` now that `/:locale/admin/bookings/:id/cancel` exists. Specs SHALL use verbatim Gherkin titles and proximity selectors, assert `CANCELLED` status and that credits are not refunded by cancel itself, and skip only for documented env prerequisites. Ladle SHALL include a cancel confirm story for `AdminCancelBookingPage`.

#### Scenario: Admin cancel booking is executable
- **WHEN** an ADMIN cancels a CONFIRMED booking with a reason via the cancel page in e2e
- **THEN** the booking becomes CANCELLED, capacity side effects are observable as the harness allows, member credits are unchanged by the cancel, and the test does not skip solely for missing UI

#### Scenario: Non-confirmed cancel rejection is executable
- **WHEN** an ADMIN attempts to cancel a non-CONFIRMED booking via the cancel page
- **THEN** cancellation is rejected (on-page error or unchanged status) without silent skip for missing UI

#### Scenario: Cancel booking Ladle story loads
- **WHEN** Ladle is started after this change
- **THEN** the admin cancel booking confirm story renders without runtime errors

### Requirement: Detail page does not charge credits
The public event detail page SHALL NOT create bookings or ledger entries. Ticket quantity controls on detail, if shown, SHALL only influence navigation into the existing SSR booking or auth `returnTo` flow. Credit deduction for purchases SHALL continue to occur only through the Booking domain on the dedicated `/:locale/events/:id/book` SSR form POST (or equivalent booking-domain writers such as waitlist promotion / admin comp — not from detail).

#### Scenario: Guest quantity does not book
- **WHEN** a guest changes ticket quantity on event detail
- **THEN** no booking row is created
- **AND** continuing requires authentication before any credit charge

#### Scenario: Eligible member quantity only deep-links
- **WHEN** an eligible member adjusts ticket quantity on event detail and follows the primary book CTA
- **THEN** they navigate to `/:locale/events/:id/book` (optionally with a quantity query)
- **AND** no booking or ledger write occurs until the book page SSR POST succeeds

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
