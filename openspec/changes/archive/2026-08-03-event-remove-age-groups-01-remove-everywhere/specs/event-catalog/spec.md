## MODIFIED Requirements

### Requirement: Admin event form select controls

Admin event create/edit and clone forms SHALL use native HTML `<select>` (or native checkbox groups for multi-value fields) for partner, category, event type, timing mode, ticket type, secret-code mode, barrier-free, languages, and subtitle language where those fields appear. HeroUI `Select` / `ListBox` SHALL NOT be required for those fields. SSR field names and validation remain unchanged except that `target_age_groups` is no longer a form field. Native selects SHALL be associated with an accessible label and MAY be wrapped in HeroUI `Label` / `Surface` / `Field` chrome. Theme styling SHALL use shared admin native select classes from `globals.css` (e.g. `.admin-native-select`). Series create forms SHALL NOT be documented or offered.

#### Scenario: Partner field is a native select

- **WHEN** an admin opens Create Event
- **THEN** the Partner control is a native HTML select (or equivalent native multi pattern) associated with an accessible label

#### Scenario: Multi-value language fields post the same array names

- **WHEN** an admin submits languages
- **THEN** the POST body still carries the existing `languages` array field name accepted by admin parsers

#### Scenario: Category and event type remain native selects

- **WHEN** an admin opens Create Event or Edit Event
- **THEN** category and event type are native HTML selects (or documented native multi pattern) with unchanged `name` attributes

#### Scenario: Target age groups are not a form control

- **WHEN** an admin opens Create Event, Edit Event, or Clone Event
- **THEN** no target age groups control is shown
- **AND** create/update/clone do not write `target_age_groups`

## ADDED Requirements

### Requirement: Admin event languages multi-select

The admin event form SHALL capture `languages` as a multi-value field with predefined options, not comma-separated free text. It SHALL use a native checkbox multi-select posting the existing array field name (`languages`). Submitted values SHALL persist to the existing `text[]` column. The form SHALL NOT capture `target_age_groups`.

#### Scenario: Admin selects multiple languages

- **WHEN** an ADMIN selects German and English in the languages multi-value control and submits a valid form
- **THEN** the event row stores both language codes in `languages`

#### Scenario: Multi-value POST field name for languages unchanged

- **WHEN** an ADMIN submits languages via the native multi-value control
- **THEN** the request body still uses the `languages` array field name

### Requirement: Product schema overview omits events.target_age_groups

`docs/product/database/schema-overview.md` SHALL NOT list `events.target_age_groups` as a current field. Catalog create/update/clone and the Drizzle `events` schema SHALL NOT include `targetAgeGroups` / `target_age_groups` after the drop migration is applied.

#### Scenario: Schema overview has no event target age groups column

- **WHEN** an implementer reads the `events` table section in `docs/product/database/schema-overview.md`
- **THEN** `target_age_groups` is not listed as a current column

#### Scenario: Catalog writes omit target age groups

- **WHEN** create, update, or clone event runs
- **THEN** the write path does not set or copy `target_age_groups`

## REMOVED Requirements

### Requirement: Admin event languages and age groups multi-select

**Reason:** Event target age groups are removed from product; languages remain as a standalone multi-select requirement.

**Migration:** Follow ADDED requirement “Admin event languages multi-select”; drop `events.target_age_groups` via migration; remove admin age-group UI and parsers.
