## ADDED Requirements

### Requirement: Admin event series confirm survives preview remount

When an ADMIN creates an event series via `/admin/events/series/new`, the confirm POST after preview SHALL include the partner id, redemption configuration, and event image required by `createEventSeries`, even if the client remounts the form tree between preview and confirm. Uncontrolled HeroUI Select display state alone SHALL NOT be the sole carrier of required select values on confirm. Playwright scenarios for manual-slot and date-range series creation SHALL assert successful create (redirect to the admin events list and visible event titles), not the preview step alone.

#### Scenario: Manual series confirm creates events

- **WHEN** an ADMIN configures a series with manual slots, previews, re-attaches a required image if needed, and confirms
- **THEN** one event is created per slot
- **AND** the events appear on `/admin/events`

#### Scenario: Date-range series confirm creates events

- **WHEN** an ADMIN configures a series with the date-range builder, previews, re-attaches a required image if needed, and confirms
- **THEN** events for the generated slots are created
- **AND** the events appear on `/admin/events`

#### Scenario: Confirm does not drop partner_id after remount

- **WHEN** the series form remounts between preview and confirm with a previously chosen partner
- **THEN** the confirm POST still includes a non-empty `partner_id` matching that partner
