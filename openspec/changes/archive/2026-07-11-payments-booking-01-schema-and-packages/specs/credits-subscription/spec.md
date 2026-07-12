## ADDED Requirements

### Requirement: Credit ledger persistence
The system SHALL persist credit movements in `public.credit_ledger` with `user_id`, signed `amount`, `balance_after`, `type` in (`SUBSCRIPTION_REFILL`, `BOOKING`, `EXPIRY`, `REFUND`, `ADMIN_ADJUST`), `description`, optional `idempotency_key`, and `timestamp`. Foreign keys SHALL use `ON DELETE RESTRICT`.

#### Scenario: Ledger idempotency key uniqueness
- **WHEN** a ledger insert reuses a non-null `idempotency_key`
- **THEN** the database rejects the duplicate insert

#### Scenario: Ledger types exclude cut products
- **WHEN** a ledger row is inserted
- **THEN** its `type` is one of `SUBSCRIPTION_REFILL`, `BOOKING`, `EXPIRY`, `REFUND`, or `ADMIN_ADJUST` (not `PURCHASE` or `REFERRAL_BONUS`)
