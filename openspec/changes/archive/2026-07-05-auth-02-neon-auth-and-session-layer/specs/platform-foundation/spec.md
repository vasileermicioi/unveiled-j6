## MODIFIED Requirements

### Requirement: Phase 0 package scope

During Phase 2 auth step 02, `packages/` SHALL include `config/`, `db/`, and `auth/`. Billing, images, and UI packages are not created until their respective phases.

#### Scenario: Package directory listing after auth step 02

- **WHEN** auth step 02 is complete
- **THEN** `packages/` contains `config/`, `db/`, and `auth/` and no other domain packages
