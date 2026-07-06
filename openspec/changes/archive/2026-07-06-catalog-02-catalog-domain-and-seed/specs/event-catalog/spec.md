## ADDED Requirements

### Requirement: Partner catalog domain rules

The catalog domain layer in `@unveiled/db` SHALL enforce partner validation and lifecycle rules from `docs/migration/features/admin-partners.feature`, including required name, contact email, and address; optional logo (upload or remote URL, not both); automatic `venue_check_in_token` generation when omitted on create; propagating partner display name changes to all related events' denormalized `partner_name`; and synchronous deletion of associated logo `images` row and bucket objects when a partner is deleted.

#### Scenario: Invalid partner email rejected

- **WHEN** `createPartner` receives `contact_email` that is not a valid email
- **THEN** the operation fails without inserting a row

#### Scenario: Partner rename updates events

- **WHEN** a partner with existing events is renamed
- **THEN** all events for that partner reflect the new `partner_name`

#### Scenario: Venue check-in token auto-generated

- **WHEN** `createPartner` is called without a `venue_check_in_token`
- **THEN** a unique token is generated and stored on the new partner row

### Requirement: Event catalog domain rules

The catalog domain layer in `@unveiled/db` SHALL enforce event validation, defaults, and derived fields from `docs/migration/features/admin-events.feature`, including required image (upload buffer or remote URL path, exactly one source); redemption configuration rules; default capacity 10, ticket type `SECRET_CODE`, secret code mode `MANUAL`, timing mode `TIME_SLOT`; computed `start_time_minutes` and `weekday` from `date_time` in Europe/Berlin; series slot uniqueness; capacity recalculation when total capacity changes; and synchronous replacement/deletion of event `images` rows and bucket objects per `docs/migration/extras/image-uploads.md` §8.

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

### Requirement: Image attach orchestration

The catalog domain layer SHALL orchestrate `@unveiled/images` processing, `images` row insertion, S3 upload, and old-image cleanup in a single transaction where applicable: `attachImageToPartner` and `attachImageToEvent` call `processImageFromBuffer` or `processImageFromUrl`, insert an `images` row, upload six variants, and when replacing an existing image delete the prior `images` row and all six bucket objects synchronously.

#### Scenario: Event image attach creates images row

- **WHEN** `attachImageToEvent` succeeds with a valid remote URL
- **THEN** a new `images` row exists with `source = REMOTE_URL` and six objects exist in the bucket

#### Scenario: Image replace deletes old assets

- **WHEN** an event with an existing image is updated via `attachImageToEvent` with a new source
- **THEN** the old `images` row and its six bucket objects are removed and the event references the new image

### Requirement: Demo seed idempotency

The `scripts/seed-demo.ts` script invoked by `bun run seed:demo` SHALL insert demo partners and events only when both `partners` and `events` table counts are zero, and SHALL perform no inserts when any partner or event already exists.

#### Scenario: Seed on empty database

- **WHEN** both `partners` and `events` are empty and seed runs
- **THEN** at least one partner and one upcoming event exist

#### Scenario: Seed skipped when data exists

- **WHEN** at least one partner or event exists and seed runs
- **THEN** row counts are unchanged
