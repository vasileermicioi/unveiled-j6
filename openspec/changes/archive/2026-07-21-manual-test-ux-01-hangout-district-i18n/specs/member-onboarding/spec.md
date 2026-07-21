## ADDED Requirements

### Requirement: Localized hangout / district option labels
The system SHALL render onboarding hangout (district) option labels from the active URL locale via `getDistrictLabel`. German UI SHALL use Berlin shorthand for `X-Berg`, `P-Berg`, and `F-Hain`. English UI SHALL use expanded district names (`Kreuzberg`, `Prenzlauer Berg`, `Friedrichshain`). Stored preference values SHALL remain the allowlist keys from `@unveiled/auth/constants`.

#### Scenario: EN hangout chips use expanded names
- **WHEN** a member views onboarding step 3 (location) under `/en`
- **THEN** the hangout options show expanded English-facing labels (e.g. Kreuzberg), not the DE shorthand set

#### Scenario: DE hangout chips use Berlin shorthand
- **WHEN** a member views the same step under `/de`
- **THEN** the hangout options for X-Berg, P-Berg, and F-Hain show the Berlin shorthand labels
