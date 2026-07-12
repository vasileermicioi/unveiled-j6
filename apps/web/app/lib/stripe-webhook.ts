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
 */
import { applyStripeEvent, constructStripeEvent, createStripeClient } from "@unveiled/billing";
import { createTxDb } from "@unveiled/db";
import type { Context } from "hono";
import type Stripe from "stripe";

import { type RuntimeEnv, resolveEnvVarFromContext } from "./runtime-env";

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
    return c.json({ received: true, ...result }, 200);
  } catch (error) {
    console.error("stripe webhook apply failed", error);
    return c.json({ error: "Webhook handler failed" }, 500);
  } finally {
    await db.pool.end().catch(() => undefined);
  }
}
