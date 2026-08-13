## ADDED Requirements

### Requirement: Optional accessibility and audience metadata without age groups

The system SHALL allow admins to optionally set supported languages, language-independent, and subtitles when creating or editing an event. The system SHALL NOT collect or store barrier-free accessibility or target age groups on events. Barrier-free SHALL be stored only on the hosting partner. `docs/product/features/admin-events.feature` SHALL include a scenario titled `Optional audience metadata without barrier-free`. Playwright SHALL use that title verbatim.

#### Scenario: Optional audience metadata without barrier-free

- **WHEN** I create or edit an event
- **THEN** I can optionally set supported languages, language-independent, and subtitles
- **AND** no barrier-free control is shown
- **AND** no target age groups control is shown

## MODIFIED Requirements

### Requirement: Clone event

The catalog domain SHALL provide an ADMIN-facing clone operation that creates a new event row from an existing source event. The clone SHALL copy catalog metadata (title, description, partner, structured location fields including composed address, zip/location fields, category/type/tags, credit price, total capacity, timing mode, ticket type, secret code when `SECRET_CODE`, website URL, language/subtitle metadata, primary image id) and SHALL set `remaining_capacity` equal to `total_capacity`. The clone SHALL NOT copy barrier-free accessibility (that value lives on the partner). The caller SHALL supply a non-empty `dateTimes` list (and any create-required redemption inventory for voucher types). The caller MAY supply `occurrenceCreditPrices` of equal length; when omitted, the clone SHALL unique-sort `dateTimes` and fill every credit from `source.creditPrice`. The clone SHALL copy gallery join rows to the new event when the source has gallery images. The clone SHALL NOT copy bookings, waitlist entries, featured membership, or voucher inventory rows from the source.

#### Scenario: Clone creates a distinct event

- **WHEN** `cloneEvent` is called with a valid source id and a non-empty `dateTimes` list
- **THEN** a new event id exists with copied title/partner and the supplied `date_times`
- **AND** remaining_capacity equals total_capacity
- **AND** denormalized `date_time` matches primary/next rules

#### Scenario: Clone copies structured location fields

- **WHEN** `cloneEvent` is called for a source with street, house number, optional line2, zip, and composed address
- **THEN** the new event has the same structured location fields and composed `address`

#### Scenario: Clone without occurrence credits fills from source creditPrice

- **WHEN** `cloneEvent` is called with `dateTimes` and no `occurrenceCreditPrices`
- **THEN** every stored `occurrence_credit_prices` element equals `source.creditPrice`
- **AND** denormalized `credit_price` equals the primary occurrence’s price

#### Scenario: Clone does not copy barrier-free onto the event

- **WHEN** `cloneEvent` is called
- **THEN** the new event row has no `barrier_free` column/value
- **AND** public detail accessibility for the clone still comes from the hosting partner

### Requirement: Admin event form select controls

Admin event create/edit and clone forms SHALL use native HTML `<select>` (or native checkbox groups for multi-value fields) for partner, category, event type, timing mode, ticket type, secret-code mode, languages, and subtitle language where those fields appear. HeroUI `Select` / `ListBox` SHALL NOT be required for those fields. SSR field names and validation remain unchanged except that `target_age_groups` and `barrier_free` are no longer event form fields. Native selects SHALL be associated with an accessible label and MAY be wrapped in HeroUI `Label` / `Surface` / `Field` chrome. Theme styling SHALL use shared admin native select classes from `globals.css` (e.g. `.admin-native-select`). Series create forms SHALL NOT be documented or offered.

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

## REMOVED Requirements

### Requirement: Event-level barrier-free column

**Reason:** Barrier-free is a venue fact. `events.barrier_free` and clone/create/update copies of it no longer apply.

**Migration:** Backfill `partners.barrier_free` from events with `bool_or` (any `true` wins; otherwise leave `NULL` — do not persist `false`), then `ALTER TABLE events DROP COLUMN barrier_free`. Admin and public surfaces read the hosting partner. Historical per-event disagreement is not reconstructed on rollback.
