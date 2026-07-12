# Credits & Subscription

Credit ledger persistence for subscription refills, booking spend, expiry, refunds, and admin adjustments. Real Stripe Checkout activation and webhook-driven subscription lifecycle for Basic Berlin.

## Requirements

### Requirement: Credit ledger persistence
The system SHALL persist credit movements in `public.credit_ledger` with `user_id`, signed `amount`, `balance_after`, `type` in (`SUBSCRIPTION_REFILL`, `BOOKING`, `EXPIRY`, `REFUND`, `ADMIN_ADJUST`), `description`, optional `idempotency_key`, and `timestamp`. Foreign keys SHALL use `ON DELETE RESTRICT`.

#### Scenario: Ledger idempotency key uniqueness
- **WHEN** a ledger insert reuses a non-null `idempotency_key`
- **THEN** the database rejects the duplicate insert

#### Scenario: Ledger types exclude cut products
- **WHEN** a ledger row is inserted
- **THEN** its `type` is one of `SUBSCRIPTION_REFILL`, `BOOKING`, `EXPIRY`, `REFUND`, or `ADMIN_ADJUST` (not `PURCHASE` or `REFERRAL_BONUS`)

### Requirement: Real Stripe Checkout activation
The system SHALL start a Stripe Checkout Session for the Basic Berlin price when a signed-in member with a non-frozen, non-active subscription submits the membership checkout action, and SHALL activate the subscription only after a verified Stripe webhook confirms success. Checkout Session creation SHALL omit `payment_method_types` so Stripe dynamic payment methods apply. Activation SHALL set subscription status to `ACTIVE`, record a `SUBSCRIPTION_REFILL` ledger entry of +17, set the member credit balance to exactly 17 (forfeiting any prior balance via `EXPIRY` when needed), store Stripe customer/subscription identifiers, and allow the member to proceed to the events feed after Checkout return.

#### Scenario: Activating a subscription via real Stripe Checkout
- **WHEN** Checkout completes successfully and `checkout.session.completed` (or an equivalent confirmed subscription event) is verified
- **THEN** subscription status becomes `ACTIVE`, a `SUBSCRIPTION_REFILL` ledger entry of +17 is recorded, and the member can proceed to the events feed

#### Scenario: Checkout blocked while frozen
- **WHEN** subscription status is `UNPAID`
- **THEN** Checkout is not started and the member sees a payment-stopped message with support contact info

#### Scenario: Already-active member revisits checkout
- **WHEN** an `ACTIVE` member visits `/membership`
- **THEN** they see an already-active/success state instead of a payment form

#### Scenario: Guest visits membership
- **WHEN** a guest visits `/membership`
- **THEN** they see plan marketing content and an authentication CTA rather than a Checkout start form

### Requirement: Webhook-driven subscription lifecycle
The system SHALL verify Stripe webhook signatures with `STRIPE_WEBHOOK_SECRET` and SHALL update `subscriptions` and the credit ledger from verified events for activation/renewal, failed renewal, subscription updates, and deletion. Webhook application SHALL be idempotent under Stripe retries. Admin-frozen `UNPAID` status SHALL NOT be cleared to `ACTIVE` or `PAST_DUE` solely by Stripe subscription-active events.

#### Scenario: Failed payment marks the account past due
- **WHEN** Stripe reports a failed renewal charge via webhook
- **THEN** subscription status becomes `PAST_DUE`

#### Scenario: Monthly renewal resets credits (no rollover)
- **WHEN** a subscription renews successfully via webhook
- **THEN** remaining credits are forfeited via `EXPIRY`, a `SUBSCRIPTION_REFILL` of +17 is recorded, and balance becomes exactly 17

#### Scenario: Cancellation pending until period end
- **WHEN** Stripe reports the subscription is set to cancel at period end
- **THEN** subscription status becomes `CANCELLED_PENDING` and the member retains access until period end

#### Scenario: Cancellation takes effect at period end
- **WHEN** Stripe reports the subscription is deleted or fully ended after cancel-at-period-end
- **THEN** subscription status becomes `INACTIVE` and any remaining credits are forfeited with an `EXPIRY` ledger entry

#### Scenario: Invalid webhook signature is rejected
- **WHEN** a webhook request fails signature verification
- **THEN** the system does not mutate subscription or ledger state and responds with an error status

### Requirement: Staging payment configuration
Staging and local operator docs SHALL list Stripe and Resend environment variables and the Stripe test card used for the Phase 6 client demo. `apps/web/DEPLOYMENT.md` SHALL document webhook endpoint URL expectations, demo account / subscription notes for the subscribe→book→door-code path, and a staging smoke checklist that does not start Phase 7.

#### Scenario: Deployment docs list payment secrets
- **WHEN** an operator reads `apps/web/DEPLOYMENT.md`
- **THEN** they find `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_BASIC_BERLIN`, Resend vars (`RESEND_API_KEY`, `DAILY_CODES_FROM_EMAIL`), the Stripe test card instruction, and webhook/demo notes for Phase 6

#### Scenario: Staging smoke checklist closes Phase 6
- **WHEN** an operator follows the Phase 6 staging checklist in `DEPLOYMENT.md`
- **THEN** they can verify test card → `ACTIVE` → book → ticket (+ email when Resend is configured) without implementing waitlist or profile/billing work
