## MODIFIED Requirements

### Requirement: Redemption info by ticket type

The system SHALL attach redemption info to each confirmed booking according to the event's ticket type. For `SECRET_CODE`, the booking SHALL store the event's admin-configured `secret_code` as redemption info (no secret-code modes; codes are never auto-generated). For `VOUCHER_PROMO` and `VOUCHER_PDF`, confirmed bookings SHALL obtain redemption artifacts from inventory allocation (one asset per ticket). Until inventory allocation is implemented, the booking domain SHALL reject voucher-type bookings with a typed error and MUST NOT invent redemption from a shared event-level `promo_code`.

#### Scenario: Manual secret code

- **WHEN** a booking is confirmed for `SECRET_CODE`
- **THEN** the booking stores the event's admin-configured secret code as redemption info

#### Scenario: Voucher booking rejected without allocation

- **WHEN** a booking is attempted for `VOUCHER_PROMO` or `VOUCHER_PDF` before inventory allocation is wired
- **THEN** the booking is rejected with a typed booking error and no credits, capacity, or ledger changes occur
