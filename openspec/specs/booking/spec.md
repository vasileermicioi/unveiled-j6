# Booking

Event booking persistence, atomic purchase transactions, SSR book/confirm surfaces, and confirmation email.

## Requirements

### Requirement: Bookings persistence
The system SHALL persist event bookings in `public.bookings` with a generated primary key, foreign keys to `users`, `events`, and denormalized `partner_id`, ticket count, total credits charged, status (`CONFIRMED` | `WAITLIST` | `CANCELLED` | `USED`), redemption fields, `idempotency_key`, `date_time` (the booked occurrence instant, `timestamptz NOT NULL`), and timestamps. Foreign keys SHALL use `ON DELETE RESTRICT`. Existing rows SHALL backfill `date_time` from the event’s denormalized `events.date_time` before the column is set NOT NULL.

#### Scenario: Unique idempotency per user
- **WHEN** two booking rows would share the same `(user_id, idempotency_key)`
- **THEN** the database rejects the duplicate insert

#### Scenario: Booking row shape is queryable
- **WHEN** the booking domain inserts a confirmed booking for a member and event
- **THEN** the row stores `user_id`, `event_id`, `partner_id`, `tickets_count`, `total_credits`, `status`, `idempotency_key`, and `date_time`

#### Scenario: Historical bookings backfill event primary
- **WHEN** the `bookings.date_time` migration runs
- **THEN** every existing booking has `date_time` equal to that event’s denormalized `date_time`
- **AND** the column is NOT NULL

### Requirement: One active booking per occurrence
The system SHALL allow at most one `CONFIRMED` or `USED` booking row per `(user_id, event_id, date_time)`. `date_time` is the booked occurrence instant. `CANCELLED` rows SHALL NOT participate in this uniqueness. A second purchase, waitlist promotion, or admin comp for an already-held active occurrence SHALL fail with `ALREADY_BOOKED` and SHALL NOT mutate credits, capacity, inventory, or ledger. A member MAY hold one ticket on each distinct occurrence of a multi-datetime event. New bookings SHALL persist `tickets_count = 1`. The system SHALL expose a read of the occurrence instants a member already holds as `CONFIRMED` or `USED` for a given event (for later checkout UI).

#### Scenario: Second ticket for the same hour is rejected
- **WHEN** a member already has a `CONFIRMED` booking for an event occurrence
- **AND** they submit another booking for that same occurrence
- **THEN** the system rejects with `ALREADY_BOOKED` and no credits, capacity, or ledger change

#### Scenario: Different hour on the same event is allowed
- **WHEN** a member has a `CONFIRMED` booking for a morning occurrence
- **AND** they book the evening occurrence of the same event
- **THEN** a second confirmed booking is created with `tickets_count = 1` and that evening `date_time`

#### Scenario: Cancelled hour can be booked again
- **WHEN** the member’s only booking for that occurrence is `CANCELLED`
- **THEN** a new confirmed booking for that occurrence is allowed

#### Scenario: Active booked instants are queryable
- **WHEN** a member has `CONFIRMED` or `USED` bookings for two hours of an event and a `CANCELLED` hour of the same event
- **THEN** listing that member’s active booked instants for the event returns only the `CONFIRMED` and `USED` `date_time` values

### Requirement: Transactional database access
The system SHALL provide a Drizzle-capable database client that supports multi-statement transactions and row locking for the booking path, exported from `@unveiled/db` alongside the existing neon-http client.

#### Scenario: Transaction API available
- **WHEN** the booking domain opens a write transaction
- **THEN** it uses the transactional client (not neon-http-only) so `SELECT … FOR UPDATE` can run

#### Scenario: HTTP client remains for reads
- **WHEN** catalog or session code needs a non-transactional query client
- **THEN** it MAY continue to use the existing `createDb` neon-http factory

### Requirement: Atomic booking transaction
The system SHALL create purchase bookings only through a single Postgres transaction that locks the event row, verifies subscription eligibility and capacity and credits, allocates per-ticket redemption artifacts (`booking_tickets` plus voucher inventory when applicable), decrements capacity and credits, writes a `CONFIRMED` booking including `bookings.date_time`, and writes a negative `BOOKING` ledger entry (unless `skipCreditCharge`). Credits charged SHALL be the **selected occurrence** credit price × **1**. Ticket count validation SHALL require the integer `1` (not merely ≥ 1). The transaction SHALL reject a second active booking for the same user + event + resolved `date_time` (`ALREADY_BOOKED`). The Booking domain SHALL be the only writer of purchase bookings and `BOOKING` ledger rows. Remaining capacity, credit balance, and (for voucher types) available inventory remain authoritative rejection reasons alongside uniqueness and ticket-count validation. Idempotent retry of the same `(user_id, idempotency_key)` SHALL return the original booking without re-allocating inventory or mutating credits/capacity, and SHALL ignore a mismatched posted datetime. Idempotent retry SHALL run **before** the uniqueness check.

#### Scenario: Successful booking
- **WHEN** I confirm the booking for a selected future datetime I do not already hold
- **THEN** a confirmed booking is created with `tickets_count = 1` against the event and that datetime
- **AND** my credits are decremented by that slot’s creditPrice
- **AND** the event’s remaining capacity is decremented by 1

#### Scenario: Booking fails — insufficient credits
- **WHEN** credits are insufficient for the selected occurrence `creditPrice × 1`
- **THEN** the booking is rejected and no credits, capacity, or ledger changes occur

#### Scenario: Idempotent retry
- **WHEN** the same `(user_id, idempotency_key)` is submitted again after success
- **THEN** no duplicate booking or credit/capacity change occurs and the original redemption info is returned
- **AND** voucher inventory is not allocated a second time

#### Scenario: Ticket quantity other than one is rejected
- **WHEN** a booking is requested with a ticket count other than 1
- **THEN** the booking is rejected without mutating credits, capacity, or ledger

#### Scenario: Ticket quantity shape invalid
- **WHEN** a booking is requested with a non-integer ticket count or a count less than 1
- **THEN** the booking is rejected without mutating credits, capacity, or ledger

#### Scenario: Ticket quantity above three still bookable
- **WHEN** an eligible member confirms a booking for more than 3 tickets
- **THEN** the booking is rejected with `INVALID_TICKET_COUNT` and no credits, capacity, or ledger changes occur

### Requirement: Ticket count selection bounds
The system SHALL NOT offer a ticket-quantity stepper or select on public event detail, `/events/:id/book`, waitlist join, or admin comp. Bookable quantity for a new write is exactly one ticket when the member can afford the selected occurrence price, remaining capacity is at least 1, and (for voucher types) at least one inventory item is available; otherwise the member cannot book. Guests continue to omit quantity and credit totals. Changing the selected future datetime SHALL recompute the one-ticket credit total from that slot’s price. The booking transaction SHALL reject any ticket count other than the integer `1`.

#### Scenario: Eligible checkout has no quantity stepper
- **WHEN** a booking-eligible member views a bookable event detail page
- **THEN** there is no control to increase ticket count above 1
- **AND** the credit total equals the selected occurrence price

#### Scenario: Guest preview capped at three
- **WHEN** a guest views a bookable event detail page
- **THEN** there is no ticket-quantity control (guests omit quantity; there is no preview cap of 3)

#### Scenario: Member max follows credits and capacity
- **WHEN** a signed-in member with 17 credits views a bookable event priced at 2 credits with remaining capacity 10
- **THEN** the bookable quantity is 1 (not 8)

#### Scenario: Member cannot book when they cannot afford one ticket
- **WHEN** a signed-in member with 1 credit views a bookable event priced at 2 credits with remaining capacity 10
- **THEN** the bookable quantity for that occurrence is 0

#### Scenario: Member max uses the selected slot price
- **WHEN** a signed-in member with 2 credits views an event with a 1-credit slot and a 3-credit slot, remaining capacity 10
- **THEN** the 1-credit slot is bookable (quantity 1)
- **AND** the 3-credit slot is not bookable (quantity 0)

#### Scenario: Member max also respects voucher inventory
- **WHEN** a signed-in member views a `VOUCHER_PROMO` event with remaining capacity 10, enough credits for the slot, and 0 `AVAILABLE` promo codes
- **THEN** the bookable quantity is 0

#### Scenario: Booking succeeds above former hard cap
- **WHEN** an eligible member confirms a booking for 4 tickets and capacity and credits are sufficient
- **THEN** the booking is rejected (`INVALID_TICKET_COUNT`) and credits/capacity are unchanged

#### Scenario: Capacity still enforced
- **WHEN** remaining capacity is 0
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
The system SHALL attach redemption info to each confirmed booking according to the event's ticket type. For `SECRET_CODE`, each `booking_tickets` row and the booking-level redemption summary SHALL use the event's admin-configured `secret_code` (no secret-code modes; codes are never auto-generated). For `VOUCHER_PROMO` and `VOUCHER_PDF`, the booking domain SHALL allocate one inventory asset per ticket inside the booking transaction, write `booking_tickets`, and denormalize ticket ordinal 1 onto booking-level `redemption_*` fields for backward-compatible readers. The domain MUST NOT invent redemption from a shared event-level `promo_code`. Insufficient inventory SHALL reject the booking without mutations.

#### Scenario: Manual secret code
- **WHEN** a booking is confirmed for `SECRET_CODE`
- **THEN** the booking stores the event's admin-configured secret code as redemption info
- **AND** each booking ticket stores that same secret code

#### Scenario: Voucher promo booking allocates inventory
- **WHEN** a booking is confirmed for `VOUCHER_PROMO` with sufficient `AVAILABLE` codes
- **THEN** booking tickets and allocated inventory rows are written in the same transaction
- **AND** booking-level redemption summary reflects ticket ordinal 1

#### Scenario: Voucher booking rejected when inventory is insufficient
- **WHEN** a booking is attempted for `VOUCHER_PROMO` or `VOUCHER_PDF` with fewer `AVAILABLE` inventory rows than the ticket count
- **THEN** the booking is rejected with a typed booking error and no credits, capacity, inventory, or ledger changes occur

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

### Requirement: Member selects a datetime slot when booking
When an event has two or more future datetimes, a booking-eligible member SHALL select one future occurrence before confirming. The booking SHALL store that instant on `bookings.date_time`. Credits charged SHALL be that occurrence’s `occurrence_credit_prices` value × **1**. Capacity and voucher inventory checks SHALL remain at event level. The system SHALL reject a datetime that is not on the event or that is in the past (`UNKNOWN_SLOT` / `PAST_SLOT`) with no credits, capacity, inventory, or ledger changes. Confirm page time chrome, ICS `DTSTART`, booking ticket card datetime, and confirmation-email “when” fields SHALL use `bookings.date_time`. Waitlist promotion and admin complimentary tickets MAY omit `dateTime`; the booking domain SHALL then persist the next upcoming occurrence (or the denormalized primary when every occurrence is past). Idempotent retry of the same `(user_id, idempotency_key)` SHALL return the original booking and SHALL ignore a mismatched posted datetime. `docs/product/features/booking.feature` SHALL describe this slot selection (not event-scoped booking) and SHALL include a scenario titled `Book a priced datetime slot`.

#### Scenario: Successful booking of a priced slot
- **WHEN** a member selects a future datetime priced 3 credits and books
- **THEN** a confirmed booking is stored with that `date_time` and `tickets_count = 1`
- **AND** 3 credits are deducted
- **AND** remaining capacity decreases by 1

#### Scenario: Unknown or past slot rejected
- **WHEN** the posted datetime is missing from `date_times` or is in the past
- **THEN** the booking is rejected
- **AND** no credits, capacity, inventory, or ledger changes occur

#### Scenario: Confirmation calendar uses booked datetime
- **WHEN** a member books a non-primary future slot and downloads ICS or views confirm/email time fields
- **THEN** those surfaces use the booked datetime, not the event’s next upcoming datetime

#### Scenario: Idempotent retry ignores mismatched datetime
- **WHEN** the same `(user_id, idempotency_key)` is submitted again with a different posted datetime
- **THEN** the original booking is returned without a second charge or capacity change
- **AND** `bookings.date_time` remains the originally stored instant

#### Scenario: Waitlist promotion defaults to next upcoming
- **WHEN** waitlist promotion calls `bookEvent` without a `dateTime`
- **THEN** the created booking stores the event’s next upcoming occurrence
- **AND** credits charged equal that occurrence’s price × 1

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

### Requirement: Sold-out without waitlist (Phase 6)
The Phase 6 requirement that sold-out bookings reject without a waitlist offer is superseded for Phase 7 member UX. The system SHALL still reject the booking transaction itself when remaining capacity is less than the requested ticket count (no booking row created). For authenticated eligible members, the system SHALL offer waitlist join instead of only showing a closed sold-out error with no member path.

#### Scenario: Sold out — automatic waitlist offer
- **WHEN** remaining capacity is less than the requested ticket count
- **THEN** the booking is not created and the member is offered waitlist join

#### Scenario: Insufficient capacity still rejects booking
- **WHEN** a book POST fails with sold-out / capacity error
- **THEN** no booking or credit ledger mutation occurs for that attempt

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

### Requirement: My Tickets navigation
The system SHALL expose a signed-in member navigation link labeled per locale inventory (`Meine Tickets` / `My Tickets`) that routes to `/:locale/bookings`.

#### Scenario: Member opens My Tickets from nav
- **WHEN** a signed-in USER uses the app shell navigation
- **THEN** a My Tickets link is available and navigates to their bookings list

### Requirement: Admin booking cancellation domain
The system SHALL allow an admin to cancel a `CONFIRMED` booking with a reason, set status `CANCELLED`, increase event remaining capacity by the ticket count, return any allocated voucher promo/PDF inventory for that booking to `AVAILABLE` (clearing allocation links), trigger waitlist processing for that event, and MUST NOT refund credits as part of cancellation.

#### Scenario: Cancel confirmed booking
- **WHEN** an admin cancels a confirmed booking
- **THEN** the booking is `CANCELLED`, capacity increases by the booking's ticket count, waitlist processing runs for that event, and credits are unchanged by the cancel itself

#### Scenario: Cancel restocks voucher inventory
- **WHEN** an admin cancels a confirmed booking that held allocated voucher inventory
- **THEN** those inventory rows become `AVAILABLE` again and are no longer linked to the booking’s tickets

#### Scenario: Reject non-confirmed cancel
- **WHEN** an admin attempts to cancel a booking that is not `CONFIRMED`
- **THEN** the operation is rejected and capacity, credits, inventory, and booking status are unchanged

### Requirement: Booking ticket redemption readers
The booking domain SHALL expose read helpers so list and by-id booking queries can include the related `booking_tickets` rows for a booking (ordered by ordinal). `listUserBookings` SHALL attach per-booking ticket redemptions for items on the current page. Member My Tickets and booking confirm call sites SHALL consume those ticket rows for redemption UI (not ignore them in favor of booking-level summary alone). Confirm loaders SHALL load `booking_tickets` for the owned booking (via `listBookingTickets` or equivalent).

#### Scenario: List includes ticket redemptions
- **WHEN** `listUserBookings` returns a page that includes a multi-ticket booking
- **THEN** each list item includes that booking’s `booking_tickets` rows ordered by ordinal

#### Scenario: Load tickets by booking id
- **WHEN** a caller requests tickets for a known booking id via the exported helper
- **THEN** the helper returns the booking’s ticket rows ordered by ordinal (empty if none)

#### Scenario: Confirm loads ticket redemptions
- **WHEN** a member opens booking confirm for an owned booking
- **THEN** the page is rendered with that booking’s `booking_tickets` rows ordered by ordinal

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

### Requirement: Booking quantity uses native select
Book, waitlist join, and admin comp SHALL NOT present a ticket-quantity stepper or select. Those forms SHALL persist quantity 1 (hidden field or omitted field with server default 1). Datetime choice, when two or more future occurrences exist, SHALL remain a native HTML `<select>`.

#### Scenario: Book page ticket count is a native select
- **WHEN** a booking-eligible member opens `/:locale/events/:id/book`
- **THEN** there is no ticket-quantity control (no native select and no stepper)
- **AND** submitting the form books exactly one ticket

#### Scenario: Waitlist join quantity matches book pattern
- **WHEN** a member opens the waitlist join form
- **THEN** there is no ticket-quantity control
- **AND** the created entry has `requested_qty = 1`

### Requirement: Product Gherkin redemption matches inventory model

`docs/product/features/booking.feature` SHALL document redemption for `SECRET_CODE` (admin-configured manual code only), `VOUCHER_PROMO` (one inventory code per ticket plus partner website when present), and `VOUCHER_PDF` (one inventory PDF per ticket with in-app download). It SHALL NOT document `secret_code_mode`, `SHARED_GENERATED`, `UNIQUE_PER_BOOKING`, or a single shared event-level `promo_code` as the voucher source. Scenarios SHALL cover insufficient voucher inventory rejection, admin cancel restock (credits not refunded), and member post-booking actions including mask/reveal and PDF download.

#### Scenario: Booking feature file has no generated modes

- **WHEN** an implementer reads `booking.feature` after this change
- **THEN** redemption examples list only the three shipped ticket types
- **AND** no Scenario requires `SHARED_GENERATED` or `UNIQUE_PER_BOOKING`

#### Scenario: Member redemption UI scenarios are specified

- **WHEN** an implementer reads post-booking / My Tickets scenarios in `booking.feature`
- **THEN** they describe masked codes with reveal/hide, per-ticket rows for multi-ticket bookings, and PDF download for `VOUCHER_PDF`

### Requirement: Admin sales export — tickets sold per event over a period

The system SHALL provide an ADMIN-only sales-export page (`/:locale/admin/partners/export`) that accepts a date period (`from` / `to` as `YYYY-MM-DD`, Europe/Berlin calendar days, inclusive) and optional case-insensitive substring filters on event title (`title`) and partner name (`partner`), and SHALL show a table listing matching events with the number of tickets sold in that period, plus a CSV download of the **same filtered set**. Tickets sold SHALL be the sum of `bookings.tickets_count` for bookings whose `created_at` falls within the inclusive period and whose status is `CONFIRMED` or `USED` (excluding `CANCELLED` and `WAITLIST`). Comp tickets that create bookings on the shared booking path SHALL count. When `from`/`to` are omitted on first open, the page SHALL default to a recent inclusive window of the last 30 Europe/Berlin calendar days. Invalid ranges SHALL be rejected with a clear error and SHALL NOT produce a CSV attachment. The HTML and CSV responses SHALL be guarded by the existing admin route guard and SHALL use `noindex` for the HTML page. Aggregation and CSV formatting SHALL live in `@unveiled/db` (single-source helper), with the route wiring data and rendering only.

#### Scenario: View tickets sold for a period

- **WHEN** an ADMIN opens the sales-export page and sets a valid `from`/`to` period
- **THEN** a table lists every event with its tickets-sold count for that period

#### Scenario: Filter by event title and partner name

- **WHEN** an ADMIN submits a valid period with `title` and/or `partner` query filters
- **THEN** the table lists only events whose title and/or partner name match (case-insensitive substring)

#### Scenario: Download sales CSV

- **WHEN** an ADMIN requests the export in CSV format for a valid period
- **THEN** the response is `text/csv` with a `Content-Disposition` attachment and one row per event with its tickets-sold count

#### Scenario: CSV respects title and partner filters

- **WHEN** an ADMIN requests CSV with the same `title`/`partner` filters as the HTML view
- **THEN** the attachment includes only matching events

#### Scenario: Cancelled and waitlist bookings excluded

- **WHEN** calculating tickets sold for a period
- **THEN** `CANCELLED` and `WAITLIST` bookings are not counted

#### Scenario: Confirmed and used bookings counted

- **WHEN** calculating tickets sold for a period that includes `CONFIRMED` and `USED` bookings
- **THEN** each such booking’s `tickets_count` is included in the event’s tickets-sold total

#### Scenario: Default period when params omitted

- **WHEN** an ADMIN opens the sales-export page with no `from` or `to` query params
- **THEN** the page applies the default last-30-calendar-days Europe/Berlin window and shows results for that period

#### Scenario: Invalid period rejected

- **WHEN** an ADMIN submits an invalid or inverted `from`/`to` range
- **THEN** the page shows a clear error and does not treat the request as a successful export

#### Scenario: Export is admin-only

- **WHEN** a guest or `USER` requests the sales-export route
- **THEN** access is denied per the existing admin route guard

### Requirement: BDD and e2e cover sales export

The Gherkin feature file and Playwright coverage (or a named deferral) SHALL cover the sales-export page: period selection, per-event tickets-sold table, CSV download, and the ADMIN-only guard, using proximity/layout selectors only per `docs/product/testing/bdd-and-e2e.md`. Scenarios SHALL live in `docs/product/features/admin-partners.feature` (preferred) or a dedicated `docs/product/features/admin-sales-export.feature` with a matching Playwright basename. Coverage-matrix rows SHALL exist for each new scenario with status `pass` or an explicit named deferral (owner/reason). Product sitemap and authorization docs SHALL include `/:locale/admin/partners/export`. Decision log SHALL record the tickets-sold definition (`CONFIRMED`/`USED` by `created_at` in the inclusive Europe/Berlin period).

#### Scenario: Feature file documents sales export

- **WHEN** a reader opens the sales-export feature scenarios after this step
- **THEN** they cover a valid-period table, CSV download, and admin-only access

#### Scenario: Coverage matrix lists sales export

- **WHEN** this feature is marked released
- **THEN** `docs/product/testing/coverage-matrix.md` includes a sales-export row (pass or named deferral)

#### Scenario: Playwright mirrors sales export scenarios

- **WHEN** `bun run test:e2e` runs the Playwright file that maps to the sales-export Gherkin scenarios
- **THEN** each new sales-export Scenario either passes with proximity/layout selectors or is recorded as a named env/harness deferral in the coverage matrix
