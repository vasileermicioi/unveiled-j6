import { asc, eq } from "drizzle-orm";

import { type WaitlistEntry, waitlistEntries } from "../schema/waitlist-entries";

import type { WaitlistDb } from "./join-waitlist";

/**
 * Member-scoped listing — only entries for the given userId.
 */
export async function listUserWaitlistEntries(
  db: WaitlistDb,
  userId: string,
): Promise<WaitlistEntry[]> {
  return db
    .select()
    .from(waitlistEntries)
    .where(eq(waitlistEntries.userId, userId))
    .orderBy(asc(waitlistEntries.createdAt));
}
