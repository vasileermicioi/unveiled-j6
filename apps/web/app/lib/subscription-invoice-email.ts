import {
  type DownloadStripeInvoicePdfResult,
  downloadStripeInvoicePdf,
  subscriptionIdFromInvoice,
} from "@unveiled/billing";
import type { ProfileLanguage, TxDb } from "@unveiled/db";
import { type SendSubscriptionInvoiceInput, sendSubscriptionInvoice } from "@unveiled/email";
import type Stripe from "stripe";

export const UNVEILED_INVOICE_EMAIL_METADATA_KEY = "unveiled_invoice_email";
export const UNVEILED_INVOICE_EMAIL_SENT_VALUE = "sent";

export type InvoiceEmailLocale = "de" | "en";

export type InvoiceEmailMember = {
  email: string | null;
  profileLanguage: ProfileLanguage | null;
};

export type InvoiceEmailResult =
  | { status: "skipped"; reason: string }
  | { status: "sent" }
  | { status: "retry"; reason: string };

export type InvoiceEmailSendFn = typeof sendSubscriptionInvoice;
export type InvoiceEmailDownloadFn = typeof downloadStripeInvoicePdf;

export type MaybeSendSubscriptionInvoiceEmailInput = {
  event: Stripe.Event;
  stripe: Stripe;
  apiKey: string | undefined;
  from: string | undefined;
  siteUrl: string;
  lookupMemberByStripeSubscriptionId: (
    stripeSubscriptionId: string,
  ) => Promise<InvoiceEmailMember | null>;
  downloadPdf?: InvoiceEmailDownloadFn;
  sendInvoice?: InvoiceEmailSendFn;
  fetchImpl?: SendSubscriptionInvoiceInput["fetchImpl"];
};

export function resolveInvoiceEmailLocale(input: {
  subscriptionLocale?: string | null;
  profileLanguage?: ProfileLanguage | null;
}): InvoiceEmailLocale {
  const stamped = input.subscriptionLocale?.trim().toLowerCase();
  if (stamped === "en" || stamped === "de") {
    return stamped;
  }
  if (input.profileLanguage === "EN") {
    return "en";
  }
  return "de";
}

export async function lookupMemberByStripeSubscriptionId(
  db: TxDb,
  stripeSubscriptionId: string,
): Promise<InvoiceEmailMember | null> {
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
  };
}

function skipped(reason: string): InvoiceEmailResult {
  return { status: "skipped", reason };
}

function retry(reason: string): InvoiceEmailResult {
  return { status: "retry", reason };
}

function logSkip(reason: string, details: Record<string, string | undefined>): void {
  console.warn("subscription invoice email skipped", { reason, ...details });
}

function logRetry(reason: string, details: Record<string, string | number | undefined>): void {
  console.error("subscription invoice email retry", { reason, ...details });
}

function subscriptionLocaleFromInvoice(invoice: Stripe.Invoice): string | undefined {
  const fromParent = invoice.parent?.subscription_details?.metadata?.locale;
  return typeof fromParent === "string" && fromParent.length > 0 ? fromParent : undefined;
}

/**
 * After `applyStripeEvent`, send the first-subscription invoice email at most once.
 * Skip (HTTP 200) vs retry (HTTP 500) is encoded in the result status.
 */
export async function maybeSendSubscriptionInvoiceEmail(
  input: MaybeSendSubscriptionInvoiceEmailInput,
): Promise<InvoiceEmailResult> {
  if (input.event.type !== "invoice.paid") {
    return skipped("not_invoice_paid");
  }

  const eventInvoice = input.event.data.object as Stripe.Invoice;
  if (eventInvoice.billing_reason !== "subscription_create") {
    return skipped("not_subscription_create");
  }

  const invoiceId = eventInvoice.id;
  if (!invoiceId) {
    logSkip("missing_invoice_id", { billingReason: eventInvoice.billing_reason ?? undefined });
    return skipped("missing_invoice_id");
  }

  if (!input.apiKey || !input.from) {
    logSkip("resend_env_unset", { invoiceId });
    return skipped("resend_env_unset");
  }

  let invoice: Stripe.Invoice;
  try {
    invoice = await input.stripe.invoices.retrieve(invoiceId);
  } catch (error) {
    logRetry("retrieve_failed", { invoiceId });
    console.error("subscription invoice retrieve failed", error);
    return retry("retrieve_failed");
  }

  if (
    invoice.metadata?.[UNVEILED_INVOICE_EMAIL_METADATA_KEY] === UNVEILED_INVOICE_EMAIL_SENT_VALUE
  ) {
    logSkip("already_sent", { invoiceId });
    return skipped("already_sent");
  }

  if (!invoice.invoice_pdf) {
    logSkip("missing_pdf_url", { invoiceId });
    return skipped("missing_pdf_url");
  }

  const stripeSubscriptionId = subscriptionIdFromInvoice(invoice);
  let member: InvoiceEmailMember | null = null;
  if (stripeSubscriptionId) {
    try {
      member = await input.lookupMemberByStripeSubscriptionId(stripeSubscriptionId);
    } catch (error) {
      if (!invoice.customer_email?.trim()) {
        logRetry("member_lookup_failed", { invoiceId });
        console.error("subscription invoice member lookup failed", error);
        return retry("member_lookup_failed");
      }
      console.warn("subscription invoice member lookup failed; using invoice email", {
        invoiceId,
        error,
      });
    }
  }

  const toEmail = (invoice.customer_email?.trim() || member?.email?.trim()) ?? "";
  if (!toEmail) {
    logSkip("missing_recipient", { invoiceId });
    return skipped("missing_recipient");
  }

  let subscriptionLocale = subscriptionLocaleFromInvoice(invoice);
  if (!subscriptionLocale && stripeSubscriptionId) {
    try {
      const subscription = await input.stripe.subscriptions.retrieve(stripeSubscriptionId);
      const fromSub = subscription.metadata?.locale;
      if (typeof fromSub === "string" && fromSub.length > 0) {
        subscriptionLocale = fromSub;
      }
    } catch (error) {
      console.warn("subscription locale retrieve failed; falling back", { invoiceId, error });
    }
  }

  const locale = resolveInvoiceEmailLocale({
    subscriptionLocale,
    profileLanguage: member?.profileLanguage,
  });

  const downloadPdf = input.downloadPdf ?? downloadStripeInvoicePdf;
  let download: DownloadStripeInvoicePdfResult;
  try {
    download = await downloadPdf({
      stripe: input.stripe,
      invoiceId,
    });
  } catch (error) {
    logRetry("download_threw", { invoiceId });
    console.error("subscription invoice pdf download threw", error);
    return retry("download_threw");
  }

  if (!download.ok) {
    if (download.reason === "missing_pdf_url") {
      logSkip("missing_pdf_url", { invoiceId });
      return skipped("missing_pdf_url");
    }
    logRetry(download.reason, { invoiceId, status: download.status });
    return retry(download.reason);
  }

  const sendInvoice = input.sendInvoice ?? sendSubscriptionInvoice;
  let sendResult: Awaited<ReturnType<InvoiceEmailSendFn>>;
  try {
    sendResult = await sendInvoice({
      apiKey: input.apiKey,
      from: input.from,
      toEmail,
      locale,
      siteUrl: input.siteUrl,
      pdfBase64: download.pdfBase64,
      pdfFilename: download.filename,
      idempotencyKey: invoiceId,
      fetchImpl: input.fetchImpl,
    });
  } catch (error) {
    logRetry("send_threw", { invoiceId });
    console.error("subscription invoice email threw", error);
    return retry("send_threw");
  }

  if (!sendResult.ok) {
    logRetry("send_failed", { invoiceId, status: sendResult.status });
    return retry("send_failed");
  }

  try {
    await input.stripe.invoices.update(invoiceId, {
      metadata: {
        ...(invoice.metadata ?? {}),
        [UNVEILED_INVOICE_EMAIL_METADATA_KEY]: UNVEILED_INVOICE_EMAIL_SENT_VALUE,
      },
    });
  } catch (error) {
    logRetry("metadata_update_failed", { invoiceId });
    console.error("subscription invoice metadata update failed", error);
    return retry("metadata_update_failed");
  }

  return { status: "sent" };
}
