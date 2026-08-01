## ADDED Requirements

### Requirement: Event location fields

Each event SHALL store required location fields `country` (ISO 3166-1 alpha-2), `city` (canonical city key), and `zip_code` (postal string). The system SHALL NOT store `events.neighborhood`. For the current product release, supported values are `country = DE` and `city = berlin`; catalog create/update SHALL default omitted country/city to those values. Catalog create/update SHALL reject missing, malformed, or non-Berlin zip codes for `(DE, berlin)`, and SHALL reject unsupported country/city pairs. Address + optional geocoded lat/lng remain unchanged. Postal validation SHALL use a shared registry-shaped helper `validatePostalCode({ country, city, zipCode })` (not a bare Berlin-only function without country/city parameters).

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

## MODIFIED Requirements

### Requirement: Catalog persistence tables

The `@unveiled/db` package SHALL define Drizzle schema and migrations for `public.images`, `public.partners`, and `public.events` matching the project schema docs (as updated for ticket redemption and the extensible location model), including FK from `events.image_id` → `images.id` (required), `partners.logo_image_id` → `images.id` (optional), and `events.partner_id` → `partners.id`. The schema SHALL include enums for image source, ticket type (`SECRET_CODE` | `VOUCHER_PROMO` | `VOUCHER_PDF`), and timing mode; SHALL NOT include a `secret_code_mode` enum/column; SHALL include required event location columns `country`, `city`, and `zip_code` and SHALL NOT include `events.neighborhood`; a check constraint `remaining_capacity >= 0` on `events`; and indexes on `events(date_time)`, `(date_time, partner_id)`, and `(date_time, category)`. Voucher inventory and `booking_tickets` tables SHALL also be defined as part of the ticket-redemption schema work.

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

### Requirement: Event catalog domain rules

The catalog domain layer in `@unveiled/db` SHALL enforce event validation, defaults, and derived fields from `docs/product/features/admin-events.feature` (as aligned with ticket redemption and the extensible location model), including required image (upload buffer or remote URL path, exactly one source); required location via `country` / `city` / `zip_code` with defaults `DE` / `berlin` and postal validation through `validatePostalCode` (no `neighborhood`); redemption configuration rules (`SECRET_CODE` requires `secretCode`; `VOUCHER_PROMO` requires `eventWebsiteUrl` and does not require event-level `promoCode`; `VOUCHER_PDF` does not require event-level promo/code fields); default capacity 10, ticket type `SECRET_CODE`, timing mode `TIME_SLOT` (no secret-code mode default); computed `start_time_minutes` and `weekday` from `date_time` in Europe/Berlin; series slot uniqueness; capacity recalculation when total capacity changes; and synchronous replacement/deletion of event `images` rows and bucket objects per `docs/product/extras/image-uploads.md` §8.

#### Scenario: Missing event image rejected

- **WHEN** `createEvent` is called without an image source (neither upload nor URL)
- **THEN** the operation fails validation

#### Scenario: Conflicting image sources rejected

- **WHEN** `createEvent` or `updateEvent` receives both an upload buffer and a remote URL
- **THEN** the operation fails validation without writing rows or bucket objects

#### Scenario: Event series creates one row per slot

- **WHEN** `createEventSeries` receives multiple unique date/time slots
- **THEN** one event row is created per slot sharing base details

#### Scenario: Duplicate series slots rejected

- **WHEN** `createEventSeries` receives duplicate date/time slots
- **THEN** the operation fails validation before inserting any rows

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

#### Scenario: Create event persists zip under Germany/Berlin defaults

- **WHEN** `createEvent` is called with a valid Berlin zip and omitted country/city
- **THEN** the event row stores `country = DE`, `city = berlin`, and that `zip_code`
