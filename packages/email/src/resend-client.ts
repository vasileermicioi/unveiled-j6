/**
 * Resend HTTP client (raw fetch — same approach as the old daily codes path).
 *
 * Env (document in apps/web/DEPLOYMENT.md in payments-booking-05):
 * - RESEND_API_KEY
 * - DAILY_CODES_FROM_EMAIL (from-address for booking confirmations in Phase 6)
 *
 * Send policy: call only after a successful booking commit. On failure, log and
 * do not roll back the booking — the confirm page remains the source of truth.
 */

export type ResendAttachment = {
  filename: string;
  content: string; // base64
  contentType?: string;
};

export type SendResendEmailInput = {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: ResendAttachment[];
  fetchImpl?: (
    input: string,
    init?: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    },
  ) => Promise<{
    ok: boolean;
    status: number;
    json: () => Promise<unknown>;
  }>;
};

export type SendResendEmailResult = {
  ok: boolean;
  id?: string;
  error?: string;
  status: number;
};

export async function sendResendEmail(input: SendResendEmailInput): Promise<SendResendEmailResult> {
  const fetchImpl = input.fetchImpl ?? globalThis.fetch;
  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments: input.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        content_type: attachment.contentType,
      })),
    }),
  });

  const body = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
    name?: string;
  };

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: body.message ?? body.name ?? `Resend HTTP ${response.status}`,
    };
  }

  return { ok: true, status: response.status, id: body.id };
}
