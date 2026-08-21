# Event Catalog

Phase 4 catalog persistence and image processing for partner venue records and events.

## Requirements

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

### Requirement: events.date_times

The `events` table SHALL store `date_times` as a non-empty array of `timestamptz` values. Catalog writes SHALL persist the list in ascending order with duplicate instants removed. The system SHALL migrate existing rows to a single-element array from the former sole `date_time` value. A database check constraint SHALL enforce `cardinality(date_times) >= 1`.

#### Scenario: Backfill

- **WHEN** the multi-datetime migration runs
- **THEN** every event has `date_times` with length ≥ 1
- **AND** each backfilled array’s sole element equals that row’s previous `date_time`

#### Scenario: Empty date_times rejected at database

- **WHEN** an insert or update would store an empty `date_times` array
- **THEN** the database rejects the write

### Requirement: events.occurrence_credit_prices

The `events` table SHALL store `occurrence_credit_prices` as a non-empty `integer[]` with the same cardinality as `date_times`. Each element SHALL be `>= 0`. Catalog writes SHALL persist credits in the same order as the sorted `date_times` list. Existing rows SHALL backfill by repeating the event’s `credit_price` once per `date_times` element. A database check constraint SHALL enforce `cardinality(date_times) = cardinality(occurrence_credit_prices)`. A database check constraint SHALL reject any element `< 0`.

#### Scenario: Backfill repeats event credit_price

- **WHEN** the occurrence-credits migration runs
- **THEN** every event has `occurrence_credit_prices` length equal to `date_times`
- **AND** each element equals that row’s previous `credit_price`

#### Scenario: Length mismatch rejected

- **WHEN** a catalog write would store `date_times` and `occurrence_credit_prices` of different lengths
- **THEN** the write is rejected

#### Scenario: Negative credit rejected at database

- **WHEN** an insert or update would store an `occurrence_credit_prices` element below zero
- **THEN** the database rejects the write

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

### Requirement: events.date_time denormalized primary

`events.date_time` SHALL continue to equal the next upcoming instant in `date_times` relative to write-time `now` (minimum element `>= now`), or the earliest instant in `date_times` when all elements are past. Catalog create/update/clone SHALL recompute `date_time` whenever `date_times` is written. `events.credit_price` SHALL equal the `occurrence_credit_prices` element for that same primary instant. `start_time_minutes` and `weekday` SHALL continue to derive from that primary instant in Europe/Berlin.

#### Scenario: Primary is next upcoming

- **WHEN** an event is written with multiple `date_times` of which at least one is `>= now`
- **THEN** `date_time` equals the soonest element that is `>= now`

#### Scenario: Primary falls back when all past

- **WHEN** an event is written with `date_times` where every element is `< now`
- **THEN** `date_time` equals the earliest element in the list

#### Scenario: Primary credit follows next upcoming

- **WHEN** an event is written with a past slot priced 1 and a future slot priced 3
- **THEN** `date_time` is the future instant
- **AND** `credit_price` is 3

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

### Requirement: Event location fields

Each event SHALL store required location fields `country` (ISO 3166-1 alpha-2), `city` (canonical city key), `zip_code` (postal string), `street`, and `house_number`, plus optional `address_line2`. The system SHALL NOT store `events.neighborhood`. For the current product release, supported values are `country = DE` and `city = berlin`; catalog create/update SHALL default omitted country/city to those values. Catalog create/update SHALL reject missing, malformed, or non-Berlin zip codes for `(DE, berlin)`, and SHALL reject unsupported country/city pairs. Display `address` SHALL be composed on write from structured fields; optional geocoded lat/lng remain structured-geocode-derived. Postal validation SHALL use a shared registry-shaped helper `validatePostalCode({ country, city, zipCode })` (not a bare Berlin-only function without country/city parameters).

#### Scenario: Create event requires Berlin zip under Germany/Berlin

- **WHEN** `createEvent` is called without a valid Berlin `zipCode` (with defaults or explicit `DE` / `berlin`)
- **THEN** the create is rejected with a validation error

#### Scenario: Non-Berlin zip rejected for Berlin

- **WHEN** `createEvent` receives `country=DE`, `city=berlin`, and a well-formed 5-digit code that is not a Berlin PLZ
- **THEN** the create is rejected

#### Scenario: Unsupported city rejected

- **WHEN** `createEvent` receives a country/city pair that is not in the postal registry
- **THEN** the create is rejected

#### Scenario: Omitted country and city default to Germany and Berlin

- **WHEN** `createEvent` is called with a valid Berlin `zipCode` and without `country` / `city`
- **THEN** the event is persisted with `country = DE`, `city = berlin`, and the given `zip_code`

### Requirement: Structured location fields on events

Events SHALL store required `street` and `house_number`, optional `address_line2`, plus existing `country` / `city` / `zip_code`. Catalog create/update/clone/seed writes SHALL compose display `address` from those structured fields (including `address_line2` when present) and SHALL persist that composed string on the event row. Derived `lat` / `lng` SHALL remain optional and SHALL be produced only by structured geocode success (or preserved on edit); soft-fail MAY leave them null. The system MUST NOT invent default-center coordinates when geocode fails.

#### Scenario: Create event requires street and house number

- **WHEN** `createEvent` is called without a non-empty `street` or `houseNumber`
- **THEN** the create is rejected with a validation error

#### Scenario: Create composes display address

- **WHEN** `createEvent` succeeds with street, house number, optional line2, and Berlin zip
- **THEN** the event row stores those structured fields
- **AND** `address` equals the composed display string from the domain helper

#### Scenario: Soft-fail geocode leaves coordinates null

- **WHEN** an event is saved with valid structured location fields but geocode does not resolve
- **THEN** the composed `address` is stored
- **AND** `lat` and `lng` remain null (or unset)
- **AND** no invented default-center coordinates are written

### Requirement: Product schema overview documents location columns

`docs/product/database/schema-overview.md` SHALL document `events.country`, `events.city`, `events.zip_code`, `events.street`, `events.house_number`, optional `events.address_line2`, and composed display `events.address` as current location fields (supported defaults/values for this release: `DE` / `berlin` + Berlin PLZ via the postal registry). It SHALL document matching structured fields (and zip parity) on `partners`. It SHALL NOT list `events.neighborhood` as a current field. Matching `users.profile` keys `country`, `city`, and `zip_code` SHALL be documented; active `districts` preference arrays SHALL NOT be listed as current fields (legacy `districts` MAY be noted as cleared on write). `users.profile.max_distance` SHALL be documented as optional **legacy** JSONB (integer km when present), not as an active onboarding/Vibes preference; preference/location saves SHALL be documented as leaving it untouched (neither required nor cleared by policy).

#### Scenario: Schema overview events table has country city zip and structured street fields

- **WHEN** an implementer reads the `events` table section in `docs/product/database/schema-overview.md`
- **THEN** `country`, `city`, `zip_code`, `street`, `house_number`, and composed `address` are listed
- **AND** optional `address_line2` is documented
- **AND** `neighborhood` is not listed as a current column

#### Scenario: Schema overview partners have zip parity and structured street fields

- **WHEN** an implementer reads the `partners` table section in `docs/product/database/schema-overview.md`
- **THEN** partner structured location fields and `country` / `city` / `zip_code` are listed

#### Scenario: Schema overview profile keys use location trio

- **WHEN** an implementer reads the `users.profile` field table in `docs/product/database/schema-overview.md`
- **THEN** `country`, `city`, and `zip_code` are listed as location preference keys
- **AND** `districts` is not listed as an active preference array

#### Scenario: Schema overview documents max_distance as legacy remnant

- **WHEN** an implementer reads the `users.profile` field table in `docs/product/database/schema-overview.md`
- **THEN** `max_distance` is listed as optional legacy JSONB (not collected in onboarding/Vibes)
- **AND** the overview does not claim `max_distance` is an active preference required on location saves

### Requirement: Six-variant JPEG image pipeline

The `@unveiled/images` package SHALL process a valid JPEG, PNG, or WebP source into exactly six JPEG objects under `images/{id}/{variant}.jpg` per `docs/product/extras/image-uploads.md`, upload them to S3-compatible storage with Content-Type `image/jpeg`, and expose helpers to compute public URLs from `IMAGE_PUBLIC_BASE_URL`. Fixed filenames SHALL be: `original.jpg`, `hero-1920.jpg`, `large-1280.jpg`, `medium-640.jpg`, `small-320.jpg`, `og-1200x630.jpg`.

#### Scenario: Direct buffer processing

- **WHEN** `processImageFromBuffer` receives a valid image at least 800×420 and under 8 MB
- **THEN** six JPEG variants are produced with correct max-width or cover-crop behavior and no upscaling except `og-1200x630`

#### Scenario: Undersized source rejected

- **WHEN** the source is smaller than 800×420
- **THEN** processing fails with a validation error and no bucket objects are written

#### Scenario: Public variant URL

- **WHEN** `buildVariantUrl(imageId, "medium-640.jpg")` is called with `IMAGE_PUBLIC_BASE_URL` set
- **THEN** the returned URL follows `{base}/images/{id}/medium-640.jpg`

#### Scenario: Remote URL processing

- **WHEN** `processImageFromUrl` receives a reachable JPEG, PNG, or WebP URL meeting size and dimension rules
- **THEN** the same six JPEG variants are produced as a direct buffer upload

#### Scenario: Image object deletion

- **WHEN** `deleteImageObjects(imageId)` is called for an image that was uploaded
- **THEN** all six objects under `images/{imageId}/` are removed from the bucket

### Requirement: Server-side image processor

The `@unveiled/images` package SHALL generate the six JPEG variants using `@standardagents/sip` (WASM/scanline processing). The package SHALL NOT depend on `sharp` or other Node-native image addons.

#### Scenario: Unit test generates variants without sharp

- **WHEN** `bun test` runs in `packages/images`
- **THEN** variant generation succeeds using sip and asserts JPEG outputs and correct dimensions

#### Scenario: OG cover-crop

- **WHEN** a source image is processed
- **THEN** `og-1200x630.jpg` is exactly 1200×630 pixels (center cover-crop; upscale allowed only for this variant)

### Requirement: Partner catalog domain rules

The catalog domain layer in `@unveiled/db` SHALL enforce partner validation and lifecycle rules from `docs/product/features/admin-partners.feature`, including required name, contact email, structured location (`street`, `house_number`, optional `address_line2`, `country` / `city` / `zip_code` with Berlin postal validation and compose-on-write display `address`); logo rules as currently specified; automatic `venue_check_in_token` generation when omitted on create; propagating partner display name changes to all related events' denormalized `partner_name`; and synchronous deletion of associated logo `images` row and bucket objects when a partner is deleted.

#### Scenario: Invalid partner email rejected

- **WHEN** `createPartner` receives `contact_email` that is not a valid email
- **THEN** the operation fails without inserting a row

#### Scenario: Partner rename updates events

- **WHEN** a partner with existing events is renamed
- **THEN** all events for that partner reflect the new `partner_name`

#### Scenario: Venue check-in token auto-generated

- **WHEN** `createPartner` is called without a `venue_check_in_token`
- **THEN** a unique token is generated and stored on the new partner row

#### Scenario: Partner create requires structured location and composes address

- **WHEN** `createPartner` is called with street, house number, optional line2, and a valid Berlin zip
- **THEN** the partner row stores those structured fields and a composed display `address`

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

### Requirement: Admin image upload on the application host

Admin partner and event image uploads SHALL succeed on the primary deployed host (Cloudflare Workers). The system SHALL NOT require a separate Node-only process for variant generation in the happy path. Multipart uploads remain SSR form POST only.

#### Scenario: Partner create with logo on Workers

- **WHEN** an admin submits a valid logo file to `/:locale/admin/partners/new` on the Workers deployment
- **THEN** the request completes successfully, six JPEG variants are stored in object storage, and the partner detail/list shows the logo thumbnail

#### Scenario: Event create with image on Workers

- **WHEN** an admin submits a valid event image file to `/:locale/admin/events/new` on the Workers deployment
- **THEN** the request completes successfully, six JPEG variants are stored in object storage, and admin/public surfaces can resolve the image thumbnail URL

#### Scenario: Validation failures still reject uploads

- **WHEN** an admin submits a file that is too large, below minimum dimensions, or provides both upload and remote URL
- **THEN** the request fails with a clear validation error and no incomplete image row/objects are left for that attempt

### Requirement: Image attach orchestration

The catalog domain layer SHALL orchestrate `@unveiled/images` processing, `images` row insertion, S3 upload, and old-image cleanup in a single transaction where applicable: `attachImageToPartner` and `attachImageToEvent` call `processImageFromBuffer` or `processImageFromUrl`, insert an `images` row, upload six variants, and when replacing an existing image delete the prior `images` row and all six bucket objects synchronously.

#### Scenario: Event image attach creates images row

- **WHEN** `attachImageToEvent` succeeds with a valid remote URL
- **THEN** a new `images` row exists with `source = REMOTE_URL` and six objects exist in the bucket

#### Scenario: Image replace deletes old assets

- **WHEN** an event with an existing image is updated with a new image source after the event row references the new `image_id`
- **THEN** the old `images` row and its six bucket objects are removed

### Requirement: Admin event image upload pipeline

Admin event create and edit SHALL persist images exclusively via multipart file upload through the catalog domain layer and `@unveiled/images` pipeline. On successful create, the system SHALL store six JPEG variants in object storage, insert an `images` row with `source=UPLOAD`, and set `events.image_id`. Public variant URLs SHALL be computed via `buildVariantUrl` — not stored as free-text URLs on the event row.

#### Scenario: Create stores six R2 variants

- **WHEN** an ADMIN submits a valid create form with an accepted image file
- **THEN** the event references a new `image_id` and six JPEG objects exist at `images/{image_id}/` in the configured bucket

#### Scenario: Create rejects missing image

- **WHEN** an ADMIN submits a create form without an image file
- **THEN** the form re-renders with a validation error and no event row is created

#### Scenario: Edit replace removes old assets

- **WHEN** an ADMIN edits an event and uploads a new image file
- **THEN** the previous `images` row and its six bucket objects are deleted and the event references the new `image_id`

#### Scenario: Edit without file keeps image

- **WHEN** an ADMIN submits an edit form without a new image file
- **THEN** the existing `image_id` and bucket objects are unchanged

### Requirement: Admin event upload-only form UI

Admin event create and edit forms SHALL NOT expose a remote image URL text field. Image input SHALL use a file upload control (HeroUI `FileTrigger` or equivalent). Edit forms SHOULD display the current event image preview when `image_id` is set.

#### Scenario: No URL field on admin event form

- **WHEN** an ADMIN opens the event create or edit form
- **THEN** no remote image URL text input is shown

#### Scenario: Edit shows current thumbnail preview

- **WHEN** an ADMIN opens edit for an event that has an `image_id`
- **THEN** the form displays a preview using the `small-320` variant URL

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

### Requirement: Optional accessibility and audience metadata without age groups

The system SHALL allow admins to optionally set supported languages, language-independent, and subtitles when creating or editing an event. The system SHALL NOT collect or store barrier-free accessibility or target age groups on events. Barrier-free SHALL be stored only on the hosting partner. `docs/product/features/admin-events.feature` SHALL include a scenario titled `Optional audience metadata without barrier-free`. Playwright SHALL use that title verbatim.

#### Scenario: Optional audience metadata without barrier-free

- **WHEN** I create or edit an event
- **THEN** I can optionally set supported languages, language-independent, and subtitles
- **AND** no barrier-free control is shown
- **AND** no target age groups control is shown

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

### Requirement: Admin event map geolocation with zoom

The admin event form SHALL provide a MapLibre GL JS + OpenStreetMap map **preview** of a **structured** event address geocode instead of free-text latitude, longitude, or map zoom fields. Structured street location (`street`, `house_number`, optional `address_line2` for display only) plus postal fields SHALL be the admin-authored location inputs. When geocoding succeeds (partner prefill and/or structured re-geocode), the system SHALL persist derived `lat` and `lng` on the event record for detail and member map display. The system SHALL NOT persist `map_zoom`. Geocode failure SHALL NOT block saving a valid structured location and MUST NOT invent default-center coordinates. Geocode queries SHALL exclude `address_line2`.

#### Scenario: Admin location via structured geocode preview

- **WHEN** an ADMIN enters or prefills structured location fields that geocode successfully and submits a valid form
- **THEN** the event row stores the geocoded coordinates in `lat` and `lng`
- **AND** the form does not require admin-authored map zoom

#### Scenario: Edit restores map preview from derived coordinates

- **WHEN** an ADMIN opens edit for an event that has `lat` and `lng` set
- **THEN** the map preview initializes centered at those coordinates using a default zoom
- **AND** the marker is not offered as a drag-to-set authoring control

#### Scenario: Geocode failure saves composed address without invented coordinates

- **WHEN** an ADMIN saves a valid structured location that cannot be geocoded and no prior resolved coordinates apply
- **THEN** the event row stores the composed `address`
- **AND** `lat` and `lng` remain null (or unset)
- **AND** no `map_zoom` value is written

### Requirement: Admin event list thumbnails

The admin events list SHALL display a thumbnail for each event with an `image_id`, using the `small-320.jpg` variant URL from `@unveiled/images`.

#### Scenario: List thumbnail from small-320 variant

- **WHEN** an ADMIN views `/admin/events` and an event has a persisted image
- **THEN** the list row shows a thumbnail loaded from `{IMAGE_PUBLIC_BASE_URL}/images/{image_id}/small-320.jpg`

### Requirement: Demo seed idempotency

The `scripts/seed-demo.ts` script invoked by `bun run seed:demo` SHALL insert demo partners and events only when both `partners` and `events` table counts are zero, and SHALL perform no inserts when any partner or event already exists.

#### Scenario: Seed on empty database

- **WHEN** both `partners` and `events` are empty and seed runs
- **THEN** at least one partner and one upcoming event exist

#### Scenario: Seed skipped when data exists

- **WHEN** at least one partner or event exists and seed runs
- **THEN** row counts are unchanged

### Requirement: Demo seed writes JPEG variants

`bun run seed:demo` SHALL populate catalog images through `@unveiled/images` so seeded objects use the six `.jpg` filenames and are viewable on Workers without a separate local upload pass.

#### Scenario: Fresh demo seed

- **WHEN** an operator runs `bun run seed:demo` against a database with R2 configured
- **THEN** seeded events/partners reference images whose public variant URLs end in `.jpg` and resolve successfully

#### Scenario: Seed uses the shared image pipeline

- **WHEN** demo seed creates partners and events with remote or generated image sources
- **THEN** image persistence goes through the catalog domain + `@unveiled/images` sip pipeline (not a sharp-only or WebP-filename side path)

### Requirement: Admin partner SSR CRUD

The web app SHALL expose ADMIN-only SSR routes under `/:locale/admin/partners/*` for list, create, edit, and delete of partner **venue records** (not partner login accounts), using dedicated form POST pages without client-side modals, matching `docs/product/sitemap/sitemap.md`. List route SHALL support `?q=` search on **partner name only** and `?page=` pagination (page size 25) per `docs/product/extras/pagination-and-search.md`. List results SHALL be ordered by `created_at` descending, then `id` descending. Create and edit forms SHALL accept multipart logo file upload or remote logo URL (exactly one source when provided) and delegate validation and image processing to the catalog domain layer.

#### Scenario: Admin creates partner with logo URL

- **WHEN** an ADMIN submits the new partner form with valid name, contact email, address, and a remote logo URL
- **THEN** a partner row is created and the logo is stored via the standard six-variant pipeline

#### Scenario: Admin creates partner with file upload

- **WHEN** an ADMIN submits the new partner form with valid fields and a logo image file (no URL)
- **THEN** a partner row is created and the uploaded logo is processed into six JPEG variants in object storage

#### Scenario: Partner list shows logo thumbnail

- **WHEN** an ADMIN views `/admin/partners` and a partner has a logo
- **THEN** the list displays a thumbnail using the `small-320` variant URL

#### Scenario: Partner validation errors re-render form

- **WHEN** an ADMIN submits a partner form with invalid email or missing required fields
- **THEN** the form re-renders with a validation error, previously entered values preserved, and no partial row is created

#### Scenario: Partner delete blocked when events exist

- **WHEN** an ADMIN confirms delete for a partner that has related events
- **THEN** the delete is rejected with an error message and the partner row remains

#### Scenario: Non-admin forbidden

- **WHEN** a USER or unauthenticated visitor requests `/admin/partners`
- **THEN** access is denied via login redirect or home redirect consistent with auth phase patterns

#### Scenario: Paginated admin partner list

- **WHEN** an ADMIN opens `/admin/partners?page=1`
- **THEN** partners are listed with SSR-rendered pagination controls and a server-side total count

#### Scenario: Admin partner list search by name

- **WHEN** an ADMIN opens `/admin/partners?q=berghain`
- **THEN** only partners whose **name** matches the query (case-insensitive) are listed and pagination totals reflect the filtered count

#### Scenario: Admin partner list newest first

- **WHEN** an ADMIN opens `/admin/partners` without filters
- **THEN** partners appear with the most recently created row first

#### Scenario: Partner list page clamp

- **WHEN** an ADMIN opens `/admin/partners?page=99` and fewer than 99 pages of results exist
- **THEN** the server redirects to the last valid page or equivalent clamp so the table is not empty solely due to an out-of-range page number

### Requirement: Admin dashboard demo seed control

The `/:locale/admin` dashboard SHALL display quick links to admin sections and a control to run demo seed data only when both partners and events tables are empty, invoking the same `runDemoSeed` logic as `bun run seed:demo`.

#### Scenario: Seed on empty database from dashboard

- **WHEN** both partners and events are empty and an ADMIN submits the dashboard seed action
- **THEN** demo partners and events are created and the seed control is no longer shown

#### Scenario: Seed button hidden after data exists

- **WHEN** at least one partner or event exists
- **THEN** the dashboard does not offer the empty-DB seed action

### Requirement: Admin event SSR CRUD

The web app SHALL expose ADMIN-only SSR routes under `/:locale/admin/events/*` for list, single create, edit, delete, redemption code export, gallery management, and clone (`/:locale/admin/events/:id/clone`), using dedicated form POST pages without client-side modals, matching `docs/product/sitemap/sitemap.md` and `docs/product/features/admin-events.feature`. Series create (`/:locale/admin/events/series/new`) SHALL NOT be offered. Admin event management SHALL NOT be scoped to a single partner — admins select the partner per event from admin-managed partner records on create/edit. Create and edit forms SHALL accept multipart **file upload** for images (required on create; optional replace on edit) and delegate validation, image processing, and storage to the catalog domain layer and `@unveiled/images`. Clone SHALL reuse the source event primary image id and SHALL NOT require a new image upload. Admin event forms SHALL NOT accept remote image URL paste. Admin parsers and forms SHALL NOT accept or persist `secret_code_mode`. Ticket type options SHALL use `SECRET_CODE` | `VOUCHER_PROMO` | `VOUCHER_PDF`.

#### Scenario: Admin creates event with required image upload

- **WHEN** an ADMIN submits a valid new event form with a file upload
- **THEN** the event is persisted with `image_id` set and six JPEG variants stored in object storage

#### Scenario: Event image required on create

- **WHEN** an ADMIN submits a create form without a file upload
- **THEN** the form re-renders with a validation error and no event row is created

#### Scenario: Conflicting image sources rejected

- **WHEN** an ADMIN submits a create or edit form with both a file upload and a remote URL
- **THEN** the form re-renders with a validation error and no partial write occurs

#### Scenario: Admin clones event with new dateTime

- **WHEN** an ADMIN opens clone for an existing event, submits a date/time, and confirms
- **THEN** a distinct event row exists with copied catalog metadata and the submitted date/time
- **AND** the admin is redirected to an admin events surface for the new event or list

#### Scenario: Series create route not offered

- **WHEN** an ADMIN uses the admin Events UI
- **THEN** no series create CTA or `/admin/events/series/new` authoring surface is offered

#### Scenario: Redemption validation on create

- **WHEN** an ADMIN creates a `VOUCHER_PROMO` event omitting `event_website_url`
- **THEN** creation is rejected until the website URL is provided

#### Scenario: Secret code required for secret-code tickets

- **WHEN** an ADMIN creates a `SECRET_CODE` event with no secret code
- **THEN** creation is rejected until a secret code is provided

#### Scenario: Edit replaces event image

- **WHEN** an ADMIN edits an event and supplies a new image file upload
- **THEN** the old `images` row and its six bucket objects are removed and the event references the new image

#### Scenario: Delete event removes image assets

- **WHEN** an ADMIN confirms delete for an event
- **THEN** the event row is removed and its associated `images` row and bucket objects are deleted synchronously

#### Scenario: Non-admin forbidden

- **WHEN** a USER or unauthenticated visitor requests `/admin/events`
- **THEN** access is denied via login redirect or home redirect consistent with auth phase patterns

#### Scenario: Product docs match clone SSR routes

- **WHEN** an implementer reads `docs/product/sitemap/sitemap.md` and `docs/product/features/admin-events.feature` after this change
- **THEN** they document `/admin/events/:id/clone` and do not require series create as current MVP behavior

### Requirement: Admin event list discovery aids

The admin events list at `/:locale/admin/events` SHALL support GET filters and pagination (`?title=&partner=&language=&page=`, page size 25) per `docs/product/extras/pagination-and-search.md`. Title SHALL be a case-insensitive substring filter matching `title_de` **or** `title_en`. Partner SHALL be a case-insensitive substring filter on denormalized partner name. Language (`language`, ISO 639-1 alpha-2) SHALL match events whose spoken `languages` array contains the code **or** whose `subtitle_languages` array contains the code (case-insensitive). Default list order SHALL be `created_at` descending, then `id` descending (URL omits `sort`/`dir` for that default). The list SHALL offer server-driven sorting by Title, Partner, Date, Created, and Capacity via **clickable table column headers** (not search-bar controls), using query params `sort` (`title` | `partner` | `date` | `created` | `capacity`) and `dir` (`asc` | `desc`). Title column sort SHALL use canonical `title` (German denormalized copy). Filter submit SHALL preserve active sort via hidden fields; column sort SHALL preserve `title`/`partner`/`language`. A **Reset filters** control SHALL clear filters and sort params. The list SHALL display a `small-320` thumbnail for each event's image when present, plus title, partner, languages (or language-independent label), subtitle language (or em dash when none), date/time (Europe/Berlin), created timestamp, capacity, and row actions for edit, delete, codes export, and clone. The list SHALL NOT include a series create CTA.

#### Scenario: Paginated admin event list

- **WHEN** an ADMIN opens `/admin/events?page=1`
- **THEN** events are listed with SSR-rendered pagination controls and a server-side total count

#### Scenario: Admin event list search

- **WHEN** an ADMIN opens `/admin/events?q=berghain`
- **THEN** only events whose title or denormalized partner name matches the query (case-insensitive) are listed and pagination totals reflect the filtered count

#### Scenario: Admin event list newest first

- **WHEN** an ADMIN opens `/admin/events` without filters
- **THEN** events appear with the most recently created row first

#### Scenario: Sort by title ascending

- **WHEN** an ADMIN clicks the Title column header on the event list
- **THEN** the list orders by title ascending (or toggles direction if Title is already active)

#### Scenario: Search preserves sort

- **WHEN** an ADMIN has a non-default sort and submits a title/partner search
- **THEN** the resulting URL retains `sort` and `dir` together with `q`

#### Scenario: Reset filters clears search and sort

- **WHEN** an ADMIN follows Reset filters with an active query and/or non-default sort
- **THEN** the list returns to `/admin/events` with default last-created ordering and no search query

#### Scenario: Event list page clamp

- **WHEN** an ADMIN opens `/admin/events?page=99` and fewer than 99 pages of results exist
- **THEN** the server redirects to the last valid page or equivalent clamp so the table is not empty solely due to an out-of-range page number

#### Scenario: Event list shows image thumbnail

- **WHEN** an ADMIN views `/admin/events` and an event has an image
- **THEN** the list displays a thumbnail using the `small-320` variant URL

#### Scenario: List offers clone action

- **WHEN** an ADMIN views the events list with at least one event
- **THEN** each row includes a Clone action to `/:locale/admin/events/:id/clone`

#### Scenario: Language filter matches any subtitle code

- **WHEN** an ADMIN lists events with `language=EN`
- **THEN** events whose spoken `languages` contain `EN` **or** whose `subtitle_languages` contain `EN` (case-insensitive) are included

#### Scenario: Title filter matches either locale

- **WHEN** an ADMIN lists events with `title=Concert`
- **THEN** events whose `title_en` contains "Concert" are included even if `title_de` does not

### Requirement: Admin redemption codes CSV export

The route `/:locale/admin/events/:id/codes` SHALL respond to GET with a CSV download for the given event, delegating content generation to `exportRedemptionCodesCsv` in the catalog domain layer. Until Phase 6 bookings exist, an empty or header-only CSV is acceptable.

#### Scenario: CSV export download

- **WHEN** an ADMIN requests `/admin/events/:id/codes` for an existing event
- **THEN** the response is `text/csv` with a `Content-Disposition` attachment filename and CSV body from the domain export function

#### Scenario: CSV export for missing event

- **WHEN** an ADMIN requests codes export for a non-existent event id
- **THEN** the server responds with 404

### Requirement: EventCard public component

The `@unveiled/ui` package SHALL export an `EventCard` component matching `docs/product/ui/ui-component-map.md` (product SoT updates for CTA copy may lag until hardening), using image variants `medium-640` and `small-320` via srcset. The primary CTA SHALL use the label **Book Now** / **Bin dabei** when remaining capacity is greater than zero, for both guests and signed-in members regardless of subscription status. When remaining capacity is zero, the CTA SHALL use **Waitlist** / **Warteliste**. The primary CTA SHALL navigate to the public event detail route `/:locale/events/:id` and SHALL NOT navigate directly to `/events/:id/book` or `/membership`.

#### Scenario: Guest Book Now opens detail

- **WHEN** a guest views an EventCard with remaining capacity
- **THEN** the primary CTA label is Book Now (or Bin dabei)
- **AND** following the CTA opens `/:locale/events/:id` without authentication

#### Scenario: Member Book Now regardless of subscription

- **WHEN** a signed-in member with inactive subscription views an EventCard with remaining capacity
- **THEN** the primary CTA label is Book Now (or Bin dabei)

#### Scenario: Sold-out Waitlist label

- **WHEN** any viewer sees an EventCard with zero remaining capacity
- **THEN** the primary CTA label is Waitlist (or Warteliste)

#### Scenario: Bookmark control accessibility

- **WHEN** EventCard renders a save toggle
- **THEN** the control exposes an `aria-label` describing save/unsaved state

### Requirement: EventCard hover affordance

On devices that support hover, the `EventCard` SHALL colorize the grayscale cover image and emphasize the card with a layout-neutral hard-offset border shadow and slight scale. The card SHALL NOT show an availability / capacity yellow strip. Hover transitions on the image SHALL be disabled or near-instant when the user prefers reduced motion. Date and credit price on the card SHALL be visible only for members with an active subscription; guests and inactive members SHALL NOT see those fields on the card.

#### Scenario: Pointer hover colorizes cover image

- **WHEN** a user with a hover-capable pointer moves over an EventCard that shows a cover image
- **THEN** the cover image leaves grayscale and appears in full color
- **AND** no availability strip is shown

#### Scenario: Reduced motion prefers less transition

- **WHEN** the user has `prefers-reduced-motion: reduce`
- **THEN** hover transitions on the EventCard image are disabled or near-instant

#### Scenario: Guests do not see date or credits on the card

- **WHEN** a guest views Discover EventCards
- **THEN** date and credit price are not shown on the card

### Requirement: EventCard hover documented in stories

`@unveiled/ui` EventCard Ladle stories SHALL include a state that demonstrates the hover colorize (or an equivalent forced-visible preview) so theme reviews do not require a live browser hover. The product UI component map SHALL describe the EventCard hover contract without an availability strip, and SHALL note that date/credits are subscribed-member-only.

#### Scenario: Story shows colorized cover

- **WHEN** a developer opens the EventCard hover-preview story
- **THEN** the cover is colorized without requiring a pointer hover

#### Scenario: Product map matches subscriber-only meta

- **WHEN** an implementer reads the EventCard entry in `docs/product/ui/ui-component-map.md`
- **THEN** the description states date/credits are for subscribed members only and that there is no availability strip

### Requirement: Discover page live event preview

The public locale home `/:locale` (Discover) SHALL render up to six upcoming events from the database using EventCard components instead of static placeholder content.

#### Scenario: Discover shows upcoming catalog events

- **WHEN** at least one future event exists in the catalog
- **THEN** `/` (locale home) displays up to six EventCards ordered by ascending `date_time`

### Requirement: Event description is Markdown at rest

The system SHALL store each event's `description` as Markdown text in `events.description` (existing text column; no separate HTML column). Product schema documentation SHALL state that `events.description` is Markdown text at rest, rendered with GFM on public detail and authored via MDXEditor in admin.

#### Scenario: Plain text remains valid

- **WHEN** an event description contains only plain paragraphs without Markdown syntax
- **THEN** public rendering shows the same readable text as before

#### Scenario: Schema documentation matches storage

- **WHEN** an implementer reads `docs/product/database/schema-overview.md` for `events.description`
- **THEN** the field is documented as Markdown at rest (not opaque plain-only text)

### Requirement: Demo seed includes Markdown description

Demo seed data SHALL include at least one upcoming event whose description uses multi-block Markdown (heading, list, and a link) so staging demos exercise the render pipeline. The seed path remains the Abundo fixture consumed by `@unveiled/db` catalog seed (`fixtures/abundo-berlin-demo.json` via `seed-data.ts`).

#### Scenario: Seeded Markdown event

- **WHEN** demo seed runs on an empty catalog
- **THEN** at least one seeded event description contains Markdown structure beyond a single plain paragraph (heading, list, and a link)

### Requirement: Product schema documents Markdown description

Product schema documentation (`docs/product/database/schema-overview.md`) SHALL state that `events.description` is Markdown text at rest, rendered with GFM on public detail and authored via MDXEditor in admin. Canonical UI docs SHALL record the public `MarkdownContent` surface and the admin MDXEditor form-control exception (`ui-component-map.md`, `design-system.md`, `docs/COMPONENTS.md`) and SHALL log the decision in `gaps-and-decisions.md`.

#### Scenario: Schema overview notes Markdown at rest

- **WHEN** an agent reads the `events.description` field documentation in `schema-overview.md`
- **THEN** it states that the value is Markdown text at rest

#### Scenario: Design system lists MDXEditor exception

- **WHEN** an agent reads `docs/product/ui/design-system.md` form-control exceptions
- **THEN** MDXEditor is listed alongside the existing image-upload / geo-picker / `@better-auth-ui/*` exceptions

### Requirement: Public event detail renders Markdown with GFM

The system SHALL render the event description on the public event detail page using Markdown with GitHub-Flavored Markdown (GFM) extensions, without executing or embedding raw HTML from the description.

#### Scenario: Emphasis and lists render

- **WHEN** a guest opens `/:locale/events/:id` for an event whose description includes emphasis and a Markdown list
- **THEN** the identity column shows formatted emphasis and list structure rather than raw Markdown markers

### Requirement: SEO and JSON-LD use plain text from Markdown

The system SHALL derive meta description and `schema.org/Event` `description` from a plain-text extraction of the Markdown description (then truncate for meta as today).

#### Scenario: Meta description has no Markdown markers

- **WHEN** an event description contains Markdown markers such as `**bold**` or `# Heading`
- **THEN** the SSR `<meta name="description">` and JSON-LD `description` contain the readable plain text without those markers

### Requirement: Public event detail page

The web app SHALL serve `/:locale/events/:id` without requiring authentication for guests and crawlers, presenting a checkout-focused layout: an identity column (category // partner, title, **description rendered as Markdown/GFM** via the shared Markdown pipeline, location, hero image) and a summary/action card showing ticket quantity affordance (when applicable), contextual membership/auth messaging, and the primary next-step CTA. Membership credit cost/total and event date/time chrome SHALL be visible only to booking-eligible viewers (SSR `EventDetailViewer.kind === "eligible"` / `ACTIVE` + `CANCELLED_PENDING`); guests and other non–booking-eligible signed-in viewers SHALL NOT see those fields in the page UI. On large viewports the identity column and summary card SHALL share a common top alignment within the main content grid. The hero image SHALL span the identity column width and use responsive sizing appropriate to sm/md/lg viewports (not a permanently undersized inset box). Share/OG metadata SHALL continue to be rendered, with meta description and JSON-LD `description` derived from plain-text extraction of the Markdown description. JSON-LD `schema.org/Event` MAY still include `startDate` for crawlers even when UI date chrome is gated. Product docs under `docs/product/` (sitemap auth column, SEO indexability, authorization matrix) SHALL mark this route as public (`Auth` empty/`—`, not USER-required). Bookable future events (`date_time` in the future and remaining capacity > 0) SHALL be indexable; sold-out and past events SHALL still render HTTP 200 with a clear state and `noindex, follow`. Booking, waitlist, and save mutations SHALL remain on dedicated authenticated routes; the detail page SHALL NOT create bookings or ledger entries. A close control SHALL navigate via Link to Discover or the member events feed (or a safe `returnTo`), not dismiss a client-only modal.

#### Scenario: Guest opens a shared event link

- **WHEN** a guest opens `/:locale/events/:id` for a published upcoming event
- **THEN** the SSR page renders event content and share/OG metadata without requiring login

#### Scenario: Guest sees checkout card

- **WHEN** a guest opens `/:locale/events/:id` for a bookable upcoming event
- **THEN** they see event identity content and a summary card with a login (or equivalent unlock) CTA
- **AND** they do not see membership credit totals or event date/time chrome
- **AND** they are not forced through auth before viewing the page

#### Scenario: Booking-eligible member sees credits and date

- **WHEN** a booking-eligible member opens the same bookable event detail
- **THEN** membership credit total and event date/time chrome remain visible
- **AND** the primary CTA continues to support booking

#### Scenario: Guest sees aligned checkout composition on large viewport

- **WHEN** a guest opens a valid upcoming event detail URL on a large viewport
- **THEN** the identity content and summary card begin at approximately the same vertical origin
- **AND** the hero image fills the identity column width

#### Scenario: Stacked layout on small viewport

- **WHEN** a guest opens the same page on a small viewport
- **THEN** identity content stacks above the summary card without overlapping the close control

#### Scenario: Eligible member continues to SSR book

- **WHEN** a booking-eligible member opens the same detail page
- **THEN** the primary CTA continues to the dedicated SSR book route `/:locale/events/:id/book`
- **AND** credit deduction still occurs only via the booking domain on that SSR flow

#### Scenario: Close returns to browse

- **WHEN** a visitor activates the detail page close control
- **THEN** they navigate to Discover or the member events feed (as appropriate) rather than dismissing a client-only modal

#### Scenario: Unauthenticated event detail

- **WHEN** a visitor opens a valid upcoming event detail URL
- **THEN** the page returns 200 with hero srcset, identity content, partner/location info, and a checkout summary card whose booking CTA links to login or membership — not an auth redirect

#### Scenario: Event detail Open Graph image

- **WHEN** the event detail HTML is rendered
- **THEN** `og:image` and `twitter:image` reference the event's `og-1200x630` variant URL

#### Scenario: Event JSON-LD stub

- **WHEN** the event detail HTML is rendered
- **THEN** a `schema.org/Event` JSON-LD block includes at minimum name, startDate, location, image (hero-1920 URL), description (plain text derived from Markdown), and organizer

#### Scenario: Unknown event id

- **WHEN** the id does not exist
- **THEN** the server renders a locale-aware 404 page

#### Scenario: Product sitemap marks detail public

- **WHEN** an agent reads `docs/product/sitemap/sitemap.md` after this change
- **THEN** `/events/:id` has Auth empty/`—` (not USER-required) while `/events/:id/book` and waitlist remain gated

#### Scenario: Identity description renders Markdown

- **WHEN** a guest opens `/:locale/events/:id` for an event whose description includes Markdown emphasis or a list
- **THEN** the identity column presents rendered Markdown/GFM rather than a single unparsed plain-text paragraph

### Requirement: Detail checkout quantity affordance

The public event detail summary card ticket quantity control SHALL use guest max 3 and signed-in max derived from session credits and event remaining capacity (see booking ticket-count bounds). Quantity on detail remains navigation state only (`qty` query) and SHALL NOT create bookings or ledger entries.

#### Scenario: Eligible member sees credit-aware max on detail

- **WHEN** an eligible member opens event detail with enough credits for more than 3 tickets and sufficient capacity
- **THEN** the quantity control can increase beyond 3 up to that computed max

#### Scenario: Guest detail qty stays at three

- **WHEN** a guest opens the same bookable event detail page
- **THEN** the quantity control does not offer a value above 3

### Requirement: Public event detail below-fold metadata

The public event detail page SHALL present below-the-fold DETAILS metadata in a dense, scannable layout that uses horizontal space on medium and large viewports (multi-column label/value grid), rather than a single sparse vertical list inside a wide empty card. The date/time (“when”) metadata cell SHALL be included only for booking-eligible viewers; other applicable DETAILS fields remain for all viewers. LOCATION SHALL show the address and embedded map with chrome that does not leave large unused bands beside the map content. Visual language SHALL remain consistent with Discover EventCard density (uppercase labels, clear hierarchy) while staying on the event-detail surface.

#### Scenario: DETAILS uses horizontal space on large viewport

- **WHEN** a user views an event detail page with multiple metadata fields on a large viewport
- **THEN** DETAILS fields appear in a multi-column grid
- **AND** large empty horizontal regions inside the DETAILS card are avoided

#### Scenario: Guest DETAILS omits date/time cell

- **WHEN** a guest (or other non–booking-eligible viewer) opens public event detail
- **THEN** the DETAILS block does not show the date/time metadata cell
- **AND** other applicable DETAILS fields may still render

#### Scenario: LOCATION shows address and full-width map

- **WHEN** the event has coordinates
- **THEN** the LOCATION block shows the address and a map that spans the content width of its card

### Requirement: Automated browser coverage for admin catalog management

Each Gherkin scenario in `docs/product/features/admin-events.feature` and `docs/product/features/admin-partners.feature` SHALL have a Playwright test with a title matching the scenario line (or Scenario Outline plus example row). Partner scenarios SHALL live in `e2e/specs/admin-partners.spec.ts` and event scenarios in `e2e/specs/admin-events.spec.ts`. Tests SHALL sign in as ADMIN via `loginAsAdmin` / `E2E_ADMIN_*`, use proximity selectors only, and use unique timestamp suffixes for created partner/event names and portal emails. Image upload/URL processing tests SHALL call `test.skip` with reason `R2 vars not configured` when any required R2 env var (`S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `IMAGE_PUBLIC_BASE_URL`) is missing. Image specs SHALL NOT skip solely because the target host is Cloudflare Workers; `e2e/README.md` SHALL allow running image uploads against `bun run dev` and, when configured, against a Workers preview or staging base URL. Series create scenarios SHALL NOT remain in the suite; clone scenarios SHALL be covered (or named env-deferred).

#### Scenario: Admin partner CRUD is E2E-verified

- **WHEN** an ADMIN runs `e2e/specs/admin-partners.spec.ts`
- **THEN** partner create/edit/delete, logo upload or URL, name propagation, QR regeneration, and portal-access flows are asserted in the browser

#### Scenario: Admin event CRUD is E2E-verified

- **WHEN** an ADMIN runs `e2e/specs/admin-events.spec.ts`
- **THEN** single event creation, clone (happy path; voucher inventory reject when practical), image required/upload/URL, redemption validation, capacity recalculation, edit, delete, optional metadata, export (or explicit skip with reason), and seed-demo behaviors are asserted
- **AND** series create builders are not exercised as current MVP UI

#### Scenario: Published events surface on public pages

- **WHEN** an admin creates or edits an event via the E2E flow
- **THEN** the event appears on the locale home (Discover) and is viewable on `/events/:id` without authentication
- **AND** after a partner rename, the updated partner name is visible on discover for that partner's events

#### Scenario: Image tests skip when R2 is unavailable

- **WHEN** R2 / image env vars are not fully configured
- **THEN** image upload and remote-URL processing tests skip with an explicit reason string
- **AND** they do not fail the suite

#### Scenario: E2E docs do not require sharp-only local uploads

- **WHEN** an operator reads `e2e/README.md` image-test guidance
- **THEN** the docs do not state that admin uploads require `bun run dev` + `sharp` or that Workers preview cannot upload

### Requirement: Featured events curation store

The system SHALL persist an admin-curated featured event list in a dedicated `featured_events` table keyed by existing `events.id`, without duplicating event payload columns. Each row SHALL store `event_id` (PK, FK → `events.id` ON DELETE CASCADE), `sort_order` (integer, not null), and `created_at` (timestamptz, not null, default now). The `@unveiled/db` catalog domain SHALL expose helpers to list featured events (optional upcoming-only filter using UTC `now` against `events.date_time`), list featured event ids, search catalog events excluding already-featured rows (title/partner search consistent with `listEvents`), add a featured row with append `sort_order` (reject missing or already-featured events), remove one or many featured rows without deleting the underlying `events` rows, and reorder the current featured set.

Reorder SHALL accept an ordered list of event ids that is a permutation of the current featured membership (same ids, same length, no duplicates). The domain SHALL persist `sort_order` as `0..n-1` in that order. A list that is missing, extra, or duplicated relative to the current set SHALL fail with a catalog validation error and SHALL NOT leave a partial order. Removing from featured SHALL delete only `featured_events` rows.

#### Scenario: Featured row references catalog event

- **WHEN** an event is added to the featured list
- **THEN** a `featured_events` row is stored for that `event_id` with a `sort_order`
- **AND** the underlying `events` row remains unchanged

#### Scenario: Remove from featured does not delete event

- **WHEN** one or more events are removed from the featured list
- **THEN** only those `featured_events` rows are deleted
- **AND** the `events` rows still exist

#### Scenario: Reorder featured events

- **WHEN** `reorderFeaturedEvents` is called with a permutation of the current featured event ids
- **THEN** `listFeaturedEvents` returns those events in the submitted order with `sort_order` `0..n-1`

#### Scenario: Invalid featured events reorder rejected

- **WHEN** `reorderFeaturedEvents` is called with a list that is not a permutation of the current featured set
- **THEN** the operation fails with a catalog validation error
- **AND** existing `sort_order` values are unchanged

#### Scenario: Deleting an event clears featured membership

- **WHEN** a catalog event is deleted
- **THEN** any `featured_events` row for that event is removed via FK cascade

#### Scenario: Duplicate feature rejected

- **WHEN** `addFeaturedEvent` is called for an `event_id` that is already featured
- **THEN** the operation fails without inserting a second row

#### Scenario: Upcoming filter on featured list

- **WHEN** `listFeaturedEvents` is called with upcoming-only enabled and a fixed `now`
- **THEN** only featured events with `date_time >= now` are returned
- **AND** results are ordered by `sort_order` then `date_time`

### Requirement: Event gallery images

The system SHALL allow zero or more gallery images per event, stored separately from the required primary `events.image_id`. Gallery membership SHALL be persisted in `event_gallery_images` with `event_id` (FK → `events.id` ON DELETE CASCADE), `image_id` (FK → `images.id` ON DELETE RESTRICT), and `sort_order` (integer, not null), using composite primary key `(event_id, image_id)`. The `@unveiled/db` catalog domain SHALL expose helpers to list gallery images for an event ordered by `sort_order` ascending, add one or more gallery images with append `sort_order` (reject when the event is missing; **no hard count cap**), and remove one or more gallery image ids (delete join rows and, when unreferenced, delete `images` rows and bucket objects per image-upload cleanup rules). Adding or removing gallery images MUST NOT replace or clear the primary hero `events.image_id`. Deleting an event MUST remove its gallery join rows (via cascade) and clean up gallery image records/objects in the same delete flow as the primary image.

#### Scenario: Add gallery images to an event

- **WHEN** an authorized admin adds one or more gallery images to an event
- **THEN** those images are listed for that event in `sort_order` ascending
- **AND** the primary hero `events.image_id` is unchanged

#### Scenario: Remove gallery images

- **WHEN** an authorized admin removes one or more gallery image ids from an event
- **THEN** those gallery associations are deleted
- **AND** unreferenced image objects are removed per image-upload cleanup rules
- **AND** the primary hero `events.image_id` is unchanged

#### Scenario: Deleting an event cleans gallery images

- **WHEN** a catalog event with gallery images is deleted
- **THEN** `event_gallery_images` rows for that event are removed via FK cascade
- **AND** the former gallery `images` rows and bucket objects are deleted in the same delete flow (respecting `skipBucket` in tests)

### Requirement: Event subtitles metadata

Events SHALL support `has_subtitles` (boolean, not nullable, default `false`) and nullable `subtitle_languages` (`text[]` of unique uppercase ISO 639-1 alpha-2 codes). Catalog create/update SHALL require a non-empty valid ISO 639-1 list when `has_subtitles` is true, and SHALL persist `subtitle_languages = null` when `has_subtitles` is false (coercing any submitted codes away). Duplicate codes SHALL be collapsed case-insensitively, preserving first-seen order. Subtitle languages are **not** limited to spoken-event `EVENT_LANGUAGES`. Subtitle fields SHALL remain independent of spoken `languages` / `language_independent`. `cloneEvent` SHALL copy `has_subtitles` and `subtitle_languages`. A migration SHALL copy each existing non-null `subtitle_language` into a one-element `subtitle_languages` array before dropping `subtitle_language`. The product schema overview SHALL document `has_subtitles` and `subtitle_languages`.

#### Scenario: Create with subtitles requires allowlisted language

- **WHEN** `createEvent` is called with `hasSubtitles = true` and a missing, empty, or non-allowlisted `subtitleLanguages` list
- **THEN** the call is rejected with `INVALID_SUBTITLE_LANGUAGE`

#### Scenario: Create without subtitles clears language

- **WHEN** `createEvent` is called with `hasSubtitles = false` and a non-null `subtitleLanguages` list
- **THEN** the persisted event has `has_subtitles = false` and `subtitle_languages = null`

#### Scenario: Duplicate codes are unique-cased

- **WHEN** `createEvent` is called with `hasSubtitles = true` and `subtitleLanguages = ["en", "DE", "EN"]`
- **THEN** the persisted `subtitle_languages` is `{EN,DE}`

#### Scenario: Existing single language becomes a one-element list

- **WHEN** the migration runs for a row with `has_subtitles = true` and `subtitle_language = 'EN'`
- **THEN** the row has `subtitle_languages = {EN}`

#### Scenario: Language filter matches any subtitle code

- **WHEN** an admin list `language=EN` filter is applied
- **THEN** events whose spoken `languages` contain `EN` **or** whose `subtitle_languages` contain `EN` (case-insensitive) are included

#### Scenario: Subtitles independent of language-independent

- **WHEN** `createEvent` succeeds with `languageIndependent = true`, `hasSubtitles = true`, and a valid `subtitleLanguages` list
- **THEN** the event is persisted with `languages = null`, `has_subtitles = true`, and the given `subtitle_languages`

#### Scenario: Clone copies subtitle metadata

- **WHEN** `cloneEvent` is called for a source event with `has_subtitles = true` and `subtitle_languages = {DE,EN}`
- **THEN** the cloned event has the same `has_subtitles` and `subtitle_languages` values

### Requirement: Event title and description have DE and EN fields

Events SHALL store `title_de`, `title_en`, `description_de`, and `description_en` (non-null text). Catalog create/update SHALL require non-empty trimmed titles and non-empty descriptions for **both** locales. Canonical `title` and `description` SHALL be denormalized on write from the German fields (`title_de` / `description_de`). A migration SHALL copy each existing `title` into both `title_de` and `title_en`, and each existing `description` into both description locale columns. `cloneEvent` SHALL copy all four locale columns plus canonical `title` / `description`. Title substring search (admin `title=`, member feed `title=`, and other catalog title ILIKE filters) SHALL match `title_de` or `title_en` (case-insensitive). `@unveiled/db` SHALL export `resolveEventCopy` that returns title and description for a requested locale, falling back to the other locale, then to canonical `title` / `description`. Admin create/update SHALL post locale field names (`title_de`, `title_en`, `description_de`, `description_en`) and SHALL pass those locale fields into catalog create/update (no single `title` / `description` wrap on the admin write path). Non-admin callers (seed, tests) MAY still pass a single `title` / `description` into the domain coerce.

#### Scenario: Backfill copies the existing title into both locales

- **WHEN** the migration runs for an event titled "Jazz Night"
- **THEN** `title_de` and `title_en` are both "Jazz Night"
- **AND** canonical `title` remains "Jazz Night"

#### Scenario: Backfill copies the existing description into both locales

- **WHEN** the migration runs for an event whose `description` is "Live set"
- **THEN** `description_de` and `description_en` are both "Live set"
- **AND** canonical `description` remains "Live set"

#### Scenario: Create requires both locales

- **WHEN** `createEvent` is called with only `titleDe` and an empty `titleEn`
- **THEN** the call is rejected

#### Scenario: Create requires both descriptions

- **WHEN** `createEvent` is called with a non-empty `descriptionDe` and an empty `descriptionEn`
- **THEN** the call is rejected

#### Scenario: Canonical title is German

- **WHEN** `createEvent` succeeds with `titleDe = "Konzert"` and `titleEn = "Concert"`
- **THEN** persisted `title` is "Konzert"

#### Scenario: Canonical description is German

- **WHEN** `createEvent` succeeds with `descriptionDe = "Auf Deutsch"` and `descriptionEn = "In English"`
- **THEN** persisted `description` is "Auf Deutsch"

#### Scenario: Legacy single title is copied into both locales

- **WHEN** `createEvent` is called with `title = "Jazz Night"` and `description = "Live set"` and without locale fields
- **THEN** `title_de` and `title_en` are both "Jazz Night"
- **AND** `description_de` and `description_en` are both "Live set"
- **AND** canonical `title` is "Jazz Night"

#### Scenario: Title search matches either locale

- **WHEN** an admin or member title filter is `Concert`
- **THEN** an event whose `title_en` contains "Concert" is included even if `title_de` does not

#### Scenario: Clone copies locale columns

- **WHEN** `cloneEvent` is called for a source with `title_de = "Konzert"` and `title_en = "Concert"`
- **THEN** the cloned event has the same `title_de`, `title_en`, `description_de`, `description_en`, and canonical `title` / `description`

#### Scenario: Resolve prefers the requested locale

- **WHEN** `resolveEventCopy` is called with locale `en` for an event with `title_en = "Concert"` and `title_de = "Konzert"`
- **THEN** the resolved title is "Concert"

#### Scenario: Resolve falls back to the other locale then canonical

- **WHEN** `resolveEventCopy` is called with locale `en` for an event whose `title_en` is empty and `title_de` is "Konzert"
- **THEN** the resolved title is "Konzert"
- **AND** when both locale titles are empty the resolved title is canonical `title`

#### Scenario: Admin form posts locale field names

- **WHEN** an admin submits create or edit
- **THEN** the parser reads `title_de`, `title_en`, `description_de`, and `description_en`
- **AND** posted `title` / `description` are ignored

### Requirement: Admin authors Markdown description

Admin create/edit SHALL present **two** Markdown description editors and **two** title fields, one per locale (`de`, `en`), stacked German then English on the General step (no nested locale tablist). Submitting SHALL persist `description_de` / `description_en` / `title_de` / `title_en`. Canonical `title` / `description` remain DE-derived on write. Empty or whitespace-only values for either locale SHALL be rejected. Both description editors SHALL submit hidden native Markdown fields; the Markdown/MDX pipeline SHALL NOT change.

#### Scenario: Admin authors both locale titles

- **WHEN** I create an event with title DE "Konzert" and title EN "Concert" plus both descriptions
- **THEN** the event is saved with those locale fields
- **AND** canonical `title` is "Konzert"

#### Scenario: Admin authors both locale descriptions

- **WHEN** I create an event with a German Markdown description and a distinct English Markdown description
- **THEN** both `description_de` and `description_en` are persisted
- **AND** canonical `description` equals the German Markdown

#### Scenario: Missing English title is rejected

- **WHEN** I submit create or edit with a German title and an empty English title
- **THEN** the event is not saved
- **AND** the form re-renders on General with a title-required error for the English field

### Requirement: Admin event create and edit use a three-step form

Admin create (`/:locale/admin/events/new`) and edit (`/:locale/admin/events/:id/edit`) SHALL present fields in three steps with visible progress: (1) general — partner, **German then English title**, **German then English Markdown description**, structured location, category, event type, tags, language metadata; (2) Date & tickets — Timing mode; then Capacity allocation and the capacity number (visible for every ticket type); then ticket type, secret code or voucher inventory; then the range builder and editable datetime list; then totals (credits, datetime capacity, and available codes/tickets for voucher types); (3) image — primary image upload (required on create; optional replace on edit). The system SHALL keep all fields in a single SSR `POST` form. Inactive steps SHALL remain in the document so their values submit. Clone SHALL remain a separate dates/inventory form but SHALL expose Timing mode and Capacity allocation as editable controls (not hidden-only fields) so All day vs Time slot and Shared vs Per date UI matches create/edit. General SHALL NOT use a nested locale tablist for title/description.

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

#### Scenario: General stacks DE then EN copy fields

- **WHEN** I open create or edit event on General
- **THEN** I see German title and description fields above English title and description fields
- **AND** I do not see a nested locale tablist for those fields

### Requirement: Event wizard restores unsaved drafts

Admin event create and edit wizards SHALL persist in-progress field values in browser `localStorage` (not cookies) keyed per create-session or event id, restore them after a refresh or step URL change, and clear them after a successful create or save POST. Raw `File` inputs SHALL NOT be stored. Create GET on `/:locale/admin/events/new/dates` and `/:locale/admin/events/new/image` SHALL render those steps (no redirect to step 1) so a restored draft can populate the form. A visible restore notice SHALL offer Discard draft.

#### Scenario: Refresh on an edit step keeps unsaved title

- **WHEN** an admin changes the title on `/:locale/admin/events/:id/edit` and refreshes
- **THEN** the title field still shows the unsaved value
- **AND** a discard control is available

#### Scenario: Edit step link keeps unsaved dates

- **WHEN** an admin changes a datetime row on step 2, then follows the General step link
- **THEN** returning to Date & tickets still shows the unsaved datetime row

#### Scenario: Successful save clears the draft

- **WHEN** an admin saves the event successfully
- **THEN** reopening the edit form shows database values, not the previous unsaved draft

#### Scenario: Create dates GET does not bounce to step 1

- **WHEN** an admin opens `/:locale/admin/events/new/dates` after having filled General (draft stored)
- **THEN** the page renders Date & tickets instead of redirecting to General

#### Scenario: Discard draft reloads server values

- **WHEN** an admin has a restored draft on create or edit and activates Discard draft
- **THEN** the stored draft is removed
- **AND** the form shows server-rendered values (database on edit, empty/defaults on create)

#### Scenario: File inputs are not stored

- **WHEN** an admin selects a primary image file on the Image step and a draft is saved
- **THEN** the stored draft does not contain raw file bytes
- **AND** already-staged image id fields that exist as named non-file inputs MAY be restored

### Requirement: Catalog add/edit forms restore unsaved drafts

Admin partner create/edit, event clone, and event gallery add SHALL use the same browser `localStorage` draft helper as the event wizard: restore after refresh, skip raw `File` inputs, show Discard, and clear on successful save POST. Form ids SHALL be unique per resource and intent (`admin-partner:new`, `admin-partner:{id}`, `admin-event-clone:{sourceId}`, `admin-event-gallery-add:{eventId}`). Named non-file fields that already exist in the form (including staged image ids, image credits, and pasted promo-code text) MAY be restored. Search, delete-confirm, freeze/refund/adjust-credits, comp-ticket, featured-add search, and member profile/onboarding forms SHALL NOT opt in.

#### Scenario: Refresh on new partner keeps the name

- **WHEN** an admin types a partner name on `/:locale/admin/partners/new` and refreshes
- **THEN** the name field still shows the unsaved value
- **AND** a discard control is available

#### Scenario: Refresh on partner edit keeps unsaved fields

- **WHEN** an admin changes a partner field on `/:locale/admin/partners/:id/edit` and refreshes
- **THEN** that field still shows the unsaved value

#### Scenario: Clone refresh keeps edited datetimes

- **WHEN** an admin changes clone datetimes and refreshes
- **THEN** the clone form still shows those unsaved datetimes

#### Scenario: Gallery add refresh keeps photo credit

- **WHEN** an admin enters a photo credit on `/:locale/admin/events/:id/gallery/add` after staging images as named hidden fields and refreshes
- **THEN** the credit field still shows the unsaved value

#### Scenario: Successful catalog save clears the draft

- **WHEN** an admin successfully creates or updates a partner, clones an event, or adds gallery images
- **THEN** reopening that same form shows server-rendered values, not the previous unsaved draft

#### Scenario: File inputs are not stored on catalog forms

- **WHEN** an admin selects a partner logo, gallery image, or voucher PDF file and a draft is saved
- **THEN** the stored draft does not contain raw file bytes
- **AND** already-staged image id and credit fields that exist as named non-file inputs MAY be restored

#### Scenario: Discard draft reloads server values

- **WHEN** an admin has a restored draft on partner, clone, or gallery add and activates Discard draft
- **THEN** the stored draft is removed
- **AND** the form shows server-rendered values (database on edit, empty/defaults on create)

### Requirement: All day hides time inputs
When `timing_mode` is `ALL_DAY`, admin create, edit, and clone datetime UIs SHALL hide every clock time input (range-builder slot times and per-row times) and SHALL hide additional time-slot rows beyond the first. Dates, per-row credits, and the first slot’s credits SHALL remain. Stored instants SHALL remain Europe/Berlin midnight for All day. When `timing_mode` is `TIME_SLOT`, date and time inputs SHALL both be shown. Hidden or unmounted time fields SHALL NOT be `required`.

#### Scenario: All day keeps dates only
- **WHEN** Timing mode is All day on create, edit, or clone
- **THEN** I do not see hour/minute inputs on the range builder or datetime rows
- **AND** I still see date fields and credits

#### Scenario: Time slot shows times
- **WHEN** Timing mode is Time slot
- **THEN** range slots and datetime rows include time inputs

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

### Requirement: Event wizard BDD and docs
`docs/product/features/admin-events.feature` SHALL include scenarios titled `Create walks three steps`, `Create submit is on the image step`, `Edit can jump to image`, and `Missing image returns to step 3`. Playwright in `e2e/specs/admin-events.spec.ts` SHALL use those titles verbatim. The Events entry in `docs/product/ui/ui-component-map.md` SHALL mention the three-step create/edit stepper. Sitemap paths SHALL remain `/admin/events/new` and `/admin/events/:id/edit`. Clone SHALL be documented as not using the stepper.

#### Scenario: Coverage lists wizard scenarios
- **WHEN** I read the admin-events coverage matrix (if present)
- **THEN** it includes the four wizard scenario titles (pass or explicit environment skip)

#### Scenario: Clone is not a wizard
- **WHEN** I open clone for an existing event
- **THEN** I do not see the three-step progress chrome from create/edit

### Requirement: Date & tickets BDD and docs

`docs/product/features/admin-events.feature` SHALL include scenarios titled `Timing mode is first on Date & tickets`, `All day hides time inputs`, `Time slot shows times`, `Shared capacity is one pool`, `Per-date capacities persist`, `Range rebuild stamps default capacity`, and `Capacity and inventory totals mismatch`. Playwright in `e2e/specs/admin-events.spec.ts` SHALL use those titles verbatim. `Total credits shown on the form` and `Update an event's capacity` SHALL remain. Coverage-matrix rows SHALL exist for the new titles (pass or explicit R2/env skip). Canonical docs SHALL describe Date & tickets field order, All day hiding times, Shared vs Per date, per-row capacity, totals, `capacity_mode` / `occurrence_capacities`, and event-scoped booking remaining: `docs/product/ui/ui-component-map.md` (Events row), `docs/product/database/schema-overview.md`, `docs/product/extras/gaps-and-decisions.md`.

#### Scenario: Timing mode is first on Date & tickets

- **WHEN** I open the new-event form and go to step 2
- **THEN** I see Timing mode before Capacity allocation, ticket type, and the datetime list

#### Scenario: All day hides time inputs

- **WHEN** I set Timing mode to All day
- **THEN** hour and minute inputs are hidden on the range builder and datetime rows
- **AND** date fields remain

#### Scenario: Time slot shows times

- **WHEN** I set Timing mode to Time slot
- **THEN** datetime rows and range slots show time inputs

#### Scenario: Shared capacity is one pool

- **WHEN** I create an event with Capacity allocation Shared across all dates and capacity 10 and two datetimes
- **THEN** the event’s total capacity is 10
- **AND** datetime rows do not show a capacity input

#### Scenario: Per-date capacities persist

- **WHEN** I create an event with Capacity allocation Per date, default capacity 5, and two datetime rows set to 4 and 6
- **THEN** the stored occurrence_capacities are 4 and 6 in datetime order
- **AND** total capacity equals 10

#### Scenario: Range rebuild stamps default capacity

- **WHEN** Capacity allocation is Per date with capacity 8
- **AND** I generate a date range
- **THEN** each generated datetime row’s capacity is 8

#### Scenario: Capacity and inventory totals mismatch

- **WHEN** I am creating a VOUCHER_PROMO event with datetime capacity total 10 and 7 codes previewed
- **THEN** the capacity and inventory totals are shown in danger styling
- **AND** submitting is rejected until they match

#### Scenario: Coverage lists Date & tickets scenarios

- **WHEN** I read the admin-events coverage matrix
- **THEN** it includes the Date & tickets scenario titles (pass or explicit environment skip)

### Requirement: Voucher inventory no longer hides capacity

Voucher create/edit SHALL still require promo or PDF inventory and SHALL still persist inventory only after SSR POST. The Date & tickets step SHALL show the capacity allocation controls. Total capacity SHALL equal inventory count on a successful save (enforced by mismatch reject), not by hiding the capacity field.

#### Scenario: Admin uploads promo codes with preview

- **WHEN** I select a text or CSV file (or paste codes)
- **THEN** the UI previews one non-empty code per line
- **AND** available codes/tickets total equals that count
- **AND** submitting succeeds only when datetime capacity total equals that count

#### Scenario: Admin uploads a master PDF and previews tickets

- **WHEN** I choose split-one-file import and the UI shows a ticket count from the split
- **THEN** submitting succeeds only when datetime capacity total equals that ticket count
- **AND** there is a visible capacity allocation control

#### Scenario: Admin uploads multiple PDF files as tickets

- **WHEN** I choose multiple-files import and the UI shows a ticket count equal to the number of files
- **THEN** submitting succeeds only when datetime capacity total equals that file count
- **AND** there is a visible capacity allocation control

### Requirement: Default values include capacity allocation

Given an admin creates an event without specifying capacity, ticket type, timing mode, or capacity allocation, the system SHALL default to `totalCapacity` 10, `ticketType` `SECRET_CODE`, `timingMode` `TIME_SLOT`, and `capacityMode` `SHARED`.

#### Scenario: Default values on creation

- **WHEN** I create an event without specifying capacity, ticket type, timing mode, or capacity allocation
- **THEN** it defaults to totalCapacity 10, ticketType "SECRET_CODE", timingMode "TIME_SLOT", capacityMode "SHARED"
