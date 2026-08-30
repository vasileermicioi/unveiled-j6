import { describe, expect, test } from "bun:test";
import type Stripe from "stripe";

import { createCheckoutSession, downloadStripeInvoicePdf } from "./index";

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
const PDF_BASE64 = btoa(String.fromCharCode(0x25, 0x50, 0x44, 0x46));

function invoiceFixture(overrides: Partial<Stripe.Invoice> & { id?: string } = {}): Stripe.Invoice {
  return {
    id: "in_fresh",
    object: "invoice",
    number: "INV-1001",
    invoice_pdf: "https://files.stripe.com/fresh.pdf",
    metadata: {},
    ...overrides,
  } as Stripe.Invoice;
}

function stripeWithRetrieve(invoice: Stripe.Invoice | Error): Stripe {
  return {
    invoices: {
      retrieve: async () => {
        if (invoice instanceof Error) {
          throw invoice;
        }
        return invoice;
      },
    },
  } as unknown as Stripe;
}

describe("downloadStripeInvoicePdf", () => {
  test("retrieves a fresh URL, fetches it, and returns base64 plus filename", async () => {
    const fetchedUrls: string[] = [];
    const result = await downloadStripeInvoicePdf({
      stripe: stripeWithRetrieve(invoiceFixture()),
      invoiceId: "in_fresh",
      fetchImpl: async (url) => {
        fetchedUrls.push(url);
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => PDF_BYTES.buffer,
        };
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.pdfBase64).toBe(PDF_BASE64);
    expect(result.filename).toBe("invoice-INV-1001.pdf");
    expect(fetchedUrls).toEqual(["https://files.stripe.com/fresh.pdf"]);
  });

  test("uses invoice id in the filename when number is null", async () => {
    const result = await downloadStripeInvoicePdf({
      stripe: stripeWithRetrieve(invoiceFixture({ number: null })),
      invoiceId: "in_fresh",
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        arrayBuffer: async () => PDF_BYTES.buffer,
      }),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.filename).toBe("invoice-in_fresh.pdf");
    }
  });

  test("returns missing_pdf_url without fetching", async () => {
    const fetchedUrls: string[] = [];
    const result = await downloadStripeInvoicePdf({
      stripe: stripeWithRetrieve(invoiceFixture({ invoice_pdf: null })),
      invoiceId: "in_fresh",
      fetchImpl: async (url) => {
        fetchedUrls.push(url);
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => PDF_BYTES.buffer,
        };
      },
    });

    expect(result).toEqual({ ok: false, reason: "missing_pdf_url" });
    expect(fetchedUrls).toEqual([]);
  });

  test("returns retrieve_failed when Stripe retrieve throws", async () => {
    const result = await downloadStripeInvoicePdf({
      stripe: stripeWithRetrieve(new Error("stripe down")),
      invoiceId: "in_fresh",
      fetchImpl: async () => {
        throw new Error("should not fetch");
      },
    });

    expect(result).toEqual({ ok: false, reason: "retrieve_failed" });
  });

  test("returns fetch_failed with status on HTTP error", async () => {
    const result = await downloadStripeInvoicePdf({
      stripe: stripeWithRetrieve(invoiceFixture()),
      invoiceId: "in_fresh",
      fetchImpl: async () => ({
        ok: false,
        status: 503,
        arrayBuffer: async () => new ArrayBuffer(0),
      }),
    });

    expect(result).toEqual({ ok: false, reason: "fetch_failed", status: 503 });
  });
});

describe("createCheckoutSession", () => {
  test("stamps locale on subscription_data.metadata alongside userId", async () => {
    const created: Stripe.Checkout.SessionCreateParams[] = [];
    const stripe = {
      checkout: {
        sessions: {
          create: async (params: Stripe.Checkout.SessionCreateParams) => {
            created.push(params);
            return { id: "cs_test", url: "https://checkout.stripe.com/c/pay/cs_test" };
          },
        },
      },
    } as unknown as Stripe;

    await createCheckoutSession({
      stripe,
      priceId: "price_basic",
      userId: "user_1",
      customerEmail: "member@example.com",
      locale: "en",
      successUrl: "https://example.test/en/events?checkout=success",
      cancelUrl: "https://example.test/en/membership?checkout=cancelled",
    });

    expect(created).toHaveLength(1);
    expect(created[0]?.metadata).toEqual({ userId: "user_1" });
    expect(created[0]?.allow_promotion_codes).toBe(true);
    expect(created[0]?.discounts).toBeUndefined();
    expect(created[0]?.subscription_data?.metadata).toEqual({
      userId: "user_1",
      locale: "en",
    });
    expect(created[0]?.payment_method_types).toBeUndefined();
  });
});
