## ADDED Requirements

### Requirement: Atomic per-ticket voucher allocation

The Booking domain SHALL allocate exactly one unused inventory asset per ticket for `VOUCHER_PROMO` and `VOUCHER_PDF` events inside the same Postgres transaction that creates the booking and deducts credits/capacity. Allocation SHALL lock candidate `AVAILABLE` inventory rows (using `SELECT … FOR UPDATE SKIP LOCKED` or an equivalent safe lock) and set them to `ALLOCATED` with `booking_ticket_id` pointing at the consuming `booking_tickets` row. When available inventory is less than the requested ticket count, the booking SHALL be rejected with typed error `INSUFFICIENT_VOUCHER_INVENTORY` and MUST NOT change credits, capacity, inventory, ledger, or booking rows.

#### Scenario: Promo codes for a multi-ticket booking

- **WHEN** a member books N tickets on a `VOUCHER_PROMO` event with at least N `AVAILABLE` codes
- **THEN** N distinct codes become `ALLOCATED`
- **AND** each appears on one `booking_tickets` row for that booking
- **AND** credits and remaining capacity decrease by the usual amounts

#### Scenario: PDF vouchers for a multi-ticket booking

- **WHEN** a member books N tickets on a `VOUCHER_PDF` event with at least N `AVAILABLE` PDFs
- **THEN** N distinct PDF inventory rows become `ALLOCATED`
- **AND** each booking ticket references its PDF inventory row for later download

#### Scenario: Insufficient voucher inventory

- **WHEN** available inventory is less than the requested ticket count
- **THEN** the booking is rejected with `INSUFFICIENT_VOUCHER_INVENTORY`
- **AND** no credits, capacity, inventory, or booking rows change

### Requirement: Cancel restocks voucher inventory

Admin cancellation of a confirmed booking SHALL return that booking’s allocated promo codes and PDF vouchers to `AVAILABLE`, clear inventory `booking_ticket_id` links, and clear live redemption payloads on the related `booking_tickets` rows. Credits MUST NOT be auto-refunded. Bookings that are not `CONFIRMED` (including future `USED` check-in) SHALL NOT be cancelled via this path and therefore SHALL NOT restock inventory.

#### Scenario: Cancel returns promo codes

- **WHEN** an admin cancels a confirmed `VOUCHER_PROMO` booking
- **THEN** each allocated code for its booking tickets becomes `AVAILABLE` again
- **AND** remaining capacity increases by the booking’s ticket count as today
- **AND** credits are still not auto-refunded

#### Scenario: Cancel returns PDF vouchers

- **WHEN** an admin cancels a confirmed `VOUCHER_PDF` booking
- **THEN** each allocated PDF inventory row becomes `AVAILABLE` again with `booking_ticket_id` cleared
- **AND** remaining capacity increases by the booking’s ticket count as today

### Requirement: Secret code redemption on booking

For `SECRET_CODE` events, every booking ticket SHALL receive the event’s configured manual secret code (same value for all tickets and bookings). No inventory row is consumed. The booking-level `redemption_*` fields SHALL summarize ticket ordinal 1 for backward-compatible readers until member UI reads per-ticket rows.

#### Scenario: Secret code booking

- **WHEN** a member books any ticket count on a `SECRET_CODE` event with a configured `secret_code`
- **THEN** each booking ticket’s redemption info equals that secret code
- **AND** no `event_voucher_codes` or `event_voucher_pdfs` rows change status

## MODIFIED Requirements

### Requirement: Per-ticket redemption records

The system SHALL record one redemption artifact per ticket on a booking in `booking_tickets` (exported from `@unveiled/db`), with ordinal `1..N` unique per booking and fields for code text and/or PDF reference plus optional voucher URL. For every newly created confirmed booking with `tickets_count = N`, the Booking domain SHALL write exactly N `booking_tickets` rows inside the booking transaction (including `SECRET_CODE` events, which copy the shared event secret onto each ticket without consuming inventory).

#### Scenario: Multi-ticket booking shape

- **WHEN** a booking is created with `tickets_count = N` (N ≥ 1)
- **THEN** exactly N `booking_tickets` rows exist for that booking (ordinal 1..N)
- **AND** each row carries the redemption payload for that ticket (code text and/or PDF reference, plus optional voucher URL)
