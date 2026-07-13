import type Stripe from "stripe";

export type CreateBillingPortalSessionInput = {
  stripe: Stripe;
  customerId: string;
  returnUrl: string;
};

/**
 * Creates a Stripe Customer Portal session for payment-method / billing updates.
 * Caller MUST supply `customerId` from the session user's subscriptions row —
 * never from a client-supplied form field.
 */
export async function createBillingPortalSession(
  input: CreateBillingPortalSessionInput,
): Promise<Stripe.BillingPortal.Session> {
  const { stripe, customerId, returnUrl } = input;

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
