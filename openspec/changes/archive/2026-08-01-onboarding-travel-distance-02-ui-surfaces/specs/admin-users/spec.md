## MODIFIED Requirements

### Requirement: Admin member detail preference intel matches preference options

The Membership HQ detail page at `/:locale/admin/users/:id` SHALL present member preference intel using the shipped allowlists and fields: location as stored `country` / `city` / `zip_code` (Germany/Berlin + Berlin PLZ for this release) instead of a districts multi-select list; preferred languages from the member language catalog (not Non-Verbal); `interests_other` when set (per existing interests_other requirement). The preference row label SHALL describe zip/location (not “Districts” / “Bezirke”). When `max_distance` is non-null, Membership HQ detail SHALL show the travel distance in kilometers. When `max_distance` is null (legacy users), the travel-distance / radius row MUST be omitted or shown as unset — the page MUST NOT invent a numeric value. The page MUST NOT invent Bezirk multi-select chrome or informal district shorthand labels for missing data.

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
