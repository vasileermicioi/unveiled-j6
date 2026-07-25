## MODIFIED Requirements

### Requirement: Preference controls are native and localized
Onboarding preference forms SHALL use native HTML form controls (`checkbox`, `radio`, `input`, `select`, `textarea` as applicable) for preference capture — not HeroUI Checkbox/Radio/Switch/NumberField custom chrome. All preference section labels and option values SHALL be available in German and English according to the active URL locale. Stored allowlist keys MAY remain locale-invariant; user-visible labels MUST come from locale copy maps.

#### Scenario: Accessibility preference is a visible native checkbox
- **WHEN** a user reaches the onboarding timing/preferences step
- **THEN** accessibility is a native checkbox with a visible short option label under an accessibility section title
- **AND** the control is operable with keyboard and exposes an accessible name

#### Scenario: Preference options follow locale
- **WHEN** the user views onboarding preferences under `/de/...`
- **THEN** option labels are German (not leftover English-only catalog strings)
- **AND** under `/en/...` the same options are English

#### Scenario: Multi-value preferences use native checkboxes
- **WHEN** a user completes interests, location, or timing onboarding steps
- **THEN** multi-value fields (interests, moods, districts, timing, preferred days, preferred languages) are native checkboxes
- **AND** age group is a native radio (or native select) group
- **AND** travel radius is NOT collected

### Requirement: Localized hangout / district option labels
The system SHALL render onboarding hangout (district) option labels from the active URL locale via `getDistrictLabel`. Stored preference values SHALL be the 12 official Berlin Bezirk names from `@unveiled/auth/constants` `DISTRICTS`. DE and EN labels SHALL use those proper Bezirk names (no informal shorthand keys such as `X-Berg`).

#### Scenario: Location step offers all Berlin Bezirke
- **WHEN** a member views onboarding step 3 (location)
- **THEN** they can multi-select from: Mitte, Friedrichshain-Kreuzberg, Pankow, Charlottenburg-Wilmersdorf, Spandau, Steglitz-Zehlendorf, Tempelhof-Schöneberg, Neukölln, Treptow-Köpenick, Marzahn-Hellersdorf, Lichtenberg, Reinickendorf
- **AND** there is no travel-distance / “how far would you travel” control

#### Scenario: District labels use proper Bezirk names in both locales
- **WHEN** a member views onboarding step 3 under `/en` or `/de`
- **THEN** hangout option labels are the official Bezirk names (e.g. Friedrichshain-Kreuzberg), not informal shorthand (`X-Berg`) or EN-only expansions (`Kreuzberg`)
