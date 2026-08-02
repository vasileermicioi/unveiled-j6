## ADDED Requirements

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

## MODIFIED Requirements

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

The catalog domain layer in `@unveiled/db` SHALL enforce event validation, defaults, and derived fields from `docs/product/features/admin-events.feature` (as aligned with ticket redemption and the extensible location model), including required image (upload buffer or remote URL path, exactly one source); required location via `street` / `house_number` / optional `address_line2` / `country` / `city` / `zip_code` with defaults `DE` / `berlin`, postal validation through `validatePostalCode`, and compose-on-write display `address` (no `neighborhood`); redemption configuration rules (`SECRET_CODE` requires `secretCode`; `VOUCHER_PROMO` requires `eventWebsiteUrl` and does not require event-level `promoCode`; `VOUCHER_PDF` does not require event-level promo/code fields); default capacity 10, ticket type `SECRET_CODE`, timing mode `TIME_SLOT` (no secret-code mode default); computed `start_time_minutes` and `weekday` from `date_time` in Europe/Berlin; capacity recalculation when total capacity changes; and synchronous replacement/deletion of event `images` rows and bucket objects per `docs/product/extras/image-uploads.md` §8. Multi-slot series create (`createEventSeries` / series slot uniqueness) is not part of the catalog domain; reuse of catalog metadata for another occurrence SHALL use clone (see Requirement: Clone event). `createEvent` remains for blank creates.

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

- **WHEN** an event is created or its `date_time` is updated
- **THEN** `start_time_minutes` and `weekday` are computed from `date_time` using Europe/Berlin local time

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

The catalog domain SHALL provide an ADMIN-facing clone operation that creates a new event row from an existing source event. The clone SHALL copy catalog metadata (title, description, partner, structured location fields including composed address, zip/location fields, category/type/tags, credit price, total capacity, timing mode, ticket type, secret code when `SECRET_CODE`, website URL, accessibility/language/age metadata, primary image id) and SHALL set `remaining_capacity` equal to `total_capacity`. The caller SHALL supply a `dateTime` (and any create-required redemption inventory for voucher types). The clone SHALL copy gallery join rows to the new event when the source has gallery images. The clone SHALL NOT copy bookings, waitlist entries, featured membership, or voucher inventory rows from the source.

#### Scenario: Clone creates a distinct event

- **WHEN** `cloneEvent` is called with a valid source id and new dateTime
- **THEN** a new event id exists with copied title/partner and the new dateTime
- **AND** remaining_capacity equals total_capacity

#### Scenario: Clone copies structured location fields

- **WHEN** `cloneEvent` is called for a source with street, house number, optional line2, zip, and composed address
- **THEN** the new event has the same structured location fields and composed `address`

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
