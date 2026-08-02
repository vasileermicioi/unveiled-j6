## ADDED Requirements

### Requirement: Structured partner location fields

Partners SHALL use the same minimal structured location model as events: required `street` and `house_number`, optional `address_line2`, plus `country` / `city` / `zip_code` with the same Berlin postal validation (`validatePostalCode`) and defaults (`DE` / `berlin`) for this release. Partner create/update SHALL compose display `address` on write from those fields. Structured partner location SHALL be available for add-only event form prefill field-by-field. The system SHALL NOT store partner neighborhood/Bezirk as a separate field.

#### Scenario: Create partner requires street house and Berlin zip

- **WHEN** `createPartner` is called without street, house number, or a valid Berlin zip
- **THEN** the create is rejected

#### Scenario: Create partner composes display address

- **WHEN** `createPartner` succeeds with structured location fields
- **THEN** the partner row stores those fields and a composed display `address`

#### Scenario: Partner structured fields support event prefill

- **WHEN** an admin on the new-event form selects a partner with structured location stored
- **THEN** the event form can copy street, house number, optional line2, and zip from that partner
