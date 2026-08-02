## MODIFIED Requirements

### Requirement: Admin member detail preference intel matches preference options

The Membership HQ detail page at `/:locale/admin/users/:id` SHALL present member preference intel using the shipped allowlists and fields: location as stored `country` / `city` / `zip_code` (Germany/Berlin + Berlin PLZ for this release) instead of a districts multi-select list; preferred languages from the member language catalog (not Non-Verbal); `interests_other` when set (per existing interests_other requirement). The preference row label SHALL describe zip/location (not “Districts” / “Bezirke”). When legacy `max_distance` is non-null, Membership HQ detail SHALL show the travel distance in kilometers as remnant intel. When `max_distance` is null, the travel-distance / radius row MUST be omitted or shown as unset — the page MUST NOT invent a numeric value. The page MUST NOT invent Bezirk multi-select chrome or informal district shorthand labels for missing data.

#### Scenario: Detail shows travel distance when set

- **WHEN** an admin opens a member detail page for a user whose `max_distance` is a stored integer km
- **THEN** the preferences section shows the travel distance in km

#### Scenario: Detail omits null travel distance

- **WHEN** an admin opens a member detail page for a user whose `max_distance` is null
- **THEN** the preferences section does not show travel distance / radius as an active preference with an invented value

#### Scenario: Detail shows zip location and languages

- **WHEN** an admin opens a member detail page for a user with a Berlin `zip_code` under Germany/Berlin and preferred language codes from the member catalog
- **THEN** the stored zip (and country/city when shown) and language values are visible in the preferences section
- **AND** the page does not present a districts multi-select list as the location preference
- **AND** the page does not invent Non-Verbal or informal district shorthand labels for missing data

### Requirement: Product Gherkin and e2e match zip preference intel

`docs/product/features/admin-users.feature` and `e2e/specs/admin-users.spec.ts` SHALL describe Membership HQ member detail preference intel using location as stored `country` / `city` / `zip_code` (Germany/Berlin + Berlin PLZ for this release), not a districts multi-select list, and optional legacy travel distance when `max_distance` is non-null. Scenarios SHALL note that null `max_distance` means no travel-distance row (omit or unset — MUST NOT invent a value) and that `max_distance` is not actively collected in onboarding/Vibes. Playwright titles SHALL match Gherkin verbatim; selectors SHALL remain proximity/layout only. Coverage-matrix rows SHALL be updated (pass or named skip).

#### Scenario: Admin-users feature file describes zip and optional legacy travel-distance intel

- **WHEN** an implementer reads the expand-detail / intel scenario in `docs/product/features/admin-users.feature`
- **THEN** preferences include zip/location (and country/city when shown) instead of districts
- **AND** the scenario states that when `max_distance` is null there is no travel-distance / radius preference row
- **AND** the scenario treats non-null `max_distance` as legacy remnant intel (not an actively collected preference)

#### Scenario: Admin-users e2e asserts zip preference row

- **WHEN** Playwright runs the expand-detail / intel scenario against a member with a Berlin zip
- **THEN** the detail preferences section shows the zip (and does not present a districts multi-select list as location)

#### Scenario: Admin-users docs allow legacy travel distance when set

- **WHEN** an implementer reads admin-users product Gherkin and coverage-matrix notes after this step
- **THEN** showing travel distance in km for non-null `max_distance` remains consistent with shipped Membership HQ intel
- **AND** notes do not claim travel distance is still collected in onboarding or Vibes
