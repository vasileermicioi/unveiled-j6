## ADDED Requirements

### Requirement: Admin partner form opening hours toggle

Admin partner create and edit pages SHALL include a native checkbox to enable opening hours. When checked, the form SHALL show one row per weekday (Monday–Sunday) with a native “closed” checkbox and native time inputs for open and close. When unchecked, weekday controls are hidden or ignored and the submitted write clears stored hours per domain rules. Mutations SHALL use the existing SSR form POST partner create/edit routes (no client-only mutation modal). Copy SHALL be available in DE and EN.

#### Scenario: Toggle reveals weekday rows

- **WHEN** an admin checks the opening-hours toggle on create or edit
- **THEN** seven weekday rows appear for open/close (or closed)

#### Scenario: Save enabled hours

- **WHEN** an admin submits a valid enabled schedule
- **THEN** the partner is saved with `has_opening_hours` true and the weekly JSON

#### Scenario: Uncheck clears public hours

- **WHEN** an admin unchecks the toggle and saves
- **THEN** the partner is saved with hours disabled and no schedule for public display
