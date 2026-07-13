## ADDED Requirements

### Requirement: Stripe Customer Portal from profile billing

The system SHALL let members open the Stripe Customer Portal from `/profile/billing` to update payment method and billing details, using the Stripe customer id stored on their subscription row (never a client-supplied customer id). Portal sessions SHALL be created via `@unveiled/billing` and opened through an SSR form POST that redirects to the Stripe-hosted portal URL. Status transitions after portal actions SHALL continue to flow through existing verified Stripe webhooks — the system MUST NOT invent a parallel recovery API.

#### Scenario: Update billing information

- **WHEN** a member opens the Customer Portal from profile billing and updates payment method or address
- **THEN** Stripe stores the changes and the app reflects status transitions via existing webhooks

#### Scenario: Recovering from past due

- **WHEN** a `PAST_DUE` member updates payment via the Customer Portal and the retried charge succeeds
- **THEN** webhooks restore `ACTIVE` without inventing a parallel recovery API

#### Scenario: Portal blocked without Stripe customer

- **WHEN** a member without a stored `stripe_customer_id` attempts to open the Customer Portal
- **THEN** the portal session is not created and the member sees an actionable error (or reactivation path) instead of a Stripe redirect

### Requirement: In-app subscription cancel

The system SHALL support cancelling from profile billing such that Stripe `cancel_at_period_end` is set and local status becomes `CANCELLED_PENDING` immediately (via webhook and/or an explicit lifecycle call consistent with `applySubscriptionUpdated`), with booking access and current credits retained until period end. Credits MUST NOT be claimed to roll over in billing UI copy. The system MUST NOT add a second EXPIRY ledger implementation — renewal and period-end expiry continue to use existing `activateOrRenewCredits` / `applySubscriptionDeleted` writers.

#### Scenario: Cancelling a subscription

- **WHEN** a member cancels in-app (or via Customer Portal cancel-at-period-end)
- **THEN** status is `CANCELLED_PENDING` and credits remain usable until period end

#### Scenario: Cancel confirm is SSR

- **WHEN** a member confirms cancellation on the dedicated cancel confirm flow
- **THEN** the mutation is an SSR form POST (no client-only cancel modal) and redirects back to billing or profile with updated state

#### Scenario: Reactivating after cancellation

- **WHEN** a member’s subscription is `INACTIVE` after a previous cancellation
- **THEN** billing UX offers reactivation via existing membership Checkout (`/:locale/membership`), not a new Stripe product

#### Scenario: Monthly renewal resets credits (no rollover)

- **WHEN** a subscription renews successfully via Stripe webhook
- **THEN** an `EXPIRY` entry records forfeited credits (0 allowed) and balance becomes exactly 17 after refill

## MODIFIED Requirements

### Requirement: Webhook-driven subscription lifecycle

The system SHALL verify Stripe webhook signatures with `STRIPE_WEBHOOK_SECRET` and SHALL update `subscriptions` and the credit ledger from verified events for activation/renewal, failed renewal, subscription updates, and deletion. Webhook application SHALL be idempotent under Stripe retries. Admin-frozen `UNPAID` status SHALL NOT be cleared to `ACTIVE` or `PAST_DUE` solely by Stripe subscription-active events. In-app cancel and Customer Portal actions SHALL remain compatible with this webhook path: `cancel_at_period_end` → `CANCELLED_PENDING`, successful payment recovery from `PAST_DUE` → `ACTIVE`, and period-end deletion → `INACTIVE` + EXPIRY via the existing lifecycle helpers (no duplicate EXPIRY writers).

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
