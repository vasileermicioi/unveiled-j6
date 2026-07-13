/**
 * Stripe Billing domain package (Phase 6+).
 *
 * Env vars (document in apps/web/DEPLOYMENT.md):
 * - STRIPE_SECRET_KEY
 * - STRIPE_PUBLISHABLE_KEY (reserved for future client use)
 * - STRIPE_WEBHOOK_SECRET
 * - STRIPE_PRICE_ID_BASIC_BERLIN
 * - SITE_URL (Checkout success/cancel + Customer Portal return_url)
 *
 * ## Customer Portal (Phase 7 / waitlist-account-04)
 *
 * - `createBillingPortalSession` — open Stripe-hosted portal for payment method /
 *   billing address updates. Pass `customerId` from `subscriptions.stripe_customer_id`
 *   (session user’s row only).
 * - `cancelSubscriptionAtPeriodEnd` — sets Stripe `cancel_at_period_end` and optionally
 *   syncs local status via `applySubscriptionUpdated` → `CANCELLED_PENDING`.
 *
 * ### Stripe Dashboard config (handoff for step 05 DEPLOYMENT.md)
 *
 * Enable Customer Portal in the Stripe Dashboard (test + live):
 * - Allow customers to update payment methods
 * - Allow customers to update billing information / address
 * - Cancellation mode: **cancel at period end** (not immediate)
 *
 * No new app env vars beyond existing Stripe keys + `SITE_URL` for `return_url`.
 *
 * Webhooks remain the source of truth for portal-driven events
 * (`customer.subscription.updated` / `.deleted`, invoice paid/failed).
 * Do not add a second EXPIRY ledger writer — renewals and period-end expiry stay in
 * `activateOrRenewCredits` / `applySubscriptionDeleted`.
 */

export type { CancelSubscriptionAtPeriodEndInput } from "./cancel-subscription";
export { cancelSubscriptionAtPeriodEnd } from "./cancel-subscription";
export type { CreateCheckoutSessionInput } from "./checkout";
export {
  BASIC_BERLIN_PLAN,
  createCheckoutSession,
  MONTHLY_CREDIT_ALLOWANCE,
} from "./checkout";
export type { FreezeMemberErrorCode, FreezeMemberInput } from "./freeze-member";
export {
  FreezeMemberError,
  freezeMember,
  isFreezeMemberError,
  unfreezeMember,
} from "./freeze-member";
export type { BillingPackageId } from "./package-id";
export { BILLING_PACKAGE } from "./package-id";
export type { CreateBillingPortalSessionInput } from "./portal";
export { createBillingPortalSession } from "./portal";

export { createStripeClient, STRIPE_API_VERSION } from "./stripe-client";
export type {
  ActivateOrRenewInput,
  ApplySubscriptionDeletedInput,
  ApplySubscriptionUpdatedInput,
  MarkPastDueInput,
} from "./subscription-lifecycle";
export {
  activateOrRenewCredits,
  applySubscriptionDeleted,
  applySubscriptionUpdated,
  isUniqueViolation,
  markPastDue,
  periodEndFromUnix,
  resolveUserIdFromCheckoutSession,
} from "./subscription-lifecycle";
export type { ApplyStripeEventResult } from "./webhooks";
export {
  applyStripeEvent,
  constructStripeEvent,
  periodEndFromSubscription,
  subscriptionIdFromInvoice,
} from "./webhooks";
