## ADDED Requirements

### Requirement: Admin featured events tab

The system SHALL provide an ADMIN-only Featured tab to curate which catalog events appear on Discover. The tab SHALL be reachable from admin chrome under `/:locale/admin/featured` (locale-prefixed). Mutations SHALL use dedicated SSR pages with form POST only (no client-only add/remove modals). Removing a featured membership SHALL delete only the `featured_events` row and SHALL NOT delete the underlying catalog `events` row.

#### Scenario: List featured events

- **WHEN** an admin opens `/:locale/admin/featured`
- **THEN** they see the current featured list ordered by `sort_order`
- **AND** each row shows at least title, partner, and date/time

#### Scenario: Add by searching existing events

- **WHEN** an admin searches on the featured add page (`/:locale/admin/featured/add?q=`)
- **THEN** they see matching catalog events that are not already featured
- **AND** submitting add creates a featured row for that event
- **AND** the admin is redirected to the featured list

#### Scenario: Remove from featured keeps the event

- **WHEN** an admin confirms remove on `/:locale/admin/featured/:eventId/remove`
- **THEN** the event disappears from the featured list
- **AND** the event remains available in `/:locale/admin/events`

#### Scenario: Non-admin cannot open featured routes

- **WHEN** a USER or unauthenticated visitor requests `/:locale/admin/featured`
- **THEN** access is denied per existing admin route guards (redirect or forbidden consistent with other `/admin/*` routes)

#### Scenario: Empty featured list

- **WHEN** an admin opens `/:locale/admin/featured` and no featured rows exist
- **THEN** they see an empty state and a path to add featured events
