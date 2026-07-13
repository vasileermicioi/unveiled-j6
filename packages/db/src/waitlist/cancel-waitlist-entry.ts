import { and, eq } from "drizzle-orm";

import { type WaitlistEntry, waitlistEntries } from "../schema/waitlist-entries";

import { WaitlistError } from "./errors";
import type { WaitlistDb } from "./join-waitlist";

export type CancelWaitlistEntryInput = {
  entryId: string;
  userId: string;
};

/**
 * Owner-scoped cancel: WAITING → CANCELLED. Excluded from future promotion.
 */
export async function cancelWaitlistEntry(
  db: WaitlistDb,
  input: CancelWaitlistEntryInput,
): Promise<WaitlistEntry> {
  const entry = await db.query.waitlistEntries.findFirst({
    where: (fields, { eq: eqOp }) => eqOp(fields.id, input.entryId),
  });

  if (!entry) {
    throw new WaitlistError("NOT_FOUND", "Waitlist entry not found");
  }

  if (entry.userId !== input.userId) {
    throw new WaitlistError("FORBIDDEN", "Cannot cancel another member's waitlist entry");
  }

  if (entry.status !== "WAITING") {
    throw new WaitlistError("NOT_WAITING", "Only WAITING entries can be cancelled");
  }

  const now = new Date();
  const [updated] = await db
    .update(waitlistEntries)
    .set({
      status: "CANCELLED",
      updatedAt: now,
    })
    .where(and(eq(waitlistEntries.id, entry.id), eq(waitlistEntries.status, "WAITING")))
    .returning();

  if (!updated) {
    throw new WaitlistError("NOT_WAITING", "Only WAITING entries can be cancelled");
  }

  return updated;
}
