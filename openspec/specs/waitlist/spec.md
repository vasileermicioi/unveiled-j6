# Waitlist

Waitlist entry persistence, domain promotion via the atomic booking transaction, member SSR join/cancel surfaces, sold-out waitlist offers, and post-promote notification email.

## Requirements

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

### Requirement: SSR waitlist join and cancel
The system SHALL expose locale-prefixed SSR pages for joining an event waitlist and cancelling one's own waiting entry via form POST. Mutations SHALL use dedicated pages with form POST (no client-only dialogs). Ticket quantity on the join form SHALL use HeroUI `Select` (not radios or checkboxes). Unauthenticated join attempts SHALL redirect to sign-in with a return path.

#### Scenario: Join waitlist page
- **WHEN** a signed-in member submits the join form for a sold-out event with a requested ticket count
- **THEN** they see a waitlist confirmation and a `WAITING` entry exists for that user and event

#### Scenario: Join requires authentication
- **WHEN** an unauthenticated visitor opens or posts to `/:locale/events/:id/waitlist`
- **THEN** they are redirected to sign-in with a return path back to the waitlist join page

#### Scenario: Duplicate join shows existing status
- **WHEN** a member who already has a `WAITING` entry for the event submits join again
- **THEN** no second `WAITING` row is created and the page shows the existing waitlist status/position

#### Scenario: Cancel waitlist page
- **WHEN** the owning member confirms cancel on `/:locale/waitlist/:id/cancel` via form POST
- **THEN** the entry status is `CANCELLED` and it is excluded from future promotion

### Requirement: Sold-out offers waitlist
The system SHALL offer waitlist join when remaining capacity is insufficient for the requested booking (including fully sold-out events), instead of only failing closed without a member path. The offer SHALL appear on event detail and on the book failure path for authenticated eligible members.

#### Scenario: Sold out automatic waitlist offer
- **WHEN** a member attempts to book more tickets than remaining capacity (or views a sold-out upcoming event as an eligible member)
- **THEN** they are offered the waitlist join flow and no booking is created for the failed attempt

### Requirement: Promotion notification email
The system SHALL email the member after a successful waitlist promotion with redemption details comparable to a normal booking confirmation (including ICS when applicable). The send SHALL happen post-commit; email failure SHALL be logged and MUST NOT roll back the promotion or booking.

#### Scenario: Promoted member notified
- **WHEN** auto-promotion creates a `CONFIRMED` booking via `processWaitlistForEvent`
- **THEN** a promotion email is attempted for that booking after commit without rolling back the booking on send failure

#### Scenario: Promotion email skipped when Resend unset
- **WHEN** promotion succeeds but Resend env vars are unset
- **THEN** the system logs a skip warning and leaves the booking/`PROMOTED` entry intact

### Requirement: Capacity-increase promotion hook
The system SHALL invoke `processWaitlistForEvent` when an admin event update increases remaining capacity, so automatic promotion is demonstrable in Phase 7 without admin booking-cancel UI.

#### Scenario: Capacity increase triggers processor
- **WHEN** admin `updateEvent` (or the admin edit POST that calls it) increases `remainingCapacity` for an event with `WAITING` entries
- **THEN** `processWaitlistForEvent` runs for that event and eligible entries may be promoted

### Requirement: Sold-out demo seed
The system SHALL include at least one sold-out (zero-remaining) demo event in the demo seed, with a documented title/id comment for staging demos.

#### Scenario: Seed sold-out event exists after demo seed
- **WHEN** demo seed runs on an empty catalog (or reset path)
- **THEN** at least one upcoming event has `remainingCapacity = 0` suitable for waitlist join demos

### Requirement: Phase 7 release evidence
The system SHALL demonstrate on staging: sold-out join → capacity frees → auto-promotion → email attempt, with seed documentation for the sold-out demo event (`Sold Out: Waitlist Demo Night` / `DEMO_DISCOVERY_TITLES.soldOutWaitlist`). `apps/web/DEPLOYMENT.md` SHALL document the demo path, seed title, and that Phase 7 is complete (do not start Phase 8). Ladle SHALL include stories for waitlist join/cancel page states used in the member UX.

#### Scenario: Client demo path
- **WHEN** the Phase 7 demo script is run on staging
- **THEN** waitlist join and promotion are observable end-to-end

#### Scenario: Sold-out seed documented for operators
- **WHEN** an operator reads `DEPLOYMENT.md` Phase 7 section
- **THEN** they find the sold-out demo event title/purpose and how to free capacity (admin capacity increase) to trigger promotion

#### Scenario: Waitlist Ladle stories load
- **WHEN** `bun run stories` (or `@unveiled/web` Ladle) is started after this change
- **THEN** waitlist join/cancel story states are available without runtime errors
