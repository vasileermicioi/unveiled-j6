## ADDED Requirements

### Requirement: Waitlist entry persistence
The system SHALL persist waitlist entries in `public.waitlist_entries` with status `WAITING`, `PROMOTED`, or `CANCELLED`, requested ticket quantity, and `skipped_once` for ineligible promotion attempts. The system SHALL enforce at most one `WAITING` row per `(user_id, event_id)` via a partial unique index (or equivalent DB constraint).

#### Scenario: Join creates WAITING entry
- **WHEN** an authenticated member joins the waitlist for an event with a requested quantity
- **THEN** a `WAITING` entry is stored for that user and event with `skipped_once = false`

#### Scenario: Duplicate WAITING prevented
- **WHEN** the member already has a `WAITING` entry for the same event
- **THEN** no second `WAITING` row is created and the existing entry is returned

### Requirement: Automatic promotion via booking transaction
The system SHALL promote waitlist entries by calling the same atomic booking transaction used for normal purchases (`bookEvent`), re-checking subscription eligibility and credits at promotion time. Promotion SHALL use a stable per-entry idempotency key so retries do not double-book. The system SHALL NOT mark an entry `PROMOTED` unless `bookEvent` succeeded for that entry.

#### Scenario: Capacity frees and earliest eligible is promoted
- **WHEN** remaining capacity increases and the earliest `WAITING` entry's quantity fits
- **THEN** the system creates a `CONFIRMED` booking via `bookEvent`, sets the entry to `PROMOTED`, and stops promoting once freed capacity is exhausted

#### Scenario: Ineligible entry is skipped
- **WHEN** the earliest `WAITING` member is not booking-eligible or lacks credits
- **THEN** the entry remains `WAITING` with `skipped_once` set and the next eligible entry is attempted

#### Scenario: Queue order and partial capacity
- **WHEN** multiple `WAITING` entries exist for the same event and freed capacity fits only some of them
- **THEN** entries are attempted strictly in join-time (`created_at`) order and remaining entries stay `WAITING`

#### Scenario: Promotion idempotency
- **WHEN** promotion is retried for an entry that already produced a booking via `waitlist-promote:{entryId}`
- **THEN** `bookEvent` returns the existing booking and no second booking is created

### Requirement: Member self-cancel
The system SHALL allow a member to cancel their own `WAITING` entry, setting status to `CANCELLED` and excluding it from future promotion.

#### Scenario: Cancel own entry
- **WHEN** the owning member cancels a `WAITING` entry
- **THEN** status becomes `CANCELLED` and it is not selected by promotion processing

#### Scenario: Cancel is owner-scoped
- **WHEN** a caller attempts to cancel another member's waitlist entry
- **THEN** the system rejects the cancel and leaves the entry unchanged

### Requirement: User-scoped waitlist listing
The system SHALL list waitlist entries only for the requesting user id when invoked for member visibility.

#### Scenario: List own entries only
- **WHEN** `listUserWaitlistEntries` is called with a user id
- **THEN** only that user's waitlist entries are returned

### Requirement: Single-entry admin promote path
The system SHALL export a single-entry promote function that runs the same booking path for a specific `WAITING` entry (for Phase 8 admin use), which MAY ignore normal queue order.

#### Scenario: Promote specific entry
- **WHEN** `promoteWaitlistEntry` is called for a `WAITING` entry whose quantity fits current capacity and the member is eligible
- **THEN** the system books via `bookEvent` and sets the entry to `PROMOTED`
