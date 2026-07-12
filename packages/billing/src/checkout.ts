import type Stripe from "stripe";

export const BASIC_BERLIN_PLAN = "Basic Berlin";
export const MONTHLY_CREDIT_ALLOWANCE = 17;

export type CreateCheckoutSessionInput = {
  stripe: Stripe;
  priceId: string;
  userId: string;
  customerEmail: string;
  stripeCustomerId?: string | null;
  successUrl: string;
  cancelUrl: string;
};

/**
 * Creates a subscription Checkout Session for Basic Berlin.
 * Omits `payment_method_types` so Stripe dynamic payment methods apply.
 */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<Stripe.Checkout.Session> {
  const { stripe, priceId, userId, customerEmail, stripeCustomerId, successUrl, cancelUrl } = input;

  const customerFields: Pick<Stripe.Checkout.SessionCreateParams, "customer" | "customer_email"> =
    stripeCustomerId ? { customer: stripeCustomerId } : { customer_email: customerEmail };

  return stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
    ...customerFields,
  });
}
