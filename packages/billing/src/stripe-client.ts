import Stripe from "stripe";

/** Stripe API version pinned for Billing Checkout + webhooks. */
export const STRIPE_API_VERSION = "2025-08-27.basil" as const;

export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
  });
}
