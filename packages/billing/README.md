# @unveiled/billing

Stripe Billing domain for Unveiled Berlin: Checkout, webhooks, credit lifecycle, Customer Portal, and cancel-at-period-end.

## Public API

| Export | Role |
|---|---|
| `createCheckoutSession` | Basic Berlin subscription Checkout (`allow_promotion_codes`) |
| `createBillingPortalSession` | Stripe Customer Portal session (`customer` + `return_url`) |
| `cancelSubscriptionAtPeriodEnd` | Stripe `cancel_at_period_end` + optional local `CANCELLED_PENDING` via `applySubscriptionUpdated` |
| `applyStripeEvent` / `constructStripeEvent` | Verified webhook application |
| `activateOrRenewCredits` | Activation resets to +17 (EXPIRY + refill); renewal stacks +17 capped at 34 (refill + cap-excess EXPIRY) |
| `applySubscriptionUpdated` / `applySubscriptionDeleted` / `markPastDue` | Lifecycle status sync |

## Security

Never trust client-supplied `stripeCustomerId` or `stripeSubscriptionId`. Load them from the session user’s `subscriptions` row before calling portal or cancel helpers.

## Customer Portal dashboard (step 05 handoff)

Enable the [Customer Portal](https://docs.stripe.com/customer-management/integrate-customer-portal) in Stripe Dashboard (test + live):

1. Payment method updates — on
2. Billing address / customer information updates — on
3. Cancellation — **at end of billing period** (not immediate cancel)

App env: existing `STRIPE_SECRET_KEY` + `SITE_URL` for portal `return_url` (`/{locale}/profile/billing`). No new secrets for portal/cancel.

## Subscription coupons / vouchers

Checkout Sessions set `allow_promotion_codes: true` so the hosted page shows **Add promotion code**. Creating a Coupon in the Dashboard is not enough:

1. Create a **Coupon** (the discount). Restricting it to the Basic Berlin product/price is fine.
2. Create a customer-facing **Promotion code** for that coupon (Product catalog → Coupons → the coupon → Promotion codes). Members type that code, not the coupon id.

Do not attach a coupon via Checkout `discounts` — that would hide the input and apply one coupon to every session.

## Credits / EXPIRY

Unused credits roll over on every monthly renewal (`kind: "renewal"` in
`activateOrRenewCredits`) up to `MAX_CREDIT_BALANCE` (34 = 2 months' worth):
the refill stacks and any excess above the cap is forfeited via `EXPIRY`
(amount 0 when under the cap). First activation and resubscription
(`kind: "activation"`) still reset to exactly 17 via `EXPIRY`. Period-end
deletion still forfeits via `EXPIRY` in `applySubscriptionDeleted`.
Do **not** add a second EXPIRY implementation.
