## MODIFIED Requirements

### Requirement: Product schema overview documents location columns

`docs/product/database/schema-overview.md` SHALL document `events.country`, `events.city`, and `events.zip_code` as required location fields (supported defaults/values for this release: `DE` / `berlin` + Berlin PLZ via the postal registry). It SHALL NOT list `events.neighborhood` as a current field. Matching `users.profile` keys `country`, `city`, and `zip_code` SHALL be documented; active `districts` preference arrays SHALL NOT be listed as current fields (legacy `districts` MAY be noted as cleared on write). `users.profile.max_distance` SHALL be documented as optional **legacy** JSONB (integer km when present), not as an active onboarding/Vibes preference; preference/location saves SHALL be documented as leaving it untouched (neither required nor cleared by policy).

#### Scenario: Schema overview events table has country city zip

- **WHEN** an implementer reads the `events` table section in `docs/product/database/schema-overview.md`
- **THEN** `country`, `city`, and `zip_code` are listed
- **AND** `neighborhood` is not listed as a current column

#### Scenario: Schema overview profile keys use location trio

- **WHEN** an implementer reads the `users.profile` field table in `docs/product/database/schema-overview.md`
- **THEN** `country`, `city`, and `zip_code` are listed as location preference keys
- **AND** `districts` is not listed as an active preference array

#### Scenario: Schema overview documents max_distance as legacy remnant

- **WHEN** an implementer reads the `users.profile` field table in `docs/product/database/schema-overview.md`
- **THEN** `max_distance` is listed as optional legacy JSONB (not collected in onboarding/Vibes)
- **AND** the overview does not claim `max_distance` is an active preference required on location saves
