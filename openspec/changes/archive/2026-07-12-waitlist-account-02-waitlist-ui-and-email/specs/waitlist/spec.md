## ADDED Requirements

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
