import { periodEndFromSubscription, periodEndFromUnix } from "@unveiled/billing";
import type { ProfileLanguage, TxDb } from "@unveiled/db";
import {
  type SendSubscriptionCancellationInput,
  sendSubscriptionCancellation,
} from "@unveiled/email";
import type Stripe from "stripe";

import { type InvoiceEmailLocale, resolveInvoiceEmailLocale } from "./subscription-invoice-email";

export type CancellationEmailMember = {
  email: string | null;
  profileLanguage: ProfileLanguage | null;
  periodEnd: Date | null;
};

export type CancellationEmailResult =
  | { status: "skipped"; reason: string }
  | { status: "sent" }
  | { status: "retry"; reason: string };

export type CancellationEmailSendFn = typeof sendSubscriptionCancellation;

export type MaybeSendSubscriptionCancellationEmailInput = {
  event: Stripe.Event;
  stripe: Stripe;
  apiKey: string | undefined;
  from: string | undefined;
  siteUrl: string;
  /**
   * Subscription status snapshot taken before `applyStripeEvent` ran.
   * The mail fires only on the transition into `CANCELLED_PENDING`:
   * `undefined`/`null` (row missing) still sends when the Stripe object shows
   * a scheduled cancel; `CANCELLED_PENDING` skips as already-pending and
   * `UNPAID` skips as admin-frozen.
   */
  previousStatus?: string | null;
  lookupMemberByStripeSubscriptionId: (
    stripeSubscriptionId: string,
  ) => Promise<CancellationEmailMember | null>;
  sendCancellation?: CancellationEmailSendFn;
  fetchImpl?: SendSubscriptionCancellationInput["fetchImpl"];
};

export async function lookupCancellationMemberByStripeSubscriptionId(
  db: TxDb,
  stripeSubscriptionId: string,
): Promise<CancellationEmailMember | null> {
  const subscription = await db.query.subscriptions.findFirst({
    where: (fields, { eq }) => eq(fields.stripeSubscriptionId, stripeSubscriptionId),
  });
  if (!subscription) {
    return null;
  }

  const user = await db.query.users.findFirst({
    where: (fields, { eq }) => eq(fields.id, subscription.userId),
  });
  if (!user) {
    return null;
  }

  const language = user.profile.language;
  return {
    email: user.email,
    profileLanguage: language === "EN" || language === "DE" ? language : null,
    periodEnd: subscription.periodEnd,
  };
}

function skipped(reason: string): CancellationEmailResult {
  return { status: "skipped", reason };
}

function retry(reason: string): CancellationEmailResult {
  return { status: "retry", reason };
}

function logSkip(reason: string, details: Record<string, string | undefined>): void {
  console.warn("subscription cancellation email skipped", { reason, ...details });
}

function logRetry(reason: string, details: Record<string, string | number | undefined>): void {
  console.error("subscription cancellation email retry", { reason, ...details });
}

function customerEmailFromSubscription(sub: Stripe.Subscription): string | undefined {
  const customer = sub.customer;
  if (customer && typeof customer === "object" && !("deleted" in customer && customer.deleted)) {
    const email = (customer as Stripe.Customer).email;
    return typeof email === "string" && email.trim().length > 0 ? email.trim() : undefined;
  }
  return undefined;
}

function endDateFromSubscription(sub: Stripe.Subscription): Date | null {
  return (
    periodEndFromSubscription(sub) ??
    periodEndFromUnix(typeof sub.cancel_at === "number" ? sub.cancel_at : null)
  );
}

/**
 * After `applyStripeEvent`, send the scheduled-cancel unsubscribe email at most
 * once per transition into `CANCELLED_PENDING`. Skip (HTTP 200) vs retry
 * (HTTP 500) is encoded in the result status. Never throws.
 */
export async function maybeSendSubscriptionCancellationEmail(
  input: MaybeSendSubscriptionCancellationEmailInput,
): Promise<CancellationEmailResult> {
  if (input.event.type !== "customer.subscription.updated") {
    return skipped("not_subscription_updated");
  }

  const sub = input.event.data.object as Stripe.Subscription;
  if (!sub.cancel_at_period_end) {
    return skipped("not_scheduled_cancel");
  }

  const stripeSubscriptionId = sub.id;
  if (!stripeSubscriptionId) {
    logSkip("missing_subscription_id", { eventId: input.event.id });
    return skipped("missing_subscription_id");
  }

  if (input.previousStatus === "CANCELLED_PENDING") {
    logSkip("already_pending", { eventId: input.event.id });
    return skipped("already_pending");
  }

  if (input.previousStatus === "UNPAID") {
    logSkip("admin_frozen", { eventId: input.event.id });
    return skipped("admin_frozen");
  }

  if (!input.apiKey || !input.from) {
    logSkip("resend_env_unset", { eventId: input.event.id });
    return skipped("resend_env_unset");
  }

  let member: CancellationEmailMember | null = null;
  try {
    member = await input.lookupMemberByStripeSubscriptionId(stripeSubscriptionId);
  } catch (error) {
    if (!customerEmailFromSubscription(sub)) {
      logRetry("member_lookup_failed", { eventId: input.event.id });
      console.error("subscription cancellation member lookup failed", error);
      return retry("member_lookup_failed");
    }
    console.warn("subscription cancellation member lookup failed; using Stripe email", {
      eventId: input.event.id,
      error,
    });
  }

  const toEmail = (member?.email?.trim() || customerEmailFromSubscription(sub)) ?? "";
  if (!toEmail) {
    logSkip("missing_recipient", { eventId: input.event.id });
    return skipped("missing_recipient");
  }

  const subscriptionLocale =
    typeof sub.metadata?.locale === "string" && sub.metadata.locale.length > 0
      ? sub.metadata.locale
      : undefined;
  const locale: InvoiceEmailLocale = resolveInvoiceEmailLocale({
    subscriptionLocale,
    profileLanguage: member?.profileLanguage,
  });

  const endDate = endDateFromSubscription(sub) ?? member?.periodEnd ?? null;
  if (!endDate) {
    logSkip("missing_end_date", { eventId: input.event.id });
    return skipped("missing_end_date");
  }

  const sendCancellation = input.sendCancellation ?? sendSubscriptionCancellation;
  try {
    const sendResult = await sendCancellation({
      apiKey: input.apiKey,
      from: input.from,
      toEmail,
      locale,
      siteUrl: input.siteUrl,
      endDate,
      resubscribeUrl: `${input.siteUrl}/${locale}/membership`,
      idempotencyKey: input.event.id,
      fetchImpl: input.fetchImpl,
    });
    if (!sendResult.ok) {
      logRetry("send_failed", { eventId: input.event.id, status: sendResult.status });
      return retry("send_failed");
    }
  } catch (error) {
    logRetry("send_threw", { eventId: input.event.id });
    console.error("subscription cancellation email threw", error);
    return retry("send_threw");
  }

  return { status: "sent" };
}
