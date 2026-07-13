import type { TxDb } from "@unveiled/db";
import type Stripe from "stripe";

import { applySubscriptionUpdated, periodEndFromUnix } from "./subscription-lifecycle";
import { periodEndFromSubscription } from "./webhooks";

export type CancelSubscriptionAtPeriodEndInput = {
  stripe: Stripe;
  /** Resolved from the session user's subscriptions row — never from client form fields. */
  stripeSubscriptionId: string;
  stripeCustomerId?: string | null;
  /**
   * When provided, applies the same lifecycle path as `customer.subscription.updated`
   * so UI shows `CANCELLED_PENDING` before the webhook arrives (idempotent with webhook).
   */
  db?: TxDb;
};

/**
 * Sets Stripe `cancel_at_period_end` and optionally syncs local status via
 * `applySubscriptionUpdated` (same writer the webhook uses — no parallel status path).
 */
export async function cancelSubscriptionAtPeriodEnd(
  input: CancelSubscriptionAtPeriodEndInput,
): Promise<{
  subscription: Stripe.Subscription;
  local: Awaited<ReturnType<typeof applySubscriptionUpdated>> | null;
}> {
  const { stripe, stripeSubscriptionId, stripeCustomerId, db } = input;

  const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  if (!db) {
    return { subscription, local: null };
  }

  const periodEnd =
    periodEndFromSubscription(subscription) ??
    periodEndFromUnix(typeof subscription.cancel_at === "number" ? subscription.cancel_at : null);

  const local = await applySubscriptionUpdated(db, {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId:
      stripeCustomerId ??
      (typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    stripeStatus: subscription.status,
    periodEnd,
  });

  return { subscription, local };
}
