## ADDED Requirements

### Requirement: Capacity allocation on Date & tickets

Admin create, edit, and clone SHALL present a native Capacity allocation select (`SHARED` | `PER_OCCURRENCE`) and a native capacity number immediately after Timing mode. Labels SHALL be **Capacity allocation** / **Kapazitätsverteilung** with options **Shared across all dates** / **Gemeinsam für alle Termine** and **Per date** / **Pro Termin**, plus the locked hints in the parent guide. The capacity number SHALL be visible for `SECRET_CODE`, `VOUCHER_PROMO`, and `VOUCHER_PDF`. Default mode on create SHALL be `SHARED` with capacity 10.

#### Scenario: Shared hides per-row capacity

- **WHEN** Capacity allocation is Shared across all dates
- **THEN** datetime rows do not show a capacity input
- **AND** the capacity number is the event ticket pool

#### Scenario: Per date shows per-row capacity with defaults

- **WHEN** Capacity allocation is Per date and the capacity number is 8
- **THEN** each datetime row shows a capacity input defaulting to 8
- **AND** a range rebuild stamps 8 on generated rows

#### Scenario: Changing the default does not rewrite edited rows

- **WHEN** Capacity allocation is Per date and the admin has changed a row’s capacity
- **THEN** editing the event-level capacity number does not change that row
- **AND** adding a row or rebuilding from the range builder uses the current capacity number as the default

### Requirement: Date & tickets totals and inventory match

The Date & tickets step SHALL show a credits total, a datetime-capacity total, and — for voucher ticket types — an available codes/tickets total. When voucher inventory count does not equal datetime-capacity total, the capacity and inventory totals SHALL use theme danger styling (HeroUI `Alert` `status="danger"` or an equivalent theme class). Credits SHALL NOT be compared. Submit SHALL reject with `CAPACITY_INVENTORY_MISMATCH` and SHALL NOT overwrite posted capacity from inventory. `SECRET_CODE` events SHALL omit the inventory total and SHALL NOT emit that error.

#### Scenario: Totals go danger when voucher inventory disagrees

- **WHEN** datetime capacity total is 10 and the promo/PDF preview has 7 codes or tickets
- **THEN** the capacity and inventory totals are shown in danger styling
- **AND** submitting is rejected until they match

#### Scenario: Secret code has no inventory total

- **WHEN** ticket type is Secret code
- **THEN** the form shows credits total and capacity total only

#### Scenario: Voucher inventory present still required

- **WHEN** ticket type is a voucher type and inventory is empty
- **THEN** submit is rejected for missing inventory
- **AND** the rejection is not `CAPACITY_INVENTORY_MISMATCH`

## MODIFIED Requirements

### Requirement: Admin event create and edit use a three-step form

Admin create (`/:locale/admin/events/new`) and edit (`/:locale/admin/events/:id/edit`) SHALL present fields in three steps with visible progress: (1) general — partner, title, description, structured location, category, event type, tags, language metadata; (2) Date & tickets — Timing mode; then Capacity allocation and the capacity number (visible for every ticket type); then ticket type, secret code or voucher inventory; then the range builder and editable datetime list; then totals (credits, datetime capacity, and available codes/tickets for voucher types); (3) image — primary image upload (required on create; optional replace on edit). The system SHALL keep all fields in a single SSR `POST` form. Inactive steps SHALL remain in the document so their values submit. Clone SHALL remain a separate dates/inventory form but SHALL expose Timing mode and Capacity allocation as editable controls (not hidden-only fields) so All day vs Time slot and Shared vs Per date UI matches create/edit.

#### Scenario: Create walks three steps

- **WHEN** I open new-event
- **THEN** I see step 1 General with progress indicating step 1 of 3
- **AND** I do not see the datetime list or image uploader until I go to those steps

#### Scenario: Create submit is on the image step

- **WHEN** I am on new-event step 3
- **THEN** I can submit the form
- **AND** earlier steps' values are included in the POST

#### Scenario: Edit can jump to image

- **WHEN** I open edit-event
- **THEN** I can move to step 3 without posting
- **AND** saving posts the full form including unchanged dates and image id

#### Scenario: Missing image returns to step 3

- **WHEN** I create an event and submit without a primary image
- **THEN** the form is rejected
- **AND** the re-rendered form shows the image step

#### Scenario: Timing mode is first on Date & tickets

- **WHEN** I open create or edit event and go to step 2
- **THEN** Timing mode is shown before the datetime list and range builder

#### Scenario: Capacity allocation follows Timing mode

- **WHEN** I am on create or edit step 2
- **THEN** Capacity allocation and the capacity number are shown after Timing mode and before ticket type

#### Scenario: Datetime list is last on Date & tickets

- **WHEN** I am on create or edit step 2
- **THEN** the range builder and datetime rows are below ticket type and redemption fields
- **AND** totals are below the datetime rows

### Requirement: Admin event form select controls

Admin event create/edit and clone forms SHALL use native HTML `<select>` (or native checkbox groups for multi-value fields) for partner, category, event type, timing mode, capacity allocation, ticket type, languages, and subtitle language where those fields appear. HeroUI `Select` / `ListBox` SHALL NOT be required for those fields. SSR field names and validation remain unchanged except that `target_age_groups` and `barrier_free` are no longer event form fields. Native selects SHALL be associated with an accessible label and MAY be wrapped in HeroUI `Label` / `Surface` / `Field` chrome. Theme styling SHALL use shared admin native select classes from `globals.css` (e.g. `.admin-native-select`). Series create forms SHALL NOT be documented or offered. Capacity allocation SHALL post `capacity_mode` (`SHARED` | `PER_OCCURRENCE`). Timing mode SHALL post `timing_mode`.

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

#### Scenario: Barrier-free is not an event form control

- **WHEN** an admin opens Create Event, Edit Event, or Clone Event
- **THEN** no barrier-free control is shown
- **AND** create/update/clone do not write `events.barrier_free`

#### Scenario: Capacity allocation is a native select

- **WHEN** an admin opens Create Event, Edit Event, or Clone Event
- **THEN** Capacity allocation is a native HTML select named `capacity_mode` associated with an accessible label

### Requirement: Admin event numeric fields

Admin event create/edit/clone forms SHALL use native HTML `<input type="number">` for credit price, event capacity, and per-datetime capacity when Per date is selected. HeroUI `NumberField` SHALL NOT be used for those fields. Field names: `total_capacity`, `event_credit_${index}`, `event_capacity_${index}`. Native number inputs SHALL be associated with an accessible label and MAY be wrapped in HeroUI `Label` / `Surface` / `Field` chrome. Theme styling SHALL use shared admin native number classes from `globals.css` (e.g. `.admin-native-number`). Event-level `total_capacity` SHALL default to 10 with min 1. Per-datetime capacity SHALL be an integer `>= 0`.

#### Scenario: Capacity is a native number input

- **WHEN** an admin opens Create Event
- **THEN** total capacity is a native number input with an accessible label and posts `total_capacity` on submit

#### Scenario: Credit price is a native number input

- **WHEN** an admin opens Create Event and Timing mode is Time slot
- **THEN** each datetime row’s credits field is a native number input named `event_credit_${index}` with an accessible label

#### Scenario: Per-row capacity is a native number

- **WHEN** Capacity allocation is Per date
- **THEN** each datetime row’s capacity is a native number input named `event_capacity_${index}` with an accessible label

#### Scenario: Numeric bounds and defaults unchanged

- **WHEN** an admin creates an event without overriding numeric fields
- **THEN** total capacity defaults to 10
- **AND** client-side min for event-level capacity remains ≥ 1
