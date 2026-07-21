## ADDED Requirements

### Requirement: Admin event form select controls

Admin event create/edit and series forms SHALL use native HTML `<select>` (or native checkbox groups for multi-value fields) for partner, category, event type, timing mode, ticket type, secret-code mode, barrier-free, languages, and target age groups. HeroUI `Select` / `ListBox` SHALL NOT be required for those fields. SSR field names and validation remain unchanged. Native selects SHALL be associated with an accessible label and MAY be wrapped in HeroUI `Label` / `Surface` / `Field` chrome. Theme styling SHALL use shared admin native select classes from `globals.css` (e.g. `.admin-native-select`).

#### Scenario: Partner field is a native select

- **WHEN** an admin opens Create Event
- **THEN** the Partner control is a native HTML select (or equivalent native multi pattern) associated with an accessible label

#### Scenario: Multi-value fields post the same array names

- **WHEN** an admin submits languages or target age groups
- **THEN** the POST body still carries the existing array field names accepted by admin parsers

#### Scenario: Category and event type remain native selects

- **WHEN** an admin opens Create Event or Edit Event
- **THEN** category and event type are native HTML selects (or documented native multi pattern) with unchanged `name` attributes

## MODIFIED Requirements

### Requirement: Admin event languages and age groups multi-select

The admin event form SHALL capture `languages` and `target_age_groups` as multi-value fields with predefined options, not comma-separated free text. Controls SHALL be native HTML (`<select multiple>` or a native checkbox group) posting the same array field names (`languages`, `target_age_groups`) accepted by admin parsers. Submitted values SHALL persist to the existing `text[]` and enum-array columns respectively. HeroUI `Select` / `ListBox` SHALL NOT be required for these fields.

#### Scenario: Admin selects multiple languages

- **WHEN** an ADMIN selects German and English in the languages multi-value control and submits a valid form
- **THEN** the event row stores both language codes in `languages`

#### Scenario: Admin selects multiple age groups

- **WHEN** an ADMIN selects two or more target age group options and submits a valid form
- **THEN** the event row stores the selected values in `target_age_groups`

#### Scenario: Multi-value POST field names unchanged

- **WHEN** an ADMIN submits languages and target age groups via the native multi-value controls
- **THEN** the request body still uses the `languages` and `target_age_groups` array field names

### Requirement: Admin event series confirm survives preview remount

When an ADMIN creates an event series via `/admin/events/series/new`, the confirm POST after preview SHALL include the partner id, redemption configuration, and event image required by `createEventSeries`, even if the client remounts the form tree between preview and confirm. Required select values SHALL be carried by named native form controls (or equivalent named inputs), not by ephemeral display-only widget state. Playwright scenarios for manual-slot and date-range series creation SHALL assert successful create (redirect to the admin events list and visible event titles), not the preview step alone.

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

## REMOVED Requirements

### Requirement: Admin event form HeroUI-first controls

**Reason:** Superseded by native-first form-control policy (platform-foundation / AGENTS §14) and the new `Admin event form select controls` requirement. Event date/time already use native `input type="date|time"`; admin choice fields move to native `<select>` in this change.

**Migration:** Use native `<select>` (and native multi pattern) via `AdminFormSelect` with `.admin-native-select`; keep HeroUI for text fields, labels, buttons, and layout; keep documented exceptions (image Pica, geo/map, better-auth-ui).
