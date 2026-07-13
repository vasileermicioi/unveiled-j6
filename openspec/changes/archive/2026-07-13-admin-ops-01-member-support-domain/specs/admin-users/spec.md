## ADDED Requirements

### Requirement: Admin member list and detail queries
The system SHALL expose admin-only domain operations to list members (sorted by name then email), filter by name/email/role, and load a member detail aggregate including preferences, history counts, and available behavior fields. Soft-deleted members (`deleted_at` set) SHALL be excluded from the list and SHALL NOT be returned as a successful detail load.

#### Scenario: List members for Membership HQ
- **WHEN** an admin requests the member list
- **THEN** all non-deleted member accounts are returned sorted by display name, then email

#### Scenario: Search members by name, email, or role
- **WHEN** an admin lists members with a search query and/or role filter
- **THEN** only members matching the name/email query and role (when provided) are returned

#### Scenario: Member detail aggregate
- **WHEN** an admin loads member detail for an existing non-deleted user
- **THEN** the result includes profile preferences, subscription status when present, history counts (bookings, waitlist, saved events), and available behavior JSON fields without inventing missing analytics

### Requirement: Admin credit adjust and refund
The system SHALL allow admins to change a member credit balance with a reason via `ADMIN_ADJUST` ledger entries and to issue support `REFUND` ledger entries decoupled from booking cancellation. Zero-amount adjustments MUST be rejected. Credit balance MUST remain non-negative. Refund amounts MUST be positive.

#### Scenario: Adjust credits
- **WHEN** an admin adjusts credits with a non-zero amount and reason
- **THEN** the balance updates and an `ADMIN_ADJUST` ledger row is recorded with the new `balance_after`

#### Scenario: Reject zero adjustment
- **WHEN** an admin attempts to adjust credits by exactly 0
- **THEN** the adjustment is rejected and the balance and ledger are unchanged

#### Scenario: Reject adjustment that would go negative
- **WHEN** an admin adjusts credits by a negative amount greater than the member's current balance
- **THEN** the adjustment is rejected and the balance and ledger are unchanged

#### Scenario: Manual refund
- **WHEN** an admin issues a manual credit refund with a positive amount and description
- **THEN** the member's credit balance increases by that amount and a `REFUND` ledger row is recorded, without cancelling any booking

### Requirement: Admin freeze and unfreeze
The system SHALL set subscription status to `UNPAID` on freeze and `ACTIVE` on unfreeze while preserving plan, payment method, billing address, and Stripe ids, independent of Stripe `PAST_DUE` handling. Freeze SHALL apply only from `ACTIVE`; unfreeze SHALL apply only from `UNPAID`.

#### Scenario: Freeze active member
- **WHEN** an admin freezes a member with `ACTIVE` subscription
- **THEN** status becomes `UNPAID` and Stripe identifiers, plan, payment method, and billing address remain intact

#### Scenario: Unfreeze frozen member
- **WHEN** an admin unfreezes a member whose subscription status is `UNPAID`
- **THEN** status becomes `ACTIVE` without clearing Stripe identifiers
