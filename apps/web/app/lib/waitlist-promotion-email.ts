import type { BookEventResult } from "@unveiled/db";
import { sendWaitlistPromotion } from "@unveiled/email";

import type { Locale } from "./locale";

export type WaitlistPromotionEmailContext = {
  apiKey: string | undefined;
  from: string | undefined;
  locale: Locale;
  event: {
    id: string;
    title: string;
    address: string;
    dateTime: Date;
    partnerName: string;
  };
  /**
   * Resolve recipient email for a promoted user id.
   * Prefer public.users.email; fall back to empty to skip.
   */
  resolveToEmail: (userId: string) => Promise<string | undefined>;
};

/**
 * Post-commit waitlist promotion emails.
 * Log failures / missing env; never throw into the mutation success path.
 * Phase 8 admin booking-cancel MUST also call processWaitlistForEvent then this helper.
 */
export async function sendWaitlistPromotionEmailsSafe(
  promotions: BookEventResult[],
  options: WaitlistPromotionEmailContext,
): Promise<void> {
  for (const { booking } of promotions) {
    const toEmail = await options.resolveToEmail(booking.userId);
    if (!toEmail) {
      console.warn("waitlist promotion email skipped (no recipient email)", {
        bookingId: booking.id,
        userId: booking.userId,
      });
      continue;
    }

    if (!options.apiKey || !options.from) {
      console.warn("waitlist promotion email skipped (RESEND env unset)", {
        bookingId: booking.id,
        userId: booking.userId,
      });
      continue;
    }

    try {
      const result = await sendWaitlistPromotion({
        apiKey: options.apiKey,
        from: options.from,
        locale: options.locale,
        toEmail,
        event: options.event,
        booking: {
          id: booking.id,
          ticketsCount: booking.ticketsCount,
          redemptionInfo: booking.redemptionInfo,
          redemptionUrl: booking.redemptionUrl,
          redemptionType: booking.redemptionType,
        },
      });
      if (!result.ok) {
        console.error("waitlist promotion email failed", {
          bookingId: booking.id,
          userId: booking.userId,
          error: result.error,
          status: result.status,
        });
      }
    } catch (error) {
      console.error("waitlist promotion email threw", {
        bookingId: booking.id,
        userId: booking.userId,
        error,
      });
    }
  }
}
