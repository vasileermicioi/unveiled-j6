## ADDED Requirements

### Requirement: Multi-value event metadata uses checkbox multi-selects
The admin event create/edit form SHALL collect supported languages via a searchable native-checkbox multi-select (same interaction model as onboarding preferred languages) and target age groups via a native-checkbox multi-select without a search filter. Series builder weekday selection SHALL use a native-checkbox multi-select without search. Single-value choice fields SHALL continue to use a native HTML `select`.

#### Scenario: Languages multi-select with search
- **WHEN** an admin opens create or edit event
- **THEN** languages are chosen with checkboxes and a search filter that narrows visible options without dropping already-selected values from the POST payload

#### Scenario: Age groups multi-select without search
- **WHEN** an admin opens create or edit event
- **THEN** target age groups are chosen with checkboxes and no search filter control

#### Scenario: Series weekdays use checkbox multi-select
- **WHEN** an admin opens the series create form
- **THEN** builder weekdays are chosen with checkboxes and no search filter control
- **AND** single-value fields on the form continue to use a native HTML `select`

### Requirement: Partner location prefill on add only
When creating a single event or an event series, changing the partner control SHALL prefill the event address from that partner's stored address and SHALL attempt to update the map location from that address. When editing an existing event, changing the partner control SHALL NOT overwrite the event address or map coordinates.

#### Scenario: Add event prefills address and map from partner
- **WHEN** an admin on the new-event (or series-create) form selects a partner from the dropdown
- **THEN** the address field is set to that partner's address
- **AND** the map pin updates to a geocode of that address when geocoding succeeds

#### Scenario: Edit event keeps existing location when partner changes
- **WHEN** an admin on the edit-event form changes the partner
- **THEN** the existing address and map coordinates remain unchanged until the admin edits them manually

#### Scenario: Geocode soft-fails leave address filled
- **WHEN** an admin on the new-event form selects a partner whose address cannot be geocoded
- **THEN** the address field is still set to that partner's address
- **AND** the map location is left unchanged (or at its prior default)
