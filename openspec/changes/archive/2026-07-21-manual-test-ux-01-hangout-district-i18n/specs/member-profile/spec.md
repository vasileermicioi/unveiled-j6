## ADDED Requirements

### Requirement: Profile hangout labels share onboarding district maps
The cultural preferences editor at `/:locale/profile/preferences` SHALL render hangout (district) option labels via the same `getDistrictLabel` locale maps as onboarding. German UI SHALL show Berlin shorthand for `X-Berg`, `P-Berg`, and `F-Hain`; English UI SHALL show expanded district names. Stored values SHALL remain allowlist keys.

#### Scenario: Profile preferences hangout chips follow locale
- **WHEN** a member views `/en/profile/preferences`
- **THEN** hangout options use expanded labels (e.g. Kreuzberg)
- **AND** under `/de/profile/preferences` the X-Berg, P-Berg, and F-Hain options show Berlin shorthand
