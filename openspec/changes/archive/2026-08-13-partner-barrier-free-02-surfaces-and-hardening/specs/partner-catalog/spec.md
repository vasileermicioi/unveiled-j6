## ADDED Requirements

### Requirement: Admin sets barrier-free on the partner form

Admin partner create and edit SHALL include an optional native select for barrier-free accessibility (Yes/No), labeled Barrierefrei / Barrier-free, placed near opening hours. Yes stores `partners.barrier_free = true`. No stores `NULL`. The control SHALL be a native `<select>` (or existing `AdminFormSelect` wrapper), not HeroUI `Select`. Mutations SHALL use the existing SSR form POST partner create/edit routes (no client-only mutation modal). Copy SHALL reuse existing admin Yes/No and barrier-free labels (DE/EN).

#### Scenario: Set barrier-free on create

- **WHEN** I create a partner and set barrier-free to Yes
- **THEN** the partner is stored with barrier_free true

#### Scenario: Clear barrier-free on edit

- **WHEN** I edit a partner and set barrier-free to No
- **THEN** the partner is stored with barrier_free null

#### Scenario: Default is unset

- **WHEN** I create a partner without changing the barrier-free select (No / off)
- **THEN** the partner is stored with barrier_free null

### Requirement: Admin partners feature documents barrier-free

`docs/product/features/admin-partners.feature` SHALL include scenarios titled `Set barrier-free on create` and `Clear barrier-free on edit`. Playwright in `e2e/specs/admin-partners.spec.ts` SHALL use those titles verbatim. Selectors SHALL remain proximity/layout only. Scenarios that create a partner via UI MAY env-skip when R2 vars are missing (logo required).

#### Scenario: Feature file covers set and clear

- **WHEN** a reader follows `admin-partners.feature` after this step
- **THEN** it includes `Set barrier-free on create` and `Clear barrier-free on edit`

#### Scenario: Playwright covers partner barrier-free

- **WHEN** admin partner e2e runs with required env
- **THEN** coverage includes setting Yes on create and No on edit
- **AND** selectors remain proximity/layout only

## MODIFIED Requirements

### Requirement: Optional partner barrier-free flag

The system SHALL persist optional barrier-free accessibility on `partners.barrier_free` as a nullable boolean (`true` or `NULL`). Create MAY omit the field and MUST store `NULL`. Update SHALL accept `true` or `NULL` (clear). A write of `false` SHALL be stored as `NULL`. The system SHALL return `barrierFree` on partner reads used by admin and public event-detail partner fetches (`getPartnerById`, `listPartners`, `listFeaturedPartners`). Barrier-free SHALL NOT be stored on events; `events.barrier_free` SHALL NOT exist after the cutover migration.

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
