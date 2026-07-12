import type { TxDb } from "@unveiled/db";
import type Stripe from "stripe";

import {
  activateOrRenewCredits,
  applySubscriptionDeleted,
  applySubscriptionUpdated,
  markPastDue,
  periodEndFromUnix,
  resolveUserIdFromCheckoutSession,
} from "./subscription-lifecycle";

export type ApplyStripeEventResult = {
  handled: boolean;
  action?: string;
};

/**
 * Verify Stripe webhook signature and parse the event.
 * Uses async crypto (SubtleCrypto) so Bun / Cloudflare Workers stay compatible.
 * Throws on invalid signatures.
 */
export async function constructStripeEvent(
  stripe: Stripe,
  rawBody: string | Buffer,
  signature: string,
  webhookSecret: string,
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
}

function customerIdOf(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | null {
  if (!customer) {
    return null;
  }
  return typeof customer === "string" ? customer : customer.id;
}

function subscriptionIdOf(
  subscription: string | Stripe.Subscription | null | undefined,
): string | null {
  if (!subscription) {
    return null;
  }
  return typeof subscription === "string" ? subscription : subscription.id;
}

/** Basil+ Invoice API nests subscription under parent.subscription_details. */
export function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const fromParent = invoice.parent?.subscription_details?.subscription;
  if (fromParent) {
    return subscriptionIdOf(fromParent);
  }
  // Older payload shape / expanded fixtures may still carry top-level subscription.
  const legacy = (invoice as { subscription?: string | Stripe.Subscription | null }).subscription;
  return subscriptionIdOf(legacy);
}

/** Period end lives on subscription items in API 2025-08-27.basil+. */
export function periodEndFromSubscription(sub: Stripe.Subscription): Date | null {
  const fromItem = sub.items?.data?.[0]?.current_period_end;
  if (fromItem != null) {
    return periodEndFromUnix(fromItem);
  }
  const legacy = (sub as { current_period_end?: number }).current_period_end;
  return periodEndFromUnix(legacy);
}

/**
 * Apply a verified Stripe event to subscriptions + credit ledger.
 * Idempotent under Stripe retries via ledger idempotency keys / set-based status writes.
 */
export async function applyStripeEvent(
  db: TxDb,
  event: Stripe.Event,
  options?: { stripe?: Stripe },
): Promise<ApplyStripeEventResult> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") {
        return { handled: false, action: "ignored_non_subscription_checkout" };
      }

      const userId = resolveUserIdFromCheckoutSession(session);
      if (!userId) {
        return { handled: false, action: "missing_user_id" };
      }

      const stripeSubscriptionId = subscriptionIdOf(session.subscription);
      const stripeCustomerId = customerIdOf(session.customer);

      let periodEnd: Date | null = null;
      if (options?.stripe && stripeSubscriptionId) {
        const sub = await options.stripe.subscriptions.retrieve(stripeSubscriptionId);
        periodEnd = periodEndFromSubscription(sub);
      }

      await activateOrRenewCredits(db, {
        userId,
        stripeCustomerId,
        stripeSubscriptionId,
        periodEnd,
        idempotencySuffix: session.id,
      });

      return { handled: true, action: "checkout_activated" };
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      // First activation is handled by checkout.session.completed; only refill on cycle renewals
      // to avoid double SUBSCRIPTION_REFILL with subscription_create.
      if (invoice.billing_reason !== "subscription_cycle") {
        return { handled: false, action: "ignored_invoice_paid_reason" };
      }

      const stripeSubscriptionId = subscriptionIdFromInvoice(invoice);
      const stripeCustomerId = customerIdOf(invoice.customer);
      if (!stripeSubscriptionId) {
        return { handled: false, action: "missing_subscription" };
      }

      const subscription = await db.query.subscriptions.findFirst({
        where: (fields, { eq }) => eq(fields.stripeSubscriptionId, stripeSubscriptionId),
      });
      if (!subscription) {
        return { handled: false, action: "subscription_not_found" };
      }

      let periodEnd: Date | null = null;
      if (options?.stripe) {
        const sub = await options.stripe.subscriptions.retrieve(stripeSubscriptionId);
        periodEnd = periodEndFromSubscription(sub);
      } else if (invoice.lines.data[0]?.period?.end) {
        periodEnd = periodEndFromUnix(invoice.lines.data[0].period.end);
      }

      await activateOrRenewCredits(db, {
        userId: subscription.userId,
        stripeCustomerId: stripeCustomerId ?? subscription.stripeCustomerId,
        stripeSubscriptionId,
        periodEnd,
        idempotencySuffix: invoice.id ?? event.id,
      });

      return { handled: true, action: "renewal_refilled" };
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const result = await markPastDue(db, {
        stripeCustomerId: customerIdOf(invoice.customer),
        stripeSubscriptionId: subscriptionIdFromInvoice(invoice),
      });
      return {
        handled: result.applied,
        action: result.applied ? "marked_past_due" : "past_due_skipped",
      };
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const result = await applySubscriptionUpdated(db, {
        stripeSubscriptionId: sub.id,
        stripeCustomerId: customerIdOf(sub.customer),
        cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
        stripeStatus: sub.status,
        periodEnd: periodEndFromSubscription(sub),
      });
      return {
        handled: result.applied,
        action: result.applied
          ? `subscription_updated:${result.status}`
          : "subscription_update_skipped",
      };
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const result = await applySubscriptionDeleted(db, {
        stripeSubscriptionId: sub.id,
        stripeCustomerId: customerIdOf(sub.customer),
        idempotencySuffix: event.id,
      });
      return {
        handled: result.applied,
        action: result.applied ? "subscription_deleted" : "subscription_delete_skipped",
      };
    }

    default:
      return { handled: false, action: `ignored:${event.type}` };
  }
}
