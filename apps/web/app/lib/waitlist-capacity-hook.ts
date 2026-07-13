import { createTxDb, processWaitlistForEvent } from "@unveiled/db";
import type { Context } from "hono";

import type { Locale } from "./locale";
import { resolveEnvVarFromContext } from "./runtime-env";
import { sendWaitlistPromotionEmailsSafe } from "./waitlist-promotion-email";

/**
 * Phase 7 promotion trigger: when admin raises remaining capacity via event edit,
 * process the waitlist and email promoted members.
 *
 * Phase 8 admin booking-cancel MUST also call `processWaitlistForEvent` (then this
 * email helper) after capacity frees — do not invent a second promotion path.
 */
export async function maybeProcessWaitlistAfterCapacityIncrease(options: {
  c: Context;
  databaseUrl: string;
  eventId: string;
  previousRemaining: number;
  nextRemaining: number;
  locale: Locale;
  event: {
    id: string;
    title: string;
    address: string;
    dateTime: Date;
    partnerName: string;
  };
  resolveToEmail: (userId: string) => Promise<string | undefined>;
}): Promise<void> {
  if (options.nextRemaining <= options.previousRemaining) {
    return;
  }

  const txDb = createTxDb(options.databaseUrl);
  try {
    const result = await processWaitlistForEvent(txDb, options.eventId);
    if (result.promoted.length === 0) {
      return;
    }

    await sendWaitlistPromotionEmailsSafe(result.promoted, {
      apiKey: resolveEnvVarFromContext(options.c, "RESEND_API_KEY"),
      from: resolveEnvVarFromContext(options.c, "DAILY_CODES_FROM_EMAIL"),
      locale: options.locale,
      event: options.event,
      resolveToEmail: options.resolveToEmail,
    });
  } catch (error) {
    console.error("waitlist process after capacity increase failed", {
      eventId: options.eventId,
      error,
    });
  } finally {
    await txDb.pool.end().catch(() => undefined);
  }
}
