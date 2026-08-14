## ADDED Requirements

### Requirement: events.capacity_mode

The `events` table SHALL store `capacity_mode` as a NOT NULL enum (`SHARED` | `PER_OCCURRENCE`) with default `SHARED`. Existing rows SHALL backfill `SHARED`. `@unveiled/db` SHALL export type `CapacityMode`.

#### Scenario: Legacy rows are shared

- **WHEN** an existing event is backfilled
- **THEN** `capacity_mode` is `SHARED`

#### Scenario: Default on create when omitted

- **WHEN** `createEvent` is called without `capacityMode`
- **THEN** the stored `capacity_mode` is `SHARED`

### Requirement: events.occurrence_capacities

The `events` table SHALL store `occurrence_capacities` as a non-empty `integer[]` with the same cardinality as `date_times`. Each element SHALL be `>= 0`. Catalog writes SHALL persist capacities in the same order as the sorted `date_times` list. Existing rows SHALL backfill by repeating the event’s `total_capacity` once per `date_times` element (`array_fill(total_capacity, ARRAY[cardinality(date_times)])`). A database check constraint SHALL enforce `cardinality(date_times) = cardinality(occurrence_capacities)`. A database check constraint SHALL reject any element `< 0`. `total_capacity` and `remaining_capacity` SHALL remain event-level columns. Booking SHALL continue to use event-level remaining capacity.

#### Scenario: Occurrence capacities present after migration

- **WHEN** the occurrence-capacities migration has been applied
- **THEN** every events row has `capacity_mode` and `occurrence_capacities` with the same length as `date_times`

#### Scenario: Legacy rows fill from total_capacity

- **WHEN** an existing event is backfilled
- **THEN** `capacity_mode` is `SHARED`
- **AND** each `occurrence_capacities` element equals that row’s `total_capacity`

#### Scenario: Length mismatch rejected at database

- **WHEN** a catalog write would store `date_times` and `occurrence_capacities` of different lengths
- **THEN** the write is rejected

#### Scenario: Negative capacity rejected at database

- **WHEN** an insert or update would store an `occurrence_capacities` element below zero
- **THEN** the database rejects the write

### Requirement: Capacity mode catalog writes

Catalog create, update, and clone SHALL accept optional `capacityMode` and `occurrenceCapacities` (or `capacity` on each `{ startsAt, creditPrice, capacity }` occurrence). When capacities are omitted, the system SHALL fill every element from `totalCapacity` (create default 10) and treat the event as `SHARED`. When `capacityMode` is `SHARED`, `total_capacity` SHALL be the caller-supplied (or existing) capacity and `occurrence_capacities` SHALL be filled with that value (posted per-row capacities in SHARED SHALL be ignored). When `capacityMode` is `PER_OCCURRENCE`, the caller SHALL supply `occurrenceCapacities` of equal length to the date list; `total_capacity` SHALL equal the sum of `occurrence_capacities` and that sum SHALL be `>= 1`. Create and clone SHALL set `remaining_capacity` equal to `total_capacity`. Update SHALL recalculate `remaining_capacity` with `recalculateRemainingCapacity` when the derived or posted total changes. Booking SHALL continue to use event-level remaining capacity.

#### Scenario: Per-date capacities persist in datetime order

- **WHEN** `createEvent` is called with `capacityMode` `PER_OCCURRENCE` and two distinct datetimes with capacities 4 and 6
- **THEN** stored `occurrence_capacities` are 4 and 6 in datetime order
- **AND** `total_capacity` equals 10

#### Scenario: Shared mode fills the array

- **WHEN** `createEvent` is called with `capacityMode` `SHARED` and `totalCapacity` 12 and two datetimes
- **THEN** `occurrence_capacities` is `{12,12}`
- **AND** `total_capacity` equals 12

#### Scenario: Omitted capacities default to shared fill

- **WHEN** `createEvent` is called with `totalCapacity` only (no `capacityMode`, no `occurrenceCapacities`)
- **THEN** `capacity_mode` is `SHARED`
- **AND** every `occurrence_capacities` element equals that `totalCapacity`

#### Scenario: Per-occurrence without capacities rejected

- **WHEN** a catalog write supplies `capacityMode` `PER_OCCURRENCE` without `occurrenceCapacities` of matching length
- **THEN** the operation fails validation with `OCCURRENCE_CAPACITY_LENGTH_MISMATCH` without writing rows

#### Scenario: Negative capacity rejected at domain

- **WHEN** a catalog write supplies an occurrence capacity below zero
- **THEN** the operation fails validation with `NEGATIVE_CAPACITY` without writing rows

#### Scenario: Per-occurrence sum below one rejected

- **WHEN** `createEvent` is called with `capacityMode` `PER_OCCURRENCE` and occurrence capacities that sum to 0
- **THEN** the operation fails validation without writing rows

#### Scenario: Remaining recalculates when derived total changes

- **WHEN** `updateEvent` changes `PER_OCCURRENCE` capacities so the sum differs from the stored `total_capacity` on an event with tickets already sold
- **THEN** `remaining_capacity` becomes `max(0, newTotal - soldCount)`

## MODIFIED Requirements

### Requirement: Catalog persistence tables

The `@unveiled/db` package SHALL define Drizzle schema and migrations for `public.images`, `public.partners`, and `public.events` matching the project schema docs (as updated for ticket redemption and the extensible location model), including FK from `events.image_id` → `images.id` (required), `partners.logo_image_id` → `images.id` (optional), and `events.partner_id` → `partners.id`. The schema SHALL include enums for image source, ticket type (`SECRET_CODE` | `VOUCHER_PROMO` | `VOUCHER_PDF`), timing mode, and capacity mode (`SHARED` | `PER_OCCURRENCE`); SHALL NOT include a `secret_code_mode` enum/column; SHALL include required event location columns `country`, `city`, and `zip_code` and SHALL NOT include `events.neighborhood`; a check constraint `remaining_capacity >= 0` on `events`; a non-empty `date_times timestamptz[]` column with check `cardinality(date_times) >= 1`; a parallel `occurrence_credit_prices integer[]` column with checks `cardinality(date_times) = cardinality(occurrence_credit_prices)` and every element `>= 0`; a parallel `occurrence_capacities integer[]` column with checks `cardinality(date_times) = cardinality(occurrence_capacities)` and every element `>= 0`; a `capacity_mode` column NOT NULL default `SHARED`; a denormalized `date_time timestamptz` primary/next instant kept in sync with `date_times` on write; a denormalized `credit_price integer` equal to the `occurrence_credit_prices` element for that same primary instant; event-level `total_capacity` and `remaining_capacity`; and indexes on `events(date_time)`, `(date_time, partner_id)`, and `(date_time, category)`. Voucher inventory and `booking_tickets` tables SHALL also be defined as part of the ticket-redemption schema work.

#### Scenario: Migration applies on empty catalog

- **WHEN** `bun run db:migrate` runs against a database with Phase 2 tables
- **THEN** `images`, `partners`, and `events` tables exist with documented columns and constraints

#### Scenario: Remaining capacity non-negative

- **WHEN** an `events` row is inserted with `remaining_capacity` below zero
- **THEN** the database rejects the insert

#### Scenario: Event image required at schema level

- **WHEN** an `events` row is inserted without `image_id`
- **THEN** the database rejects the insert

#### Scenario: Secret code mode column absent

- **WHEN** the ticket-redemption schema migration has been applied
- **THEN** `events` has no `secret_code_mode` column and `ticket_type` accepts `SECRET_CODE`, `VOUCHER_PROMO`, and `VOUCHER_PDF` only

#### Scenario: Neighborhood column absent after location migration

- **WHEN** the berlin-zip-code location migration has been applied
- **THEN** `events` has required `country`, `city`, and `zip_code` columns and has no `neighborhood` column

#### Scenario: date_times present after multi-datetime migration

- **WHEN** the multi-datetime migration has been applied
- **THEN** `events` has non-empty `date_times` and retained denormalized `date_time` with existing `date_time` indexes

#### Scenario: occurrence_credit_prices present after occurrence-credits migration

- **WHEN** the occurrence-credits migration has been applied
- **THEN** `events` has `occurrence_credit_prices` with the same cardinality as `date_times`
- **AND** denormalized `credit_price` is retained

#### Scenario: occurrence_capacities present after occurrence-capacities migration

- **WHEN** the occurrence-capacities migration has been applied
- **THEN** `events` has `capacity_mode` and `occurrence_capacities` with the same cardinality as `date_times`
- **AND** event-level `total_capacity` and `remaining_capacity` are retained

### Requirement: Normalize paired occurrences

Catalog create, update, and clone SHALL accept a list of occurrences `{ startsAt, creditPrice, capacity }` (or parallel `dateTimes` + `occurrenceCreditPrices` + `occurrenceCapacities`). The system SHALL sort by `startsAt` ascending, reject an empty list, and reject two occurrences that share the same instant. Credit prices SHALL be integers `>= 0`. Capacities SHALL be integers `>= 0`. When the caller supplies only `dateTimes` and a single `creditPrice`, the system SHALL unique-sort `dateTimes` (existing helper) and fill every credit with that price. When capacities are omitted, the system SHALL fill every capacity from `totalCapacity` after the date list is known. `@unveiled/db` SHALL export `EventOccurrence` and a normalize helper (`tryNormalizeEventOccurrences` or equivalent) from the catalog datetime module.

#### Scenario: Two prices persist in datetime order

- **WHEN** `createEvent` is called with two distinct datetimes and two credit prices
- **THEN** stored `date_times` are sorted ascending
- **AND** `occurrence_credit_prices` follow that order
- **AND** denormalized `credit_price` equals the primary/next occurrence’s price

#### Scenario: Duplicate instant rejected

- **WHEN** a write includes two occurrences with the same `startsAt` (paired path)
- **THEN** the write is rejected with a catalog validation error

#### Scenario: Legacy single-price fill

- **WHEN** `createEvent` is called with `dateTimes` (possibly containing duplicate instants) and a single `creditPrice` without `occurrenceCreditPrices`
- **THEN** stored `date_times` are unique-sorted
- **AND** every `occurrence_credit_prices` element equals that `creditPrice`

#### Scenario: Length mismatch rejected at domain

- **WHEN** a catalog write supplies `dateTimes` and `occurrenceCreditPrices` of different lengths
- **THEN** the operation fails validation without writing rows

#### Scenario: Negative credit rejected at domain

- **WHEN** a catalog write supplies an occurrence credit below zero
- **THEN** the operation fails validation without writing rows

#### Scenario: Two capacities persist in datetime order

- **WHEN** `createEvent` is called with two distinct datetimes and two capacities on the paired path
- **THEN** stored `occurrence_capacities` follow datetime-sorted order

#### Scenario: Capacity length mismatch rejected at domain

- **WHEN** a catalog write supplies `dateTimes` and `occurrenceCapacities` of different lengths on the paired path
- **THEN** the operation fails validation with `OCCURRENCE_CAPACITY_LENGTH_MISMATCH` without writing rows

### Requirement: Event catalog domain rules

The catalog domain layer in `@unveiled/db` SHALL enforce event validation, defaults, and derived fields from `docs/product/features/admin-events.feature` (as aligned with ticket redemption and the extensible location model), including required image (upload buffer or remote URL path, exactly one source); required location via `street` / `house_number` / optional `address_line2` / `country` / `city` / `zip_code` with defaults `DE` / `berlin`, postal validation through `validatePostalCode`, and compose-on-write display `address` (no `neighborhood`); redemption configuration rules (`SECRET_CODE` requires `secretCode`; `VOUCHER_PROMO` requires `eventWebsiteUrl` and does not require event-level `promoCode`; `VOUCHER_PDF` does not require event-level promo/code fields); default capacity 10, ticket type `SECRET_CODE`, timing mode `TIME_SLOT`, capacity mode `SHARED` (no secret-code mode default); required non-empty `dateTimes: Date[]` on create (sorted unique on the legacy single-price path; paired with `occurrenceCreditPrices` when that array is supplied), with update/clone accepting the same list shape plus optional `occurrenceCreditPrices?: number[]`, optional `capacityMode?: CapacityMode`, and optional `occurrenceCapacities?: number[]`; computed `start_time_minutes` and `weekday` from the denormalized primary `date_time` in Europe/Berlin; denormalized `credit_price` from the primary occurrence’s credit; capacity recalculation when total capacity changes (including when `PER_OCCURRENCE` sum changes the derived total); and synchronous replacement/deletion of event `images` rows and bucket objects per `docs/product/extras/image-uploads.md` §8. Multi-slot series create (`createEventSeries` / series slot uniqueness) is not part of the catalog domain; reuse of catalog metadata for another occurrence SHALL use clone (see Requirement: Clone event). `createEvent` remains for blank creates.

#### Scenario: Missing event image rejected

- **WHEN** `createEvent` is called without an image source (neither upload nor URL)
- **THEN** the operation fails validation

#### Scenario: Conflicting image sources rejected

- **WHEN** `createEvent` or `updateEvent` receives both an upload buffer and a remote URL
- **THEN** the operation fails validation without writing rows or bucket objects

#### Scenario: Capacity update recalculates remaining

- **WHEN** total capacity is updated on an event with tickets already sold
- **THEN** `remaining_capacity` becomes `max(0, newTotal - soldCount)`

#### Scenario: Derived datetime fields on write

- **WHEN** an event is created or its `date_times` list is updated
- **THEN** denormalized `date_time` is recomputed from the list
- **AND** `start_time_minutes` and `weekday` are computed from that primary `date_time` using Europe/Berlin local time

#### Scenario: Create with multiple dateTimes

- **WHEN** `createEvent` is called with two or more distinct `dateTimes`
- **THEN** the event row stores sorted unique `date_times`
- **AND** `date_time` equals the primary/next instant per denormalized rules

#### Scenario: Empty dateTimes rejected

- **WHEN** `createEvent` or `updateEvent` is called with an empty `dateTimes` list
- **THEN** the operation fails validation without writing rows

#### Scenario: Secret code required without mode

- **WHEN** `createEvent` or `updateEvent` is called with `ticketType = SECRET_CODE` and no `secretCode`
- **THEN** the operation fails validation

#### Scenario: Voucher promo requires website not promo code

- **WHEN** `createEvent` or `updateEvent` is called with `ticketType = VOUCHER_PROMO` and no `eventWebsiteUrl`
- **THEN** the operation fails validation even if a legacy `promoCode` is supplied

#### Scenario: Voucher promo accepts website without event-level promo code

- **WHEN** `createEvent` or `updateEvent` is called with `ticketType = VOUCHER_PROMO` and a valid `eventWebsiteUrl` without event-level `promoCode`
- **THEN** the operation succeeds at the event-row layer (inventory is validated separately)

#### Scenario: Create event persists zip under Germany/Berlin defaults

- **WHEN** `createEvent` is called with a valid Berlin zip and omitted country/city
- **THEN** the event row stores `country = DE`, `city = berlin`, and that `zip_code`

#### Scenario: Series create API removed

- **WHEN** catalog package exports and series helpers are inspected after this change
- **THEN** `createEventSeries` and `validateUniqueSeriesSlots` are not exported or callable
- **AND** blank single-event create via `createEvent` still works

#### Scenario: Update creditPrice alone fills all occurrence credits

- **WHEN** `updateEvent` is called with `creditPrice` and neither `dateTimes` nor `occurrenceCreditPrices`
- **THEN** every stored `occurrence_credit_prices` element equals that `creditPrice`
- **AND** denormalized `credit_price` equals that value

#### Scenario: Update totalCapacity alone on SHARED fills all occurrence capacities

- **WHEN** `updateEvent` is called with `totalCapacity` on a `SHARED` event and neither `dateTimes` nor `occurrenceCapacities`
- **THEN** every stored `occurrence_capacities` element equals that `totalCapacity`
- **AND** `total_capacity` equals that value

### Requirement: Clone event

The catalog domain SHALL provide an ADMIN-facing clone operation that creates a new event row from an existing source event. The clone SHALL copy catalog metadata (title, description, partner, structured location fields including composed address, zip/location fields, category/type/tags, credit price, total capacity, timing mode, capacity mode, ticket type, secret code when `SECRET_CODE`, website URL, language/subtitle metadata, primary image id) and SHALL set `remaining_capacity` equal to `total_capacity`. The clone SHALL NOT copy barrier-free accessibility (that value lives on the partner). The caller SHALL supply a non-empty `dateTimes` list (and any create-required redemption inventory for voucher types). The caller MAY supply `occurrenceCreditPrices` of equal length; when omitted, the clone SHALL unique-sort `dateTimes` and fill every credit from `source.creditPrice`. The caller MAY supply `capacityMode` and `occurrenceCapacities`; when omitted, the clone SHALL copy `source.capacityMode` and SHALL copy `source.occurrenceCapacities` when the clone date list has the same length, or fill every capacity from `source.totalCapacity` when the copied mode is `SHARED`. When the copied mode is `PER_OCCURRENCE` and the clone date list length differs without a posted `occurrenceCapacities` array, the clone SHALL fail validation. The clone SHALL copy gallery join rows to the new event when the source has gallery images. The clone SHALL NOT copy bookings, waitlist entries, featured membership, or voucher inventory rows from the source.

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

#### Scenario: Clone copies capacity mode and array

- **WHEN** `cloneEvent` is called for a `PER_OCCURRENCE` source with two capacities and a `dateTimes` list of the same length
- **THEN** the clone stores the same `capacity_mode`
- **AND** stored `occurrence_capacities` equal the source array
- **AND** `remaining_capacity` equals `total_capacity`
