## ADDED Requirements

### Requirement: Waitlist requested quantity is one
Joining the waitlist SHALL persist `requested_qty = 1`. Promotion SHALL call the atomic booking transaction with ticket count `1`. If booking returns `ALREADY_BOOKED`, the entry SHALL remain `WAITING` and `skipped_once` SHALL be set (same skip path as ineligible subscription / insufficient credits). Duplicate WAITING join per user+event is unchanged.

#### Scenario: Join the waitlist
- **WHEN** I choose to join the waitlist
- **THEN** a waitlist entry is created with `requested_qty = 1` and status `WAITING`

#### Scenario: Promotion skipped when the slot is already held
- **WHEN** promotion would book an occurrence the member already holds as `CONFIRMED` or `USED`
- **THEN** the entry remains `WAITING` with `skipped_once` true and no second booking is created

#### Scenario: Join quantity other than one is rejected
- **WHEN** waitlist join is requested with a quantity other than 1
- **THEN** the join is rejected and no waitlist row is written

## MODIFIED Requirements

### Requirement: Waitlist entry persistence
The system SHALL persist waitlist entries in `public.waitlist_entries` with status `WAITING`, `PROMOTED`, or `CANCELLED`, requested ticket quantity of **1** on new joins, and `skipped_once` for ineligible promotion attempts. The system SHALL enforce at most one `WAITING` row per `(user_id, event_id)` via a partial unique index (or equivalent DB constraint).

#### Scenario: Join creates WAITING entry
- **WHEN** an authenticated member joins the waitlist for an event
- **THEN** a `WAITING` entry is stored for that user and event with `requested_qty = 1` and `skipped_once = false`

#### Scenario: Duplicate WAITING prevented
- **WHEN** the member already has a `WAITING` entry for the same event
- **THEN** no second `WAITING` row is created and the existing entry is returned

### Requirement: Automatic promotion via booking transaction
The system SHALL promote waitlist entries by calling the same atomic booking transaction used for normal purchases (`bookEvent`), re-checking subscription eligibility and credits at promotion time. Promotion SHALL book exactly one ticket (`ticketsCount = 1`) regardless of any historical `requested_qty`. Promotion SHALL use a stable per-entry idempotency key so retries do not double-book. The system SHALL NOT mark an entry `PROMOTED` unless `bookEvent` succeeded for that entry. If `bookEvent` returns `ALREADY_BOOKED`, the entry SHALL remain `WAITING` with `skipped_once` set and the processor SHALL continue to later entries (same skip path as ineligible subscription / insufficient credits).

#### Scenario: Capacity frees and earliest eligible is promoted
- **WHEN** remaining capacity increases and the earliest `WAITING` entry fits (one ticket)
- **THEN** the system creates a `CONFIRMED` booking via `bookEvent` with `tickets_count = 1`, sets the entry to `PROMOTED`, and stops promoting once freed capacity is exhausted

#### Scenario: Ineligible entry is skipped
- **WHEN** the earliest `WAITING` member is not booking-eligible or lacks credits
- **THEN** the entry remains `WAITING` with `skipped_once` set and the next eligible entry is attempted

#### Scenario: Already-booked occurrence is skipped
- **WHEN** the earliest `WAITING` member already holds a `CONFIRMED` or `USED` booking for the occurrence promotion would book
- **THEN** the entry remains `WAITING` with `skipped_once` set and no second booking is created

#### Scenario: Queue order and partial capacity
- **WHEN** multiple `WAITING` entries exist for the same event and freed capacity fits only some of them
- **THEN** entries are attempted strictly in join-time (`created_at`) order and remaining entries stay `WAITING`

#### Scenario: Promotion idempotency
- **WHEN** promotion is retried for an entry that already produced a booking via `waitlist-promote:{entryId}`
- **THEN** `bookEvent` returns the existing booking and no second booking is created

### Requirement: SSR waitlist join and cancel
The system SHALL expose locale-prefixed SSR pages for joining an event waitlist and cancelling one's own waiting entry via form POST. Mutations SHALL use dedicated pages with form POST (no client-only dialogs). The join form SHALL NOT collect ticket quantity; it SHALL persist `requested_qty = 1`. Unauthenticated join attempts SHALL redirect to sign-in with a return path.

#### Scenario: Join waitlist page
- **WHEN** a signed-in member submits the join form for a sold-out event
- **THEN** they see a waitlist confirmation and a `WAITING` entry exists for that user and event with `requested_qty = 1`

#### Scenario: Join requires authentication
- **WHEN** an unauthenticated visitor opens or posts to `/:locale/events/:id/waitlist`
- **THEN** they are redirected to sign-in with a return path back to the waitlist join page

#### Scenario: Duplicate join shows existing status
- **WHEN** a member who already has a `WAITING` entry for the event submits join again
- **THEN** no second `WAITING` row is created and the page shows the existing waitlist status/position

#### Scenario: Cancel waitlist page
- **WHEN** the owning member confirms cancel on `/:locale/waitlist/:id/cancel` via form POST
- **THEN** the entry status is `CANCELLED` and it is excluded from future promotion
