import {
  type SendResendEmailInput,
  type SendResendEmailResult,
  sendResendEmail,
} from "./resend-client";
import {
  type BuildSubscriptionInvoiceInput,
  buildSubscriptionInvoiceContent,
} from "./subscription-invoice";

export type SendSubscriptionInvoiceInput = BuildSubscriptionInvoiceInput & {
  apiKey: string;
  from: string;
  toEmail: string;
  pdfBase64: string;
  pdfFilename: string;
  idempotencyKey?: string;
  fetchImpl?: SendResendEmailInput["fetchImpl"];
};

/**
 * Build membership-invoice content and send via Resend with a caller-supplied PDF.
 * Failures are returned to the caller — never throw for HTTP errors.
 */
export async function sendSubscriptionInvoice(
  input: SendSubscriptionInvoiceInput,
): Promise<SendResendEmailResult> {
  const content = buildSubscriptionInvoiceContent({
    locale: input.locale,
    siteUrl: input.siteUrl,
  });

  return sendResendEmail({
    apiKey: input.apiKey,
    from: input.from,
    to: input.toEmail,
    subject: content.subject,
    html: content.html,
    text: content.text,
    attachments: [
      {
        filename: input.pdfFilename,
        content: input.pdfBase64,
        contentType: "application/pdf",
      },
    ],
    idempotencyKey: input.idempotencyKey,
    fetchImpl: input.fetchImpl,
  });
}
