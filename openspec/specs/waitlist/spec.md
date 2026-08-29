# Waitlist

Waitlist entry persistence, domain promotion via the atomic booking transaction, member SSR join/cancel surfaces, sold-out waitlist offers, and post-promote notification email.

## Requirements

### Requirement: Waitlist entry persistence
The system SHALL persist waitlist entries in `public.waitlist_entries` with status `WAITING`, `PROMOTED`, or `CANCELLED`, requested ticket quantity of **1** on new joins, and `skipped_once` for ineligible promotion attempts. The system SHALL enforce at most one `WAITING` row per `(user_id, event_id)` via a partial unique index (or equivalent DB constraint).

#### Scenario: Join creates WAITING entry
- **WHEN** an authenticated member joins the waitlist for an event
- **THEN** a `WAITING` entry is stored for that user and event with `requested_qty = 1` and `skipped_once = false`

#### Scenario: Duplicate WAITING prevented
- **WHEN** the member already has a `WAITING` entry for the same event
- **THEN** no second `WAITING` row is created and the existing entry is returned

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

### Requirement: Canonical waitlist Gherkin is qty one
`docs/product/features/waitlist.feature` SHALL describe join with `requested_qty = 1` and SHALL NOT require a “requested ticket count” picker. Background SHALL treat sold-out as remaining capacity 0 (not “less than my requested ticket count”). Promotion SHALL attempt to book one ticket through the same atomic booking transaction. Existing Playwright `Scenario:` titles in `e2e/specs/waitlist.spec.ts` SHALL stay unless a Gherkin `Scenario:` line changes. Coverage-matrix waitlist rows keep their titles.

#### Scenario: Join the waitlist
- **WHEN** I choose to join the waitlist
- **THEN** a waitlist entry is created with `requested_qty = 1` and status `WAITING`
- **AND** the join form has no ticket-quantity control

#### Scenario: Promotion books one ticket
- **WHEN** capacity frees and the earliest eligible `WAITING` entry is promoted
- **THEN** the system books one ticket on my behalf through the same transaction as a normal booking

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

### Requirement: Event cancel-all closes the waitlist
When an admin cancels all confirmed bookings for an event, the system SHALL set every WAITING waitlist entry for that event to CANCELLED in the same transaction and SHALL NOT attempt automatic or manual promotion as a side effect of that operation. PROMOTED entries SHALL remain PROMOTED.

#### Scenario: Cancel-all does not promote the waitlist
- **WHEN** an event is sold out, members are WAITING, and an admin cancels all confirmed bookings
- **THEN** those WAITING entries become CANCELLED
- **AND** no waitlist entry becomes PROMOTED as a result of cancel-all
- **AND** restored capacity is not consumed by promotion
- **AND** Playwright uses that Gherkin title verbatim

### Requirement: Members are notified when event cancel-all closes the waitlist
After a successful event cancel-all commit, the system SHALL email each member whose WAITING waitlist entry was closed. The email SHALL state that the waitlist for that event is closed and SHALL NOT include a credit-return sentence. Complimentary vs paid booking language SHALL NOT appear. Email failure SHALL NOT roll back waitlist close or booking cancellation.

#### Scenario: Waitlist member receives waitlist-closed email
- **WHEN** an admin completes cancel-all for an event the member was WAITING on
- **THEN** the member receives an email that the waitlist is closed
- **AND** that email does not state that credits were returned

### Requirement: Canonical waitlist Gherkin records cancel-all close
`docs/product/features/waitlist.feature` SHALL state that event cancel-all sets every `WAITING` entry for that event to `CANCELLED` and MUST NOT run automatic or manual promotion as a side effect. Promotion SHALL remain documented as triggered by single-booking admin cancel or an admin capacity increase — not by cancel-all. Playwright `e2e/specs/waitlist.spec.ts` SHALL include a test titled verbatim `Scenario: Cancel-all does not promote the waitlist`. The waitlist-closed email scenario MAY skip inbox assertion with an explicit no-harness reason and MUST NOT use `@skip-no-ui`.

#### Scenario: Cancel-all does not promote the waitlist
- **WHEN** an event is sold out, members are WAITING, and an admin cancels all confirmed bookings
- **THEN** those WAITING entries become CANCELLED
- **AND** no waitlist entry becomes PROMOTED as a result of cancel-all
- **AND** restored capacity is not consumed by promotion
- **AND** Playwright uses that Gherkin title verbatim

#### Scenario: Waitlist member receives waitlist-closed email
- **WHEN** an admin completes cancel-all for an event the member was WAITING on
- **THEN** the member receives an email that the waitlist is closed
- **AND** that email does not state that credits were returned

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

### Requirement: Admin waitlist list and manual promote
The system SHALL allow admins to list waitlist entries across events (status and skip history visible) and to manually promote a specific `WAITING` entry via the same promotion transaction as automatic promotion, even out of normal queue order.

#### Scenario: List waitlist entries for admin
- **WHEN** an admin lists waitlist entries with optional event and status filters
- **THEN** matching entries are returned including status and skip history (`skipped_once`)

#### Scenario: Manual promote
- **WHEN** an admin triggers promotion for a waiting entry with available capacity
- **THEN** the shared promote path runs immediately for that entry

### Requirement: Admin waitlist SSR surfaces
The system SHALL provide `/:locale/admin/waitlist` listing and `/:locale/admin/waitlist/:id/promote` confirm/POST pages for ADMIN users, with `robots: noindex`. The list page SHALL support optional `eventId` and `status` filters and pagination. Manual promote SHALL call the shared promote domain path (including out-of-queue support) and MUST NOT use client-only mutation modals.

#### Scenario: List admin waitlist
- **WHEN** an admin opens `/:locale/admin/waitlist` with optional event and status filters
- **THEN** matching waitlist entries are listed with status and skip-history visible and filters preserved across pagination

#### Scenario: Promote from admin waitlist
- **WHEN** an admin confirms manual promote on a `WAITING` entry
- **THEN** the shared promote domain runs and the admin sees the updated entry state on the waitlist list (or promote page error if promotion fails)

#### Scenario: Admin waitlist surfaces are admin-only
- **WHEN** a non-admin requests `/admin/waitlist` or `/admin/waitlist/:id/promote`
- **THEN** access is denied

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

### Requirement: Admin waitlist Playwright coverage
The system SHALL implement Playwright coverage for `waitlist.feature` scenarios `Admin visibility` and `Admin can manually trigger promotion for a specific entry` in `e2e/specs/waitlist.spec.ts` now that `/admin/waitlist` and promote confirm pages exist. Specs SHALL use verbatim Gherkin titles and proximity selectors. Skips SHALL only use documented env/harness reasons (not “UI not built”). Ladle SHALL include stories for admin waitlist list and promote confirm states.

#### Scenario: Admin waitlist visibility is executable
- **WHEN** an ADMIN opens `/admin/waitlist` in e2e with seeded waitlist data
- **THEN** entries across events are visible with status (and skip history when present)

#### Scenario: Admin manual promote is executable
- **WHEN** an ADMIN promotes a WAITING entry that fits available capacity via the promote confirm page
- **THEN** the promotion transaction runs for that entry and the scenario passes (or skips only for documented env prerequisites)

#### Scenario: Admin waitlist Ladle stories load
- **WHEN** Ladle is started after this change
- **THEN** admin waitlist list and promote confirm stories are available without runtime errors

### Requirement: Unpublished events are not waitlistable
`joinWaitlist` SHALL reject an unpublished event with the same not-found failure as a missing event (`EVENT_NOT_FOUND`) and SHALL NOT create a waitlist row. Existing `WAITING` entries SHALL remain if the event is later unpublished. Promotion SHALL call `bookEvent` and therefore SHALL NOT create a booking for an unpublished event.

#### Scenario: Join unpublished fails
- **WHEN** a member joins the waitlist for an unpublished event
- **THEN** no waitlist row is written

#### Scenario: Existing waiting entry survives unpublish
- **WHEN** a member already has a `WAITING` entry
- **AND** the event is later unpublished
- **THEN** that waitlist row remains
- **AND** a new join for that event is rejected

### Requirement: Canonical waitlist Gherkin rejects unpublished events
`docs/product/features/waitlist.feature` SHALL add a one-liner that joining an unpublished event fails. Playwright `e2e/specs/waitlist.spec.ts` SHALL include the matching title. When the only honest assertion is domain-level (public detail 404 leaves no waitlist CTA), the titled test MAY `test.skip` pointing at the existing `joinWaitlist` unpublished package test. The system SHALL NOT add `@skip-no-ui`.

#### Scenario: Join unpublished fails
- **WHEN** a member joins the waitlist for an unpublished event
- **THEN** no waitlist row is written
