/**
 * Stripe Billing domain package (Phase 6+).
 *
 * Env vars (document in apps/web/DEPLOYMENT.md in payments-booking-05):
 * - STRIPE_SECRET_KEY
 * - STRIPE_PUBLISHABLE_KEY (reserved for future client use)
 * - STRIPE_WEBHOOK_SECRET
 * - STRIPE_PRICE_ID_BASIC_BERLIN
 * - SITE_URL (Checkout success/cancel absolute URLs)
 */

export type { CreateCheckoutSessionInput } from "./checkout";
export {
  BASIC_BERLIN_PLAN,
  createCheckoutSession,
  MONTHLY_CREDIT_ALLOWANCE,
} from "./checkout";
export type { BillingPackageId } from "./package-id";
export { BILLING_PACKAGE } from "./package-id";

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
