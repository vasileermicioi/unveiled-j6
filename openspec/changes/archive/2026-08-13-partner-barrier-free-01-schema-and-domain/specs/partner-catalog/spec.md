## ADDED Requirements

### Requirement: Optional partner barrier-free flag

The system SHALL persist optional barrier-free accessibility on `partners.barrier_free` as a nullable boolean (`true` or `NULL`). Create MAY omit the field and MUST store `NULL`. Update SHALL accept `true` or `NULL` (clear). A write of `false` SHALL be stored as `NULL`. The system SHALL return `barrierFree` on partner reads used by admin and public event-detail partner fetches (`getPartnerById`, `listPartners`, `listFeaturedPartners`). Partner writes SHALL NOT update `events.barrier_free`.

#### Scenario: Create partner omits barrier-free

- **WHEN** an admin creates a partner without a barrier-free value
- **THEN** `partners.barrier_free` is `NULL`

#### Scenario: Create partner sets barrier-free

- **WHEN** an admin creates a partner with barrier-free true
- **THEN** `partners.barrier_free` is true
- **AND** subsequent `getPartnerById` and `listPartners` results include `barrierFree` true

#### Scenario: Update partner sets barrier-free

- **WHEN** an admin updates a partner with barrier-free true
- **THEN** `partners.barrier_free` is true

#### Scenario: Update partner clears barrier-free

- **WHEN** an admin updates a partner with barrier-free null
- **THEN** `partners.barrier_free` is `NULL`

#### Scenario: Update omits barrier-free leaves existing value

- **WHEN** an admin updates other partner fields without sending barrier-free
- **THEN** `partners.barrier_free` is unchanged

#### Scenario: Partner write does not change event barrier-free

- **WHEN** an admin sets or clears partner barrier-free
- **THEN** existing `events.barrier_free` values for that partner are left unchanged
