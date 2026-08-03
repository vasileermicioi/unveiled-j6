## ADDED Requirements

### Requirement: events.date_times

The `events` table SHALL store `date_times` as a non-empty array of `timestamptz` values. Catalog writes SHALL persist the list in ascending order with duplicate instants removed. The system SHALL migrate existing rows to a single-element array from the former sole `date_time` value. A database check constraint SHALL enforce `cardinality(date_times) >= 1`.

#### Scenario: Backfill

- **WHEN** the multi-datetime migration runs
- **THEN** every event has `date_times` with length ≥ 1
- **AND** each backfilled array’s sole element equals that row’s previous `date_time`

#### Scenario: Empty date_times rejected at database

- **WHEN** an insert or update would store an empty `date_times` array
- **THEN** the database rejects the write

### Requirement: events.date_time denormalized primary

`events.date_time` SHALL equal the next upcoming instant in `date_times` relative to write-time `now` (minimum element `>= now`), or the earliest instant in `date_times` when all elements are past. Catalog create/update/clone SHALL recompute `date_time` whenever `date_times` is written. `start_time_minutes` and `weekday` SHALL continue to derive from that primary instant in Europe/Berlin.

#### Scenario: Primary is next upcoming

- **WHEN** an event is written with multiple `date_times` of which at least one is `>= now`
- **THEN** `date_time` equals the soonest element that is `>= now`

#### Scenario: Primary falls back when all past

- **WHEN** an event is written with `date_times` where every element is `< now`
- **THEN** `date_time` equals the earliest element in the list

## MODIFIED Requirements

### Requirement: Catalog persistence tables

The `@unveiled/db` package SHALL define Drizzle schema and migrations for `public.images`, `public.partners`, and `public.events` matching the project schema docs (as updated for ticket redemption and the extensible location model), including FK from `events.image_id` → `images.id` (required), `partners.logo_image_id` → `images.id` (optional), and `events.partner_id` → `partners.id`. The schema SHALL include enums for image source, ticket type (`SECRET_CODE` | `VOUCHER_PROMO` | `VOUCHER_PDF`), and timing mode; SHALL NOT include a `secret_code_mode` enum/column; SHALL include required event location columns `country`, `city`, and `zip_code` and SHALL NOT include `events.neighborhood`; a check constraint `remaining_capacity >= 0` on `events`; a non-empty `date_times timestamptz[]` column with check `cardinality(date_times) >= 1`; a denormalized `date_time timestamptz` primary/next instant kept in sync with `date_times` on write; and indexes on `events(date_time)`, `(date_time, partner_id)`, and `(date_time, category)`. Voucher inventory and `booking_tickets` tables SHALL also be defined as part of the ticket-redemption schema work.

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

### Requirement: Event catalog domain rules

The catalog domain layer in `@unveiled/db` SHALL enforce event validation, defaults, and derived fields from `docs/product/features/admin-events.feature` (as aligned with ticket redemption and the extensible location model), including required image (upload buffer or remote URL path, exactly one source); required location via `street` / `house_number` / optional `address_line2` / `country` / `city` / `zip_code` with defaults `DE` / `berlin`, postal validation through `validatePostalCode`, and compose-on-write display `address` (no `neighborhood`); redemption configuration rules (`SECRET_CODE` requires `secretCode`; `VOUCHER_PROMO` requires `eventWebsiteUrl` and does not require event-level `promoCode`; `VOUCHER_PDF` does not require event-level promo/code fields); default capacity 10, ticket type `SECRET_CODE`, timing mode `TIME_SLOT` (no secret-code mode default); required non-empty `dateTimes: Date[]` on create (sorted unique on write), with update/clone accepting the same list shape; computed `start_time_minutes` and `weekday` from the denormalized primary `date_time` in Europe/Berlin; capacity recalculation when total capacity changes; and synchronous replacement/deletion of event `images` rows and bucket objects per `docs/product/extras/image-uploads.md` §8. Multi-slot series create (`createEventSeries` / series slot uniqueness) is not part of the catalog domain; reuse of catalog metadata for another occurrence SHALL use clone (see Requirement: Clone event). `createEvent` remains for blank creates.

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

### Requirement: Clone event

The catalog domain SHALL provide an ADMIN-facing clone operation that creates a new event row from an existing source event. The clone SHALL copy catalog metadata (title, description, partner, structured location fields including composed address, zip/location fields, category/type/tags, credit price, total capacity, timing mode, ticket type, secret code when `SECRET_CODE`, website URL, accessibility/language/age metadata, primary image id) and SHALL set `remaining_capacity` equal to `total_capacity`. The caller SHALL supply a non-empty `dateTimes` list (and any create-required redemption inventory for voucher types). The clone SHALL copy gallery join rows to the new event when the source has gallery images. The clone SHALL NOT copy bookings, waitlist entries, featured membership, or voucher inventory rows from the source.

#### Scenario: Clone creates a distinct event

- **WHEN** `cloneEvent` is called with a valid source id and a non-empty `dateTimes` list
- **THEN** a new event id exists with copied title/partner and the supplied `date_times`
- **AND** remaining_capacity equals total_capacity
- **AND** denormalized `date_time` matches primary/next rules

#### Scenario: Clone copies structured location fields

- **WHEN** `cloneEvent` is called for a source with street, house number, optional line2, zip, and composed address
- **THEN** the new event has the same structured location fields and composed `address`
