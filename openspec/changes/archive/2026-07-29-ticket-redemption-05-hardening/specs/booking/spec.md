## ADDED Requirements

### Requirement: Product Gherkin redemption matches inventory model

`docs/product/features/booking.feature` SHALL document redemption for `SECRET_CODE` (admin-configured manual code only), `VOUCHER_PROMO` (one inventory code per ticket plus partner website when present), and `VOUCHER_PDF` (one inventory PDF per ticket with in-app download). It SHALL NOT document `secret_code_mode`, `SHARED_GENERATED`, `UNIQUE_PER_BOOKING`, or a single shared event-level `promo_code` as the voucher source. Scenarios SHALL cover insufficient voucher inventory rejection, admin cancel restock (credits not refunded), and member post-booking actions including mask/reveal and PDF download.

#### Scenario: Booking feature file has no generated modes

- **WHEN** an implementer reads `booking.feature` after this change
- **THEN** redemption examples list only the three shipped ticket types
- **AND** no Scenario requires `SHARED_GENERATED` or `UNIQUE_PER_BOOKING`

#### Scenario: Member redemption UI scenarios are specified

- **WHEN** an implementer reads post-booking / My Tickets scenarios in `booking.feature`
- **THEN** they describe masked codes with reveal/hide, per-ticket rows for multi-ticket bookings, and PDF download for `VOUCHER_PDF`
