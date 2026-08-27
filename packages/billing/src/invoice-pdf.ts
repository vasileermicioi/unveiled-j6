import type Stripe from "stripe";

export type InvoicePdfFetchImpl = (
  input: string,
  init?: { method?: string },
) => Promise<{
  ok: boolean;
  status: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
}>;

export type DownloadStripeInvoicePdfInput = {
  stripe: Stripe;
  invoiceId: string;
  fetchImpl?: InvoicePdfFetchImpl;
};

export type DownloadStripeInvoicePdfReason = "missing_pdf_url" | "retrieve_failed" | "fetch_failed";

export type DownloadStripeInvoicePdfResult =
  | { ok: true; pdfBase64: string; filename: string; invoice: Stripe.Invoice }
  | { ok: false; reason: DownloadStripeInvoicePdfReason; status?: number };

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function invoicePdfFilename(invoice: Stripe.Invoice): string {
  const stem = invoice.number ?? invoice.id;
  return `invoice-${stem}.pdf`;
}

/**
 * Retrieve a finalized Stripe invoice and download PDF bytes from a fresh `invoice_pdf` URL.
 * Never uses a caller-supplied or webhook-payload URL.
 */
export async function downloadStripeInvoicePdf(
  input: DownloadStripeInvoicePdfInput,
): Promise<DownloadStripeInvoicePdfResult> {
  let invoice: Stripe.Invoice;
  try {
    invoice = await input.stripe.invoices.retrieve(input.invoiceId);
  } catch {
    return { ok: false, reason: "retrieve_failed" };
  }

  const pdfUrl = invoice.invoice_pdf;
  if (!pdfUrl) {
    return { ok: false, reason: "missing_pdf_url" };
  }

  const fetchImpl = input.fetchImpl ?? globalThis.fetch;
  let response: Awaited<ReturnType<InvoicePdfFetchImpl>>;
  try {
    response = await fetchImpl(pdfUrl, { method: "GET" });
  } catch {
    return { ok: false, reason: "fetch_failed" };
  }

  if (!response.ok) {
    return { ok: false, reason: "fetch_failed", status: response.status };
  }

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await response.arrayBuffer());
  } catch {
    return { ok: false, reason: "fetch_failed", status: response.status };
  }

  if (bytes.byteLength === 0) {
    return { ok: false, reason: "fetch_failed", status: response.status };
  }

  return {
    ok: true,
    pdfBase64: bytesToBase64(bytes),
    filename: invoicePdfFilename(invoice),
    invoice,
  };
}
