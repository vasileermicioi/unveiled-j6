## ADDED Requirements

### Requirement: Bookings persistence
The system SHALL persist event bookings in `public.bookings` with a generated primary key, foreign keys to `users`, `events`, and denormalized `partner_id`, ticket count, total credits charged, status (`CONFIRMED` | `WAITLIST` | `CANCELLED` | `USED`), redemption fields, `idempotency_key`, and timestamps. Foreign keys SHALL use `ON DELETE RESTRICT`.

#### Scenario: Unique idempotency per user
- **WHEN** two booking rows would share the same `(user_id, idempotency_key)`
- **THEN** the database rejects the duplicate insert

#### Scenario: Booking row shape is queryable
- **WHEN** the booking domain inserts a confirmed booking for a member and event
- **THEN** the row stores `user_id`, `event_id`, `partner_id`, `tickets_count`, `total_credits`, `status`, and `idempotency_key`

### Requirement: Transactional database access
The system SHALL provide a Drizzle-capable database client that supports multi-statement transactions and row locking for the booking path, exported from `@unveiled/db` alongside the existing neon-http client.

#### Scenario: Transaction API available
- **WHEN** the booking domain opens a write transaction
- **THEN** it uses the transactional client (not neon-http-only) so `SELECT … FOR UPDATE` can run

#### Scenario: HTTP client remains for reads
- **WHEN** catalog or session code needs a non-transactional query client
- **THEN** it MAY continue to use the existing `createDb` neon-http factory
