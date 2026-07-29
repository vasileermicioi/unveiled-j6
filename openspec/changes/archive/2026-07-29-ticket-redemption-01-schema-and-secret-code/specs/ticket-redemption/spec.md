## ADDED Requirements

### Requirement: Voucher inventory tables

The system SHALL store redeemable voucher assets per event in dedicated inventory tables in `public`, not as a single shared `promo_code` on the event used as the redemption source for new writes. Promo-code inventory SHALL live in `event_voucher_codes`. PDF voucher inventory SHALL live in `event_voucher_pdfs` (R2 object key + metadata). Each inventory row SHALL have status `AVAILABLE` or `ALLOCATED`. An allocated row SHALL reference the `booking_tickets` row that consumed it (nullable until allocation). Schema and types SHALL be exported from `@unveiled/db`.

#### Scenario: Promo code inventory row

- **WHEN** an admin persists promo codes for a `VOUCHER_PROMO` event
- **THEN** each code is stored as its own `event_voucher_codes` inventory row with status `AVAILABLE` or `ALLOCATED`
- **AND** an allocated row references the booking ticket that consumed it

#### Scenario: PDF voucher inventory row

- **WHEN** an admin persists sliced ticket PDFs for a `VOUCHER_PDF` event
- **THEN** each ticket PDF is stored as its own `event_voucher_pdfs` inventory row (R2 object key + metadata) with status `AVAILABLE` or `ALLOCATED`
- **AND** an allocated row references the booking ticket that consumed it

### Requirement: Per-ticket redemption records

The system SHALL provide a `booking_tickets` table (exported from `@unveiled/db`) that records one redemption artifact per ticket on a booking, with ordinal `1..N` unique per booking and fields for code text and/or PDF reference plus optional voucher URL. Writers that create N rows for `tickets_count = N` MAY land in a later step; this requirement is satisfied by schema + types existing and being migratable.

#### Scenario: Multi-ticket booking shape

- **WHEN** a booking is created with `tickets_count = N` (N ≥ 1) and per-ticket rows are written (allocation step or later)
- **THEN** exactly N `booking_tickets` rows exist for that booking (ordinal 1..N)
- **AND** each row carries the redemption payload for that ticket (code text and/or PDF reference, plus optional voucher URL)

### Requirement: Ticket types and secret codes

The system SHALL support ticket types `SECRET_CODE`, `VOUCHER_PROMO`, and `VOUCHER_PDF` only. Secret-code events SHALL always use a single admin-configured manual `secret_code` shared by all bookings of that event. The system SHALL NOT store or accept `secret_code_mode`. Legacy rows with `ticket_type = VOUCHER` SHALL migrate to `VOUCHER_PROMO`. Legacy non-empty `promo_code` values SHALL seed at most one `AVAILABLE` inventory row (not duplicated to capacity); new event writes SHALL NOT require or persist event-level `promo_code` as the voucher redemption source.

#### Scenario: Secret code has no mode

- **WHEN** an admin creates or edits a `SECRET_CODE` event
- **THEN** the only redemption field required is `secret_code`
- **AND** no `secret_code_mode` value is stored or accepted

#### Scenario: Legacy voucher migration

- **WHEN** existing rows with `ticket_type = VOUCHER` are migrated
- **THEN** they become `VOUCHER_PROMO`
- **AND** a non-empty legacy `promo_code` becomes at most one `event_voucher_codes` row (or remains for admin re-upload if empty)

## REMOVED Requirements

### Requirement: Secret code modes SHARED_GENERATED and UNIQUE_PER_BOOKING

**Reason:** Product removed auto-generated secret codes; all SECRET_CODE events use one admin-configured manual code.

**Migration:** Drop `secret_code_mode` column/enum; update `resolveRedemption` and admin parsers to use `events.secret_code` only; delete unit tests that assert SHARED_GENERATED / UNIQUE_PER_BOOKING behavior.

### Requirement: Single event-level promo_code as the voucher redemption source

**Reason:** Replaced by promo inventory allocation (`event_voucher_codes`).

**Migration:** Stop requiring/writing `promo_code` on create/update; migrate legacy values per Ticket types and secret codes; booking allocation of inventory codes is step 02.
