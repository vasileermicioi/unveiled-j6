## Why

Step 01 landed `credit_ledger`, the transactional DB client, and a stub `@unveiled/billing` package, but `/membership` is still marketing-only and subscription status never moves from Stripe. Without real Checkout Sessions and verified webhooks, members cannot activate Basic Berlin or receive renewal/refill ledger writes — blocking the Phase 6 “money in” half of the product loop.

## What Changes

- Implement `@unveiled/billing`: Stripe client factory, `createCheckoutSession` for `STRIPE_PRICE_ID_BASIC_BERLIN`, and helpers that apply verified webhook events to `subscriptions` + credit ledger
- Add webhook route `apps/web/app/routes/api/webhooks/stripe.ts` (or HonoX-equivalent) handling at least `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted` with `STRIPE_WEBHOOK_SECRET` signature verification
- On successful activation/renewal: forfeit remaining credits with `EXPIRY` (amount 0 allowed), then `SUBSCRIPTION_REFILL` +17, set `users.credits` to exactly 17, status `ACTIVE`, store Stripe customer/subscription IDs + `period_end` — all inside a transactional client write
- Upgrade `/:locale/membership` for signed-in members: form POST → Stripe Checkout redirect; already-`ACTIVE` success state; `UNPAID` “payment stopped” + support contact; guests keep plan marketing + auth CTA; success return URL toward locale-prefixed `/events`
- Package/integration tests with fixture Stripe event payloads (no live network required)
- Document required Stripe env vars for step 05 `DEPLOYMENT.md` (notes in code / handoff this step)

## Capabilities

### New Capabilities

- _(none)_ — Checkout and webhook lifecycle extend the existing credits/subscription capability

### Modified Capabilities

- `credits-subscription`: Real Stripe Checkout activation (blocked when `UNPAID`, short-circuit when `ACTIVE`); webhook-driven status machine (`ACTIVE` / `PAST_DUE` / `CANCELLED_PENDING` / `INACTIVE`) and no-rollover renewal refill via `EXPIRY` + `SUBSCRIPTION_REFILL`

## Impact

- **Code:** `packages/billing` (real Stripe exports); `apps/web` membership route + webhook handler; thin wiring to `createTxDb` / subscription + ledger writes (domain helpers in billing and/or `@unveiled/db`)
- **Deps:** `stripe` SDK in `@unveiled/billing`; `apps/web` depends on `@unveiled/billing`
- **Env:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_BASIC_BERLIN`
- **Downstream:** Consumed by `payments-booking-03` (booking gate needs realistic `ACTIVE` path) and later UI/e2e steps
- **Out of scope:** Atomic `bookEvent`, `/bookings`, confirmation email, Customer Portal UI (`/profile/billing`), admin freeze UI, Playwright, Ladle
