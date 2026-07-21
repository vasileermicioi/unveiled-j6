# Credits & Subscription

Credit ledger persistence for subscription refills, booking spend, expiry, refunds, and admin adjustments. Real Stripe Checkout activation, webhook-driven subscription lifecycle, Customer Portal from profile billing, and in-app cancel-at-period-end for Basic Berlin.

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

### Requirement: Credits marketing copy accuracy
Marketing and membership perk copy SHALL state that members receive fresh monthly credits and MUST NOT claim that credits roll over. App content modules and the `content-i18n-inventory.md` membership `perks[2]` entry SHALL agree on the corrected wording (for example DE: "17 Credits jeden Monat" / EN: "17 fresh credits every month").

#### Scenario: No rollover claim
- **WHEN** a guest views membership perks
- **THEN** copy does not say credits roll over

#### Scenario: Inventory documents corrected perk
- **WHEN** an agent reads `docs/product/extras/content-i18n-inventory.md` membership `perks[2]`
- **THEN** the entry reflects the corrected no-rollover wording and is not marked as needing copy correction

### Requirement: Staging payment configuration
Staging and local operator docs SHALL list Stripe and Resend environment variables and the Stripe test card used for membership demos. `apps/web/DEPLOYMENT.md` SHALL document webhook endpoint URL expectations, demo accounts, Phase 6 subscribe→book→door-code smoke, **and** a Phase 7 section covering Stripe Customer Portal dashboard settings (payment method + billing address updates; cancellation **at period end**), profile billing cancel → `CANCELLED_PENDING`, sold-out waitlist demo seed, and an explicit note that Phase 7 is complete — do **not** start Phase 8. No new app secrets are required for portal beyond existing `STRIPE_SECRET_KEY` and `SITE_URL` for `return_url`.

#### Scenario: Operator can configure staging payments
- **WHEN** an operator follows `DEPLOYMENT.md`
- **THEN** they can set Stripe + Resend vars and run the Phase 6 client demo path on staging

#### Scenario: Phase 6 demo stops before Phase 7 work
- **WHEN** Phase 6 release notes are read in isolation
- **THEN** they still describe the subscribe→book smoke without requiring waitlist/profile implementation in that historical section

#### Scenario: Phase 7 portal and stop gate documented
- **WHEN** an operator reads the Phase 7 section of `DEPLOYMENT.md` after this change
- **THEN** they find Customer Portal dashboard requirements, billing cancel demo notes, and “do not start Phase 8”

#### Scenario: Deployment docs list payment secrets
- **WHEN** an operator reads `apps/web/DEPLOYMENT.md`
- **THEN** they find `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_BASIC_BERLIN`, Resend vars (`RESEND_API_KEY`, `DAILY_CODES_FROM_EMAIL`), the Stripe test card instruction, and webhook/demo notes for Phase 6

#### Scenario: Staging smoke checklist closes Phase 6
- **WHEN** an operator follows the Phase 6 staging checklist in `DEPLOYMENT.md`
- **THEN** they can verify test card → `ACTIVE` → book → ticket (+ email when Resend is configured) without implementing waitlist or profile/billing work

### Requirement: Phase 7 credits-subscription Playwright close-out
The system SHALL implement (or replace Phase 7 “UI not built” skips with) Playwright coverage in `e2e/specs/credits-subscription.spec.ts` for Customer Portal recovery CTA, in-app cancel → `CANCELLED_PENDING`, period-end access until cancel takes effect, and reactivation from `INACTIVE` via membership Checkout, now that `/profile/billing` exists. Specs SHALL use verbatim Gherkin titles and proximity selectors. Deep Stripe Customer Portal hosted interaction MAY follow an opt-in/seed pattern documented in `e2e/README.md` (analogous to `E2E_STRIPE_CHECKOUT`). Monthly renewal EXPIRY MAY remain covered by package/webhook tests with an explicit skip note. Admin credit/freeze/comp scenarios are covered under admin-ops (Membership HQ mutation pages) and MUST NOT remain deferred solely as “Phase 8 — UI not built.”

#### Scenario: Portal recovery and cancel scenarios are executable
- **WHEN** `bun run test:e2e` runs the credits-subscription Phase 7 scenarios with `DATABASE_URL` available
- **THEN** recovering-from-past-due, cancelling, period-end, and reactivating scenarios pass via seeded state + profile billing UI, or skip only with documented env/opt-in reasons

#### Scenario: Admin credits scenarios covered by admin-ops
- **WHEN** admin-ops step 05 completes
- **THEN** admin adjust/freeze/comp/refund scenarios are `pass` or env-named `skip` / `deferred` → `seo-launch-polish-03` in the coverage matrix — not left as Phase 8 “UI not built”

### Requirement: Comp ticket domain helper
The system SHALL create complimentary confirmed bookings for a member through the shared booking transaction with capacity checks and without charging credits or writing a charge ledger entry.

#### Scenario: Comp ticket
- **WHEN** an admin issues a comp ticket for a member and event
- **THEN** a confirmed booking is created with `skipCreditCharge` semantics (credits unchanged; no charge ledger row)

### Requirement: Admin credits-ops Playwright coverage
The system SHALL implement Playwright coverage in `e2e/specs/credits-subscription.spec.ts` for admin adjust, zero-amount rejection, manual refund, freeze, unfreeze, and complimentary ticket scenarios now that Membership HQ mutation pages exist. Specs SHALL use verbatim Gherkin titles and proximity selectors (navigating `/:locale/admin/users/:id/*` as needed). Skips SHALL only use documented env prerequisites — not “Phase 8 — admin … UI.”

#### Scenario: Admin credit and freeze scenarios are executable
- **WHEN** `bun run test:e2e` runs the credits-subscription admin scenarios with `DATABASE_URL` and admin credentials available
- **THEN** adjust, zero rejection, refund, freeze, unfreeze, and comp-ticket scenarios pass via Membership HQ SSR forms, or skip only with documented env reasons

### Requirement: Membership marketing benefits presentation
The membership page SHALL present plan benefits as a vertical list. Each benefit SHALL include a distinct icon bullet and localized text. Horizontal three-up perk cards SHALL NOT be the default presentation.

#### Scenario: Vertical icon benefits on membership
- **WHEN** a user views `/:locale/membership`
- **THEN** benefits appear stacked vertically with icons
- **AND** each benefit remains readable in DE and EN

#### Scenario: Same presentation after subscribe
- **WHEN** an `ACTIVE` member views `/:locale/membership`
- **THEN** the benefits list remains a vertical icon-bullet stack (not a three-column perk card strip)
