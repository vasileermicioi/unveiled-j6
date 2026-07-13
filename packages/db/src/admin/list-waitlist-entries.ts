import { and, asc, count, eq, type SQL } from "drizzle-orm";

import type { Db } from "../index";
import {
  type WaitlistEntry,
  type WaitlistStatus,
  waitlistEntries,
} from "../schema/waitlist-entries";

export type ListAdminWaitlistEntriesOptions = {
  eventId?: string;
  status?: WaitlistStatus;
  limit?: number;
  offset?: number;
};

export type AdminWaitlistRow = WaitlistEntry;

export type ListAdminWaitlistEntriesResult = {
  items: AdminWaitlistRow[];
  total: number;
};

const DEFAULT_LIMIT = 25;

/**
 * Admin waitlist listing across events — status and skip history (`skippedOnce`) included.
 * Auth is enforced at the route; this query is unscoped by partner.
 */
export async function listAdminWaitlistEntries(
  db: Db,
  options: ListAdminWaitlistEntriesOptions = {},
): Promise<ListAdminWaitlistEntriesResult> {
  const limit = Math.max(1, Math.min(options.limit ?? DEFAULT_LIMIT, 100));
  const offset = Math.max(0, options.offset ?? 0);

  const conditions: SQL[] = [];
  if (options.eventId) {
    conditions.push(eq(waitlistEntries.eventId, options.eventId));
  }
  if (options.status) {
    conditions.push(eq(waitlistEntries.status, options.status));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db.select({ value: count() }).from(waitlistEntries).where(where);
  const total = totalRow?.value ?? 0;

  const items = await db
    .select()
    .from(waitlistEntries)
    .where(where)
    .orderBy(asc(waitlistEntries.createdAt), asc(waitlistEntries.id))
    .limit(limit)
    .offset(offset);

  return { items, total };
}
