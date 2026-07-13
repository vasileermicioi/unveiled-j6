import { and, count, eq, lte } from "drizzle-orm";

import { waitlistEntries } from "../schema/waitlist-entries";

import type { WaitlistDb } from "./join-waitlist";

/**
 * Best-effort queue position (1-based) among WAITING entries for the event,
 * ordered by created_at (entries created at/before this entry count toward position).
 */
export async function getWaitlistQueuePosition(
  db: WaitlistDb,
  eventId: string,
  entryCreatedAt: Date,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(waitlistEntries)
    .where(
      and(
        eq(waitlistEntries.eventId, eventId),
        eq(waitlistEntries.status, "WAITING"),
        lte(waitlistEntries.createdAt, entryCreatedAt),
      ),
    );
  return Number(row?.value ?? 1);
}
