import {
  type BuildBookingCancellationInput,
  buildBookingCancellationContent,
} from "./booking-cancellation";
import {
  type SendResendEmailInput,
  type SendResendEmailResult,
  sendResendEmail,
} from "./resend-client";

export type SendBookingCancellationInput = BuildBookingCancellationInput & {
  apiKey: string;
  from: string;
  fetchImpl?: SendResendEmailInput["fetchImpl"];
};

/**
 * Build cancellation content and send via Resend (no ICS).
 * Failures are returned to the caller — never throw for HTTP errors; callers log and continue.
 */
export async function sendBookingCancellation(
  input: SendBookingCancellationInput,
): Promise<SendResendEmailResult> {
  const content = buildBookingCancellationContent(input);

  return sendResendEmail({
    apiKey: input.apiKey,
    from: input.from,
    to: input.toEmail,
    subject: content.subject,
    html: content.html,
    text: content.text,
    fetchImpl: input.fetchImpl,
  });
}
