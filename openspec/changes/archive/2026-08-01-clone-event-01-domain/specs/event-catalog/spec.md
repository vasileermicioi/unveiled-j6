## ADDED Requirements

### Requirement: Clone event

The catalog domain SHALL provide an ADMIN-facing clone operation that creates a new event row from an existing source event. The clone SHALL copy catalog metadata (title, description, partner, address, zip/location fields, category/type/tags, credit price, total capacity, timing mode, ticket type, secret code when `SECRET_CODE`, website URL, accessibility/language/age metadata, primary image id) and SHALL set `remaining_capacity` equal to `total_capacity`. The caller SHALL supply a `dateTime` (and any create-required redemption inventory for voucher types). The clone SHALL copy gallery join rows to the new event when the source has gallery images. The clone SHALL NOT copy bookings, waitlist entries, featured membership, or voucher inventory rows from the source.

#### Scenario: Clone creates a distinct event

- **WHEN** `cloneEvent` is called with a valid source id and new dateTime
- **THEN** a new event id exists with copied title/partner and the new dateTime
- **AND** remaining_capacity equals total_capacity

#### Scenario: Clone does not copy featured membership

- **WHEN** the source event is featured
- **THEN** the cloned event is not automatically inserted into featured_events

#### Scenario: Voucher clone requires inventory

- **WHEN** cloning a `VOUCHER_PROMO` or `VOUCHER_PDF` event without a new inventory payload
- **THEN** the clone is rejected

#### Scenario: Clone copies gallery associations

- **WHEN** the source event has gallery image join rows
- **THEN** the cloned event has join rows pointing at the same image ids with the new event id

#### Scenario: Missing source rejected

- **WHEN** `cloneEvent` is called with an unknown source event id
- **THEN** the operation fails with a not-found validation error and no new event row is created

## MODIFIED Requirements

### Requirement: Event catalog domain rules

The catalog domain layer in `@unveiled/db` SHALL enforce event validation, defaults, and derived fields from `docs/product/features/admin-events.feature` (as aligned with ticket redemption and the extensible location model), including required image (upload buffer or remote URL path, exactly one source); required location via `country` / `city` / `zip_code` with defaults `DE` / `berlin` and postal validation through `validatePostalCode` (no `neighborhood`); redemption configuration rules (`SECRET_CODE` requires `secretCode`; `VOUCHER_PROMO` requires `eventWebsiteUrl` and does not require event-level `promoCode`; `VOUCHER_PDF` does not require event-level promo/code fields); default capacity 10, ticket type `SECRET_CODE`, timing mode `TIME_SLOT` (no secret-code mode default); computed `start_time_minutes` and `weekday` from `date_time` in Europe/Berlin; capacity recalculation when total capacity changes; and synchronous replacement/deletion of event `images` rows and bucket objects per `docs/product/extras/image-uploads.md` §8. Multi-slot series create (`createEventSeries` / series slot uniqueness) is not part of the catalog domain; reuse of catalog metadata for another occurrence SHALL use clone (see Requirement: Clone event). `createEvent` remains for blank creates.

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

- **WHEN** `createEvent` or `updateEvent` is called with `ticketType = VOUCHER_PROMO` and a valid `eventWebsiteUrl` without event-level `promoCode`
- **THEN** the operation succeeds at the event-row layer (inventory is validated separately)

#### Scenario: Series create API removed

- **WHEN** catalog package exports and series helpers are inspected after this change
- **THEN** `createEventSeries` and `validateUniqueSeriesSlots` are not exported or callable
- **AND** blank single-event create via `createEvent` still works

## REMOVED Requirements

_(none — series create was expressed as scenarios under Event catalog domain rules; those scenarios are removed via the MODIFIED requirement above.)_
