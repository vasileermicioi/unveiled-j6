import {
  type BuildBookingConfirmationInput,
  buildBookingConfirmationContent,
} from "./booking-confirmation";
import { buildEventIcs } from "./ics";
import {
  type SendResendEmailInput,
  type SendResendEmailResult,
  sendResendEmail,
} from "./resend-client";

export type SendBookingConfirmationInput = BuildBookingConfirmationInput & {
  apiKey: string;
  from: string;
  fetchImpl?: SendResendEmailInput["fetchImpl"];
};

/**
 * Build confirmation content + ICS and send via Resend.
 * Failures are returned to the caller — never throw for HTTP errors; callers log and continue.
 */
export async function sendBookingConfirmation(
  input: SendBookingConfirmationInput,
): Promise<SendResendEmailResult> {
  const content = buildBookingConfirmationContent(input);
  const ics = buildEventIcs({
    event: input.event,
    bookingId: input.booking.id,
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
        filename: "event.ics",
        content: utf8ToBase64(ics),
        contentType: "text/calendar; charset=utf-8",
      },
    ],
    fetchImpl: input.fetchImpl,
  });
}

function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
