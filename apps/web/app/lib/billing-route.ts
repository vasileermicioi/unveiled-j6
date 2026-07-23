import {
  cancelSubscriptionAtPeriodEnd,
  createBillingPortalSession,
  createStripeClient,
} from "@unveiled/billing";
import { createTxDb, type Subscription } from "@unveiled/db";
import type { Context } from "hono";

import { getAuthOptions } from "./auth";
import { getBillingCopy } from "./billing-content";
import type { Locale } from "./locale";
import { guardProfileRoute } from "./profile-route";
import { resolveEnvVarFromContext } from "./runtime-env";
import { getSiteUrl } from "./site-config";

export async function loadUserSubscription(userId: string): Promise<Subscription | null> {
  const { db } = getAuthOptions();
  const subscription = await db.query.subscriptions.findFirst({
    where: (fields, { eq }) => eq(fields.userId, userId),
  });
  return subscription ?? null;
}

export async function handleBillingPortalPost(
  c: Context,
  options?: { returnPath?: string },
): Promise<
  | { kind: "redirect"; location: string }
  | { kind: "error"; locale: Locale; message: string; subscription: Subscription | null }
  | Response
> {
  const guard = await guardProfileRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const { locale, session } = guard;
  const copy = getBillingCopy(locale);
  const subscription = await loadUserSubscription(session.user.id);

  if (!subscription?.stripeCustomerId) {
    return {
      kind: "error",
      locale,
      message: copy.portalMissingCustomer,
      subscription,
    };
  }

  if (subscription.status === "UNPAID") {
    return {
      kind: "error",
      locale,
      message: copy.unpaidBody,
      subscription,
    };
  }

  const secretKey = resolveEnvVarFromContext(c, "STRIPE_SECRET_KEY");
  if (!secretKey) {
    return {
      kind: "error",
      locale,
      message: copy.portalError,
      subscription,
    };
  }

  const siteUrl = getSiteUrl();
  const returnPath = options?.returnPath ?? "profile/billing";
  const returnUrl = `${siteUrl}/${locale}/${returnPath}`;
  const stripe = createStripeClient(secretKey);

  try {
    const portalSession = await createBillingPortalSession({
      stripe,
      customerId: subscription.stripeCustomerId,
      returnUrl,
    });
    if (!portalSession.url) {
      throw new Error("Billing portal session missing URL");
    }
    return { kind: "redirect", location: portalSession.url };
  } catch (error) {
    console.error("createBillingPortalSession failed", error);
    return {
      kind: "error",
      locale,
      message: copy.portalError,
      subscription,
    };
  }
}

export async function handleBillingCancelPost(
  c: Context,
): Promise<
  | { kind: "redirect"; location: string }
  | { kind: "error"; locale: Locale; message: string }
  | Response
> {
  const guard = await guardProfileRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const { locale, session } = guard;
  const copy = getBillingCopy(locale);
  const subscription = await loadUserSubscription(session.user.id);

  if (!subscription?.stripeSubscriptionId || subscription.status !== "ACTIVE") {
    return {
      kind: "error",
      locale,
      message: copy.cancelMissingSubscription,
    };
  }

  const secretKey = resolveEnvVarFromContext(c, "STRIPE_SECRET_KEY");
  const databaseUrl = resolveEnvVarFromContext(c, "DATABASE_URL");
  if (!secretKey || !databaseUrl) {
    return {
      kind: "error",
      locale,
      message: copy.cancelError,
    };
  }

  const stripe = createStripeClient(secretKey);
  const txDb = createTxDb(databaseUrl);

  try {
    await cancelSubscriptionAtPeriodEnd({
      stripe,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      stripeCustomerId: subscription.stripeCustomerId,
      db: txDb,
    });
    return {
      kind: "redirect",
      location: `/${locale}/profile/billing?cancelled=1`,
    };
  } catch (error) {
    console.error("cancelSubscriptionAtPeriodEnd failed", error);
    return {
      kind: "error",
      locale,
      message: copy.cancelError,
    };
  } finally {
    await txDb.pool.end().catch(() => undefined);
  }
}
