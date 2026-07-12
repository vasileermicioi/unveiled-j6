## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/payments-booking-02-stripe-checkout-and-webhooks.md`, parent guide non-goals, `docs/product/features/credits-subscription.feature`, and Stripe Checkout/webhook guidance (omit `payment_method_types`)
- [x] 1.2 Confirm step 01 artifacts: `credit_ledger` / subscriptions schema, `createTxDb`, stub `@unveiled/billing`; note current marketing-only `membership.tsx`
- [x] 1.3 Add `stripe` dependency to `@unveiled/billing` and wire `apps/web` → `@unveiled/billing` workspace dep; add billing `test` script if missing

## 2. Billing package — Checkout and lifecycle

- [x] 2.1 Implement `createStripeClient` and `createCheckoutSession` (Basic Berlin price from env; locale-aware success/cancel URLs; reuse `stripeCustomerId` when present; metadata/`client_reference_id` = user id; no `payment_method_types`)
- [x] 2.2 Implement transactional `activateOrRenewCredits` (lock user; `EXPIRY` then `SUBSCRIPTION_REFILL` +17; `users.credits = 17`; status `ACTIVE`; Stripe IDs + `periodEnd`; idempotency keys)
- [x] 2.3 Implement webhook verify + `applyStripeEvent` for `checkout.session.completed`, `invoice.paid` (renewal/`subscription_cycle`), `invoice.payment_failed` → `PAST_DUE`, `customer.subscription.updated` → `CANCELLED_PENDING` / sync, `customer.subscription.deleted` → `INACTIVE` + EXPIRY; never clear `UNPAID` via Stripe active events
- [x] 2.4 Export public API from `packages/billing/src/index.ts`

## 3. Webhook route and membership UX

- [x] 3.1 Register `POST /api/webhooks/stripe` on outer Hono app in `apps/web/app/server.ts` (before locale catch-all); raw body + signature verification; per-request `createTxDb` + `pool.end`
- [x] 3.2 Update `/:locale/membership` GET for signed-in states: Checkout CTA, already-`ACTIVE` (and mid-period `CANCELLED_PENDING`) success, `UNPAID` payment-stopped + `support@unveiled.berlin`; guests keep marketing + auth CTA (HeroUI-only)
- [x] 3.3 Add membership `POST` to start Checkout (block `UNPAID` / short-circuit `ACTIVE`); 302 to Stripe Session URL; success return toward `/:locale/events`
- [x] 3.4 List required Stripe env vars in handoff comments for step 05 `DEPLOYMENT.md` (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_BASIC_BERLIN`, `STRIPE_PUBLISHABLE_KEY`, `SITE_URL`)

## 4. Tests, validation, handoff

- [x] 4.1 Add `@unveiled/billing` tests with fixture/signed event payloads covering activation refill, renewal no-rollover, `PAST_DUE`, cancel pending/deleted, invalid signature, and idempotent retry (no live Stripe network)
- [x] 4.2 Run `bun --filter @unveiled/billing test`, `bun run lint`, and `bun run typecheck` until all exit 0
- [x] 4.3 Confirm no booking routes, Customer Portal UI, or Playwright specs were added; mark step 02 done in `payments-booking-parent-guide.md`
