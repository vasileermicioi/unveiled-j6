/**
 * Stripe webhook HTTP handler.
 *
 * Env vars required (finalize in payments-booking-05 DEPLOYMENT.md):
 * - STRIPE_SECRET_KEY
 * - STRIPE_WEBHOOK_SECRET
 * - STRIPE_PRICE_ID_BASIC_BERLIN (Checkout; not required for webhook apply)
 * - STRIPE_PUBLISHABLE_KEY (reserved for future client use)
 * - SITE_URL
 * - DATABASE_URL
 * - RESEND_API_KEY / DAILY_CODES_FROM_EMAIL (subscription emails; skip if unset)
 */
import { applyStripeEvent, constructStripeEvent, createStripeClient } from "@unveiled/billing";
import { createTxDb } from "@unveiled/db";
import type { Context } from "hono";
import type Stripe from "stripe";

import { type RuntimeEnv, resolveEnvVarFromContext } from "./runtime-env";
import { getSiteUrl } from "./site-config";
import {
  lookupCancellationMemberByStripeSubscriptionId as lookupCancellationEmailMember,
  maybeSendSubscriptionCancellationEmail,
} from "./subscription-cancellation-email";
import {
  lookupMemberByStripeSubscriptionId as lookupInvoiceEmailMember,
  maybeSendSubscriptionInvoiceEmail,
} from "./subscription-invoice-email";

export async function stripeWebhookHandler(c: Context<{ Bindings: RuntimeEnv }>) {
  const secretKey = resolveEnvVarFromContext(c, "STRIPE_SECRET_KEY");
  const webhookSecret = resolveEnvVarFromContext(c, "STRIPE_WEBHOOK_SECRET");
  const databaseUrl = resolveEnvVarFromContext(c, "DATABASE_URL");

  if (!secretKey || !webhookSecret || !databaseUrl) {
    return c.json({ error: "Stripe webhook is not configured" }, 503);
  }

  const signature = c.req.header("stripe-signature");
  if (!signature) {
    return c.json({ error: "Missing stripe-signature header" }, 400);
  }

  const rawBody = await c.req.text();
  const stripe = createStripeClient(secretKey);

  let event: Stripe.Event;
  try {
    event = await constructStripeEvent(stripe, rawBody, signature, webhookSecret);
  } catch {
    return c.json({ error: "Invalid signature" }, 400);
  }

  const db = createTxDb(databaseUrl);
  // Snapshot the subscription status before the ledger apply so the
  // cancellation email can detect the transition into CANCELLED_PENDING
  // (already-pending redeliveries must not resend).
  let previousStatus: string | null = null;
  if (event.type === "customer.subscription.updated") {
    try {
      const stripeSubscriptionId = (event.data.object as Stripe.Subscription).id;
      if (stripeSubscriptionId) {
        const before = await db.query.subscriptions.findFirst({
          where: (fields, { eq }) => eq(fields.stripeSubscriptionId, stripeSubscriptionId),
        });
        previousStatus = before?.status ?? null;
      }
    } catch (error) {
      console.warn("cancellation email pre-apply lookup failed; proceeding", { error });
    }
  }
  try {
    const result = await applyStripeEvent(db, event, { stripe });
    try {
      const invoiceEmail = await maybeSendSubscriptionInvoiceEmail({
        event,
        stripe,
        apiKey: resolveEnvVarFromContext(c, "RESEND_API_KEY"),
        from: resolveEnvVarFromContext(c, "DAILY_CODES_FROM_EMAIL"),
        siteUrl: getSiteUrl(),
        lookupMemberByStripeSubscriptionId: (stripeSubscriptionId) =>
          lookupInvoiceEmailMember(db, stripeSubscriptionId),
      });
      const cancellationEmail = await maybeSendSubscriptionCancellationEmail({
        event,
        stripe,
        apiKey: resolveEnvVarFromContext(c, "RESEND_API_KEY"),
        from: resolveEnvVarFromContext(c, "DAILY_CODES_FROM_EMAIL"),
        siteUrl: getSiteUrl(),
        previousStatus,
        lookupMemberByStripeSubscriptionId: (stripeSubscriptionId) =>
          lookupCancellationEmailMember(db, stripeSubscriptionId),
      });
      if (invoiceEmail.status === "retry" || cancellationEmail.status === "retry") {
        return c.json({ received: true, ...result, invoiceEmail, cancellationEmail }, 500);
      }
      return c.json({ received: true, ...result, invoiceEmail, cancellationEmail }, 200);
    } catch (error) {
      console.error("subscription email threw after apply", error);
      return c.json({ received: true, ...result, error: "Subscription email send failed" }, 500);
    }
  } catch (error) {
    console.error("stripe webhook apply failed", error);
    return c.json({ error: "Webhook handler failed" }, 500);
  } finally {
    await db.pool.end().catch(() => undefined);
  }
}
