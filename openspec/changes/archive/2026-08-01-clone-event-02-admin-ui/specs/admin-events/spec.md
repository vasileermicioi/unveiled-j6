## ADDED Requirements

### Requirement: Admin clones an event
Admins SHALL clone an existing event via a dedicated SSR page `/:locale/admin/events/:id/clone` with form POST (no client-only modal). The form SHALL be prefilled from the source event (at least a source summary and a date/time control) and SHALL require a date/time for the new occurrence. Primary image upload SHALL NOT be required on clone (source image id is reused by the catalog clone operation). For `VOUCHER_PROMO` or `VOUCHER_PDF` source events, the clone form SHALL require new redemption inventory using create-mode semantics. On success, a new catalog event exists and the admin is redirected to a sensible admin events surface (edit of the new event or the events list). Entry points SHALL exist on the Events list and/or event edit page. The admin Events UI SHALL NOT offer series create.

#### Scenario: Clone event from catalog list
- **WHEN** an admin opens clone for an existing event, sets a new date/time, and confirms
- **THEN** a new event appears in the catalog with the copied title and new date/time

#### Scenario: Clone voucher event requires inventory
- **WHEN** an admin clones a `VOUCHER_PROMO` or `VOUCHER_PDF` event without providing new inventory
- **THEN** the clone is rejected until inventory is provided

#### Scenario: Clone entry points visible
- **WHEN** an admin views the Events list or an event edit page
- **THEN** a Clone action linking to `/:locale/admin/events/:id/clone` is available
- **AND** no Event series create CTA is shown

## REMOVED Requirements

### Requirement: Create an event series with manual slots
**Reason:** Product replaces multi-slot series create with single-event clone.
**Migration:** Use `/:locale/admin/events/:id/clone` (and catalog `cloneEvent`) for additional occurrences.

### Requirement: Create an event series with a date-range builder
**Reason:** Date-range / weekday series builder UI is removed with series create.
**Migration:** Clone individual events with explicit date/time overrides.

### Requirement: Series create uses the same Markdown description editor
**Reason:** Series create surface is removed; Markdown editor remains on create/edit (and clone does not re-author description — domain copies source Markdown).
**Migration:** Edit the cloned event if description changes are needed.

### Requirement: Failed series create keeps event image for retry
**Reason:** Series create path removed; image retry semantics for series no longer apply.
**Migration:** Clone reuses source primary image id; create/edit retain their existing image staging rules.

### Requirement: Series weekdays use checkbox multi-select
**Reason:** Series builder weekday controls are removed with the series form.
**Migration:** No weekday multi-select on clone; date/time is a single occurrence field.
