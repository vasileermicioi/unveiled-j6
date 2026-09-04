import {
  type SendResendEmailInput,
  type SendResendEmailResult,
  sendResendEmail,
} from "./resend-client";
import {
  type BuildSubscriptionCancellationInput,
  buildSubscriptionCancellationContent,
} from "./subscription-cancellation";

export type SendSubscriptionCancellationInput = BuildSubscriptionCancellationInput & {
  apiKey: string;
  from: string;
  toEmail: string;
  idempotencyKey?: string;
  fetchImpl?: SendResendEmailInput["fetchImpl"];
};

/**
 * Build scheduled-cancel unsubscribe content and send via Resend.
 * Failures are returned to the caller — never throw for HTTP errors.
 */
export async function sendSubscriptionCancellation(
  input: SendSubscriptionCancellationInput,
): Promise<SendResendEmailResult> {
  const content = buildSubscriptionCancellationContent({
    locale: input.locale,
    siteUrl: input.siteUrl,
    endDate: input.endDate,
    resubscribeUrl: input.resubscribeUrl,
  });

  return sendResendEmail({
    apiKey: input.apiKey,
    from: input.from,
    to: input.toEmail,
    subject: content.subject,
    html: content.html,
    text: content.text,
    idempotencyKey: input.idempotencyKey,
    fetchImpl: input.fetchImpl,
  });
}
