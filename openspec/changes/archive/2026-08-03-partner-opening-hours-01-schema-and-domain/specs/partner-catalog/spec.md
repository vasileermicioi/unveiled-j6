## ADDED Requirements

### Requirement: Partner weekly opening hours

The system SHALL persist optional venue opening hours on `partners` as `has_opening_hours` (boolean, not null, default false) and `opening_hours` (jsonb, nullable). When `has_opening_hours` is false, `opening_hours` MUST be null. When `has_opening_hours` is true, `opening_hours` MUST contain exactly the seven keys `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`, each either `{ "closed": true }` or `{ "open": "HH:MM", "close": "HH:MM" }` with `open` strictly before `close` on the same calendar day. Overnight spans are not supported. Create and update partner domain operations SHALL validate this contract and reject invalid payloads with a catalog validation error. Wall times are Europe/Berlin local times for display purposes (no per-partner timezone column).

#### Scenario: Enable hours with a full week

- **WHEN** an admin creates or updates a partner with `has_opening_hours` true and a valid seven-day schedule
- **THEN** the partner row stores both fields
- **AND** subsequent reads return the same schedule

#### Scenario: Disable hours clears schedule

- **WHEN** an admin updates a partner with `has_opening_hours` false
- **THEN** `opening_hours` is stored as null
- **AND** public consumers MUST treat hours as absent

#### Scenario: Invalid range rejected

- **WHEN** a day has `open` greater than or equal to `close`, or a day key is missing while hours are enabled
- **THEN** the write is rejected without partial persistence of an invalid schedule
