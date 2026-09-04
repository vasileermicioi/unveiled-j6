## ADDED Requirements

### Requirement: Single unsubscribe email on scheduled cancel

The system SHALL send exactly one branded mail-client-safe unsubscribe email on the transition into `CANCELLED_PENDING` (states access-until date, unused credits expire at period end, tickets valid until end, resubscribe link), at most once per Stripe event (Resend `Idempotency-Key` = event id; already-pending → no resend). The send occurs post-commit only, skips with HTTP 200 when Resend env or recipient is missing, and returns HTTP 500 for retry on transient failures without rolling back the ledger. The later `customer.subscription.deleted` → `INACTIVE` expiry SHALL send nothing. Admin freeze (`UNPAID`) SHALL NOT trigger this mail.

#### Scenario: Cancelling member is told access runs until period end

- **WHEN** a member's subscription moves to `CANCELLED_PENDING`
- **THEN** they receive the unsubscribe mail with the Berlin end date, expiry note, and resubscribe link

#### Scenario: No second mail at final expiry

- **WHEN** that subscription later deletes to `INACTIVE`
- **THEN** no further mail is sent

#### Scenario: Already-pending retry does not resend

- **WHEN** the same scheduled-cancel event is delivered again after a successful send
- **THEN** the system does not send a second email

#### Scenario: Missing mail configuration skips without failing billing

- **WHEN** the scheduled-cancel transition applies but Resend env or recipient is missing
- **THEN** the webhook still succeeds and the ledger update is kept

#### Scenario: Admin freeze sends no unsubscribe mail

- **WHEN** a subscription is frozen to `UNPAID` by an admin
- **THEN** no unsubscribe mail is sent
