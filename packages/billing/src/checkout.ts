import type Stripe from "stripe";

export const BASIC_BERLIN_PLAN = "Basic Berlin";
export const MONTHLY_CREDIT_ALLOWANCE = 17;

export type CheckoutLocale = "de" | "en";

export type CreateCheckoutSessionInput = {
  stripe: Stripe;
  priceId: string;
  userId: string;
  customerEmail: string;
  locale: CheckoutLocale;
  stripeCustomerId?: string | null;
  successUrl: string;
  cancelUrl: string;
};

/**
 * Creates a subscription Checkout Session for Basic Berlin.
 * Omits `payment_method_types` so Stripe dynamic payment methods apply.
 * Enables `allow_promotion_codes` so Checkout shows the voucher / promo-code field.
 * Do not also pass `discounts` — Stripe rejects the two together.
 */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<Stripe.Checkout.Session> {
  const {
    stripe,
    priceId,
    userId,
    customerEmail,
    locale,
    stripeCustomerId,
    successUrl,
    cancelUrl,
  } = input;

  const customerFields: Pick<Stripe.Checkout.SessionCreateParams, "customer" | "customer_email"> =
    stripeCustomerId ? { customer: stripeCustomerId } : { customer_email: customerEmail };

  return stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    metadata: { userId },
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { userId, locale },
    },
    ...customerFields,
  });
}
