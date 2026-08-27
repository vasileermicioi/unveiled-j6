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
 * - RESEND_API_KEY / DAILY_CODES_FROM_EMAIL (invoice email; skip if unset)
 */
import { applyStripeEvent, constructStripeEvent, createStripeClient } from "@unveiled/billing";
import { createTxDb } from "@unveiled/db";
import type { Context } from "hono";
import type Stripe from "stripe";

import { type RuntimeEnv, resolveEnvVarFromContext } from "./runtime-env";
import { getSiteUrl } from "./site-config";
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
      if (invoiceEmail.status === "retry") {
        return c.json({ received: true, ...result, invoiceEmail }, 500);
      }
      return c.json({ received: true, ...result, invoiceEmail }, 200);
    } catch (error) {
      console.error("subscription invoice email threw after apply", error);
      return c.json({ received: true, ...result, error: "Invoice email send failed" }, 500);
    }
  } catch (error) {
    console.error("stripe webhook apply failed", error);
    return c.json({ error: "Webhook handler failed" }, 500);
  } finally {
    await db.pool.end().catch(() => undefined);
  }
}
