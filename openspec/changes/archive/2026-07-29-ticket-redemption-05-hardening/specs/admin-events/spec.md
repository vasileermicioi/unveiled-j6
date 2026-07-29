## ADDED Requirements

### Requirement: Product Gherkin admin redemption matches inventory model

`docs/product/features/admin-events.feature` SHALL document create/edit redemption configuration for `SECRET_CODE` (manual `secretCode` only), `VOUCHER_PROMO` (promo inventory payload + `eventWebsiteUrl`), and `VOUCHER_PDF` (PDF ticket inventory). It SHALL NOT require `secret code mode`, auto-generated shared codes, or a single `promoCode` field as the voucher source. Default create values SHALL NOT include `secretCodeMode`. Inventory upload/preview/save and edit inventory summary behavior SHALL match the shipped admin UI.

#### Scenario: Admin feature file drops secret-code modes

- **WHEN** an implementer reads `admin-events.feature` after this change
- **THEN** redemption validation examples use `SECRET_CODE` / `VOUCHER_PROMO` / `VOUCHER_PDF` without a mode column
- **AND** no Scenario requires `SHARED_GENERATED` code generation

#### Scenario: Admin defaults omit secretCodeMode

- **WHEN** the default-values scenario is read
- **THEN** defaults describe `ticketType` `SECRET_CODE` (and capacity/timing as today) without `secretCodeMode`
