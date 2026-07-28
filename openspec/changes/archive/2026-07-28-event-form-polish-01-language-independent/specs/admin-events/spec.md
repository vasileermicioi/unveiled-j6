## ADDED Requirements

### Requirement: Language-independent event option
The system SHALL allow ADMIN to mark an event as language-independent on create, edit, and series-create forms. The control SHALL be a native HTML checkbox labeled for humans as **Language-independent** (DE: **Sprachunabhängig**), with short helper copy that this is for events with no spoken-language requirement (e.g. art exhibitions). When the option is checked, the languages multi-select SHALL be hidden and MUST NOT be required. Persisted state SHALL set `language_independent = true` and `languages = null`. When unchecked, the existing searchable languages multi-select behavior SHALL remain available. Catalog create/update SHALL coerce `languages` to null whenever `language_independent` is true, even if the form POST still includes language values.

#### Scenario: Check language-independent hides languages picker
- **WHEN** an admin opens create or edit event (or series create)
- **AND** checks Language-independent
- **THEN** the languages multi-select is not shown
- **AND** saving stores language-independent true with no language list

#### Scenario: Uncheck language-independent restores languages picker
- **WHEN** an admin clears Language-independent on edit
- **THEN** the languages multi-select is shown again
- **AND** they may select zero or more languages as today

#### Scenario: Domain coerces languages when flag is true
- **WHEN** create or update event is called with `language_independent = true` and a non-empty languages array
- **THEN** the persisted event has `language_independent = true` and `languages = null`

## MODIFIED Requirements

### Requirement: Multi-value event metadata uses checkbox multi-selects
The admin event create/edit form SHALL collect supported languages via a searchable native-checkbox multi-select (same interaction model as onboarding preferred languages) and target age groups via a native-checkbox multi-select without a search filter, except that when Language-independent is checked the languages multi-select SHALL NOT be shown or required. Series builder weekday selection SHALL use a native-checkbox multi-select without search. Single-value choice fields SHALL continue to use a native HTML `select`. Supported languages and language-independent are mutually exclusive in the UI: language-independent checked means languages are not collected.

#### Scenario: Languages multi-select with search
- **WHEN** an admin opens create or edit event
- **AND** Language-independent is unchecked
- **THEN** languages are chosen with checkboxes and a search filter that narrows visible options without dropping already-selected values from the POST payload

#### Scenario: Age groups multi-select without search
- **WHEN** an admin opens create or edit event
- **THEN** target age groups are chosen with checkboxes and no search filter control

#### Scenario: Series weekdays use checkbox multi-select
- **WHEN** an admin opens the series create form
- **THEN** builder weekdays are chosen with checkboxes and no search filter control
- **AND** single-value fields on the form continue to use a native HTML `select`
