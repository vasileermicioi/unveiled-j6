## MODIFIED Requirements

### Requirement: Product schema overview documents location columns

`docs/product/database/schema-overview.md` SHALL document `events.country`, `events.city`, and `events.zip_code` as required location fields (supported defaults/values for this release: `DE` / `berlin` + Berlin PLZ via the postal registry). It SHALL NOT list `events.neighborhood` as a current field. Matching `users.profile` keys `country`, `city`, and `zip_code` SHALL be documented; active `districts` preference arrays SHALL NOT be listed as current fields (legacy `districts` MAY be noted as cleared on write). `users.profile.max_distance` SHALL be documented as an **active** integer kilometers preference collected in onboarding and Vibes (inclusive bounds 1–50 via domain constants), not as legacy/unused, and preference saves SHALL NOT be documented as clearing it to `null` by policy.

#### Scenario: Schema overview events table has country city zip

- **WHEN** an implementer reads the `events` table section in `docs/product/database/schema-overview.md`
- **THEN** `country`, `city`, and `zip_code` are listed
- **AND** `neighborhood` is not listed as a current column

#### Scenario: Schema overview profile keys use location trio

- **WHEN** an implementer reads the `users.profile` field table in `docs/product/database/schema-overview.md`
- **THEN** `country`, `city`, and `zip_code` are listed as location preference keys
- **AND** `districts` is not listed as an active preference array

#### Scenario: Schema overview documents active max_distance

- **WHEN** an implementer reads the `users.profile` field table in `docs/product/database/schema-overview.md`
- **THEN** `max_distance` is listed as integer km collected in onboarding and Vibes
- **AND** the overview does not label `max_distance` as legacy/unused or claim preference saves clear it by policy
