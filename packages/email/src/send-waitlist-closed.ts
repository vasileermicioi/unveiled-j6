import {
  type SendResendEmailInput,
  type SendResendEmailResult,
  sendResendEmail,
} from "./resend-client";
import { type BuildWaitlistClosedInput, buildWaitlistClosedContent } from "./waitlist-closed";

export type SendWaitlistClosedInput = BuildWaitlistClosedInput & {
  apiKey: string;
  from: string;
  fetchImpl?: SendResendEmailInput["fetchImpl"];
};

/**
 * Build waitlist-closed content and send via Resend (no ICS, no credit language).
 * Failures are returned to the caller — never throw for HTTP errors; callers log and continue.
 */
export async function sendWaitlistClosed(
  input: SendWaitlistClosedInput,
): Promise<SendResendEmailResult> {
  const content = buildWaitlistClosedContent(input);

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
