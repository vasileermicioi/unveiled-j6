## ADDED Requirements

### Requirement: Filter by category

The member feed and map category filter SHALL use `EVENT_CATEGORIES` keys as option values and locale labels as visible text, in the taxonomy table order. Filtering SHALL match `events.category` to the key. Legacy query values from member `INTERESTS` (`Theater`, `Kino`, `Museum`, `Ausstellung`, `Konzert`, `Talk/Lesung`, `Comedy`, `Tanz/Performance`, `Other`) SHALL be rewritten to the mapped keys from the parent guide so old URLs keep working. Unknown category query values SHALL be left unchanged and SHALL still filter by exact match (matching nothing when no row stores that string). Allowlisted keys in the query SHALL pass through unchanged.

#### Scenario: Filter by category

- **WHEN** I select a category filter (locale label)
- **THEN** only events whose stored category key matches that option are shown

#### Scenario: Legacy category query still filters

- **WHEN** the feed URL is `?category=Theater`
- **THEN** the parsed filter is `theater`
- **AND** events stored as `theater` are shown

#### Scenario: Legacy Kino query maps to cinema

- **WHEN** the feed or map URL is `?category=Kino`
- **THEN** the parsed filter is `cinema`
- **AND** events stored as `cinema` are shown

#### Scenario: Unknown category query matches nothing

- **WHEN** the feed URL is `?category=NotARealCategory`
- **THEN** the parsed filter is `NotARealCategory`
- **AND** no events are shown unless a row stores that exact string

#### Scenario: Category options use keys and locale labels in table order

- **WHEN** a booking-eligible member opens the feed or map filter
- **THEN** each category option value is an `EVENT_CATEGORIES` key
- **AND** the visible option text is that key’s label for the active locale
- **AND** option order matches the parent taxonomy table (not alphabetical, not onboarding `INTERESTS` order)
