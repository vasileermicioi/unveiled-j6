import type { CancelledMemberNotification, ClosedWaitlistNotification } from "@unveiled/db";
import { sendBookingCancellation, sendWaitlistClosed } from "@unveiled/email";

import type { Locale } from "./locale";

export type CancelAllEmailEvent = {
  id: string;
  title: string;
  address: string;
  dateTime: Date;
  partnerName: string;
};

export type SendCancelAllEmailsSafeInput = {
  apiKey: string | undefined;
  from: string | undefined;
  event: CancelAllEmailEvent;
  cancelledMembers: CancelledMemberNotification[];
  closedWaitlistMembers: ClosedWaitlistNotification[];
  eventTitleForLocale: (locale: Locale) => string;
};

/**
 * Post-commit cancel-all emails. Log failures / missing env; never throw into the mutation success path.
 */
export async function sendCancelAllEmailsSafe(input: SendCancelAllEmailsSafeInput): Promise<void> {
  for (const member of input.cancelledMembers) {
    await sendOneCancellation(input, member);
  }
  for (const member of input.closedWaitlistMembers) {
    await sendOneWaitlistClosed(input, member);
  }
}

async function sendOneCancellation(
  input: SendCancelAllEmailsSafeInput,
  member: CancelledMemberNotification,
): Promise<void> {
  if (!member.email) {
    console.warn("cancel-all cancellation email skipped (no recipient email)", {
      bookingId: member.bookingId,
      userId: member.userId,
    });
    return;
  }

  if (!input.apiKey || !input.from) {
    console.warn("cancel-all cancellation email skipped (RESEND env unset)", {
      bookingId: member.bookingId,
      userId: member.userId,
    });
    return;
  }

  try {
    const result = await sendBookingCancellation({
      apiKey: input.apiKey,
      from: input.from,
      locale: member.locale,
      toEmail: member.email,
      event: {
        ...input.event,
        title: input.eventTitleForLocale(member.locale),
        dateTime: member.dateTime,
      },
      ticketsCount: member.ticketsCount,
      totalCredits: member.totalCredits,
    });
    if (!result.ok) {
      console.error("cancel-all cancellation email failed", {
        bookingId: member.bookingId,
        userId: member.userId,
        error: result.error,
        status: result.status,
      });
    }
  } catch (error) {
    console.error("cancel-all cancellation email threw", {
      bookingId: member.bookingId,
      userId: member.userId,
      error,
    });
  }
}

async function sendOneWaitlistClosed(
  input: SendCancelAllEmailsSafeInput,
  member: ClosedWaitlistNotification,
): Promise<void> {
  if (!member.email) {
    console.warn("cancel-all waitlist-closed email skipped (no recipient email)", {
      userId: member.userId,
    });
    return;
  }

  if (!input.apiKey || !input.from) {
    console.warn("cancel-all waitlist-closed email skipped (RESEND env unset)", {
      userId: member.userId,
    });
    return;
  }

  try {
    const result = await sendWaitlistClosed({
      apiKey: input.apiKey,
      from: input.from,
      locale: member.locale,
      toEmail: member.email,
      event: {
        ...input.event,
        title: input.eventTitleForLocale(member.locale),
      },
    });
    if (!result.ok) {
      console.error("cancel-all waitlist-closed email failed", {
        userId: member.userId,
        error: result.error,
        status: result.status,
      });
    }
  } catch (error) {
    console.error("cancel-all waitlist-closed email threw", {
      userId: member.userId,
      error,
    });
  }
}
