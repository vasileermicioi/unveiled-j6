import { describe, expect, test } from "bun:test";
import type Stripe from "stripe";

import {
  maybeSendSubscriptionInvoiceEmail,
  resolveInvoiceEmailLocale,
  UNVEILED_INVOICE_EMAIL_METADATA_KEY,
  UNVEILED_INVOICE_EMAIL_SENT_VALUE,
} from "./subscription-invoice-email";

const PDF_BASE64 = "JVBERg==";

function invoiceFixture(overrides: Record<string, unknown> = {}): Stripe.Invoice {
  return {
    id: "in_test",
    object: "invoice",
    billing_reason: "subscription_create",
    customer_email: "member@example.com",
    invoice_pdf: "https://files.stripe.com/in_test.pdf",
    metadata: {},
    parent: {
      type: "subscription_details",
      subscription_details: {
        subscription: "sub_test",
        metadata: { locale: "en", userId: "user_1" },
      },
      quote_details: null,
    },
    ...overrides,
  } as unknown as Stripe.Invoice;
}

function invoicePaidEvent(
  billingReason: string,
  invoiceOverrides: Record<string, unknown> = {},
): Stripe.Event {
  return {
    id: "evt_test",
    object: "event",
    type: "invoice.paid",
    data: { object: invoiceFixture({ billing_reason: billingReason, ...invoiceOverrides }) },
  } as unknown as Stripe.Event;
}

function mockStripe(invoice: Stripe.Invoice, subscriptionMetadata: Record<string, string> = {}) {
  const retrieveIds: string[] = [];
  const updateCalls: Array<{ id: string; params: Stripe.InvoiceUpdateParams }> = [];
  const stripe = {
    invoices: {
      retrieve: async (id: string) => {
        retrieveIds.push(id);
        return invoice;
      },
      update: async (id: string, params: Stripe.InvoiceUpdateParams) => {
        updateCalls.push({ id, params });
        return invoice;
      },
    },
    subscriptions: {
      retrieve: async () => ({ id: "sub_test", metadata: subscriptionMetadata }),
    },
  } as unknown as Stripe;
  return { stripe, retrieveIds, updateCalls };
}

describe("resolveInvoiceEmailLocale", () => {
  test("prefers stamped subscription locale, then EN profile, else de", () => {
    expect(resolveInvoiceEmailLocale({ subscriptionLocale: "en" })).toBe("en");
    expect(resolveInvoiceEmailLocale({ subscriptionLocale: "DE" })).toBe("de");
    expect(resolveInvoiceEmailLocale({ profileLanguage: "EN" })).toBe("en");
    expect(resolveInvoiceEmailLocale({ profileLanguage: "DE" })).toBe("de");
    expect(resolveInvoiceEmailLocale({})).toBe("de");
  });
});

describe("maybeSendSubscriptionInvoiceEmail", () => {
  test("subscription_create downloads and sends once, then stamps metadata", async () => {
    const invoice = invoiceFixture();
    const { stripe, updateCalls } = mockStripe(invoice);
    const downloadCalls: string[] = [];
    const sendCalls: Array<{ toEmail: string; locale: string; pdfFilename: string; key?: string }> =
      [];

    const result = await maybeSendSubscriptionInvoiceEmail({
      event: invoicePaidEvent("subscription_create"),
      stripe,
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      siteUrl: "https://example.test",
      lookupMemberByStripeSubscriptionId: async () => ({
        email: "fallback@example.com",
        profileLanguage: "DE",
      }),
      downloadPdf: async ({ invoiceId }) => {
        downloadCalls.push(invoiceId);
        return { ok: true, pdfBase64: PDF_BASE64, filename: "invoice-INV-1.pdf", invoice };
      },
      sendInvoice: async (input) => {
        sendCalls.push({
          toEmail: input.toEmail,
          locale: input.locale,
          pdfFilename: input.pdfFilename,
          key: input.idempotencyKey,
        });
        return { ok: true, status: 200, id: "email_1" };
      },
    });

    expect(result).toEqual({ status: "sent" });
    expect(downloadCalls).toEqual(["in_test"]);
    expect(sendCalls).toEqual([
      {
        toEmail: "member@example.com",
        locale: "en",
        pdfFilename: "invoice-INV-1.pdf",
        key: "in_test",
      },
    ]);
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]?.params.metadata).toEqual({
      [UNVEILED_INVOICE_EMAIL_METADATA_KEY]: UNVEILED_INVOICE_EMAIL_SENT_VALUE,
    });
  });

  test("subscription_cycle does not send", async () => {
    const invoice = invoiceFixture({ billing_reason: "subscription_cycle" });
    const { stripe, retrieveIds } = mockStripe(invoice);
    let sent = 0;

    const result = await maybeSendSubscriptionInvoiceEmail({
      event: invoicePaidEvent("subscription_cycle"),
      stripe,
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      siteUrl: "https://example.test",
      lookupMemberByStripeSubscriptionId: async () => {
        throw new Error("should not lookup");
      },
      downloadPdf: async () => {
        throw new Error("should not download");
      },
      sendInvoice: async () => {
        sent += 1;
        return { ok: true, status: 200 };
      },
    });

    expect(result).toEqual({ status: "skipped", reason: "not_subscription_create" });
    expect(retrieveIds).toEqual([]);
    expect(sent).toBe(0);
  });

  test("checkout.session.completed does not send", async () => {
    const { stripe } = mockStripe(invoiceFixture());
    const result = await maybeSendSubscriptionInvoiceEmail({
      event: { type: "checkout.session.completed", data: { object: {} } } as Stripe.Event,
      stripe,
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      siteUrl: "https://example.test",
      lookupMemberByStripeSubscriptionId: async () => null,
      sendInvoice: async () => {
        throw new Error("should not send");
      },
    });

    expect(result).toEqual({ status: "skipped", reason: "not_invoice_paid" });
  });

  test("already-sent metadata skips a second send", async () => {
    const invoice = invoiceFixture({
      metadata: { [UNVEILED_INVOICE_EMAIL_METADATA_KEY]: UNVEILED_INVOICE_EMAIL_SENT_VALUE },
    });
    const { stripe } = mockStripe(invoice);
    let sent = 0;

    const result = await maybeSendSubscriptionInvoiceEmail({
      event: invoicePaidEvent("subscription_create"),
      stripe,
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      siteUrl: "https://example.test",
      lookupMemberByStripeSubscriptionId: async () => null,
      downloadPdf: async () => {
        throw new Error("should not download");
      },
      sendInvoice: async () => {
        sent += 1;
        return { ok: true, status: 200 };
      },
    });

    expect(result).toEqual({ status: "skipped", reason: "already_sent" });
    expect(sent).toBe(0);
  });

  test("missing Resend env skips without retry", async () => {
    const { stripe, retrieveIds } = mockStripe(invoiceFixture());
    const result = await maybeSendSubscriptionInvoiceEmail({
      event: invoicePaidEvent("subscription_create"),
      stripe,
      apiKey: undefined,
      from: undefined,
      siteUrl: "https://example.test",
      lookupMemberByStripeSubscriptionId: async () => null,
      sendInvoice: async () => {
        throw new Error("should not send");
      },
    });

    expect(result).toEqual({ status: "skipped", reason: "resend_env_unset" });
    expect(retrieveIds).toEqual([]);
  });

  test("missing invoice_pdf skips without retry", async () => {
    const invoice = invoiceFixture({ invoice_pdf: null });
    const { stripe } = mockStripe(invoice);
    const result = await maybeSendSubscriptionInvoiceEmail({
      event: invoicePaidEvent("subscription_create"),
      stripe,
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      siteUrl: "https://example.test",
      lookupMemberByStripeSubscriptionId: async () => null,
      sendInvoice: async () => {
        throw new Error("should not send");
      },
    });

    expect(result).toEqual({ status: "skipped", reason: "missing_pdf_url" });
  });

  test("missing recipient skips without retry", async () => {
    const invoice = invoiceFixture({ customer_email: null });
    const { stripe, updateCalls } = mockStripe(invoice);
    let sent = 0;

    const result = await maybeSendSubscriptionInvoiceEmail({
      event: invoicePaidEvent("subscription_create", { customer_email: null }),
      stripe,
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      siteUrl: "https://example.test",
      lookupMemberByStripeSubscriptionId: async () => null,
      downloadPdf: async () => {
        throw new Error("should not download");
      },
      sendInvoice: async () => {
        sent += 1;
        return { ok: true, status: 200 };
      },
    });

    expect(result).toEqual({ status: "skipped", reason: "missing_recipient" });
    expect(sent).toBe(0);
    expect(updateCalls).toEqual([]);
  });

  test("download failure returns retry", async () => {
    const invoice = invoiceFixture();
    const { stripe, updateCalls } = mockStripe(invoice);
    const result = await maybeSendSubscriptionInvoiceEmail({
      event: invoicePaidEvent("subscription_create"),
      stripe,
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      siteUrl: "https://example.test",
      lookupMemberByStripeSubscriptionId: async () => null,
      downloadPdf: async () => ({ ok: false, reason: "fetch_failed", status: 503 }),
      sendInvoice: async () => {
        throw new Error("should not send");
      },
    });

    expect(result).toEqual({ status: "retry", reason: "fetch_failed" });
    expect(updateCalls).toEqual([]);
  });

  test("send failure returns retry", async () => {
    const invoice = invoiceFixture();
    const { stripe, updateCalls } = mockStripe(invoice);
    const result = await maybeSendSubscriptionInvoiceEmail({
      event: invoicePaidEvent("subscription_create"),
      stripe,
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      siteUrl: "https://example.test",
      lookupMemberByStripeSubscriptionId: async () => null,
      downloadPdf: async () => ({
        ok: true,
        pdfBase64: PDF_BASE64,
        filename: "invoice-in_test.pdf",
        invoice,
      }),
      sendInvoice: async () => ({ ok: false, status: 500, error: "Resend down" }),
    });

    expect(result).toEqual({ status: "retry", reason: "send_failed" });
    expect(updateCalls).toEqual([]);
  });

  test("falls back to users.email and profile language when invoice has no customer_email", async () => {
    const invoice = invoiceFixture({ customer_email: null, parent: undefined });
    const { stripe } = mockStripe({
      ...invoice,
      parent: {
        type: "subscription_details",
        subscription_details: { subscription: "sub_test", metadata: {} },
        quote_details: null,
      },
    } as Stripe.Invoice);

    const result = await maybeSendSubscriptionInvoiceEmail({
      event: invoicePaidEvent("subscription_create", {
        customer_email: null,
        parent: {
          type: "subscription_details",
          subscription_details: { subscription: "sub_test", metadata: {} },
          quote_details: null,
        },
      }),
      stripe,
      apiKey: "re_test",
      from: "codes@unveiled.berlin",
      siteUrl: "https://example.test",
      lookupMemberByStripeSubscriptionId: async (id) => {
        expect(id).toBe("sub_test");
        return { email: "from-db@example.com", profileLanguage: "EN" };
      },
      downloadPdf: async () => ({
        ok: true,
        pdfBase64: PDF_BASE64,
        filename: "invoice-in_test.pdf",
        invoice,
      }),
      sendInvoice: async (input) => {
        expect(input.toEmail).toBe("from-db@example.com");
        expect(input.locale).toBe("en");
        return { ok: true, status: 200 };
      },
    });

    expect(result).toEqual({ status: "sent" });
  });
});
