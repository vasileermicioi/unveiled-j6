import { and, asc, eq, inArray } from "drizzle-orm";

import type { Db, TxDb } from "../index";
import { bookings } from "../schema/bookings";

const ACTIVE_BOOKING_STATUSES: Array<"CONFIRMED" | "USED"> = ["CONFIRMED", "USED"];

/**
 * Occurrence instants the member already holds as CONFIRMED or USED on this event.
 * CANCELLED rows are omitted. Used by checkout to hide a second purchase for that hour.
 */
export async function listActiveBookedOccurrenceInstants(
  db: Db | TxDb,
  userId: string,
  eventId: string,
): Promise<Date[]> {
  const rows = await db
    .select({ dateTime: bookings.dateTime })
    .from(bookings)
    .where(
      and(
        eq(bookings.userId, userId),
        eq(bookings.eventId, eventId),
        inArray(bookings.status, ACTIVE_BOOKING_STATUSES),
      ),
    )
    .orderBy(asc(bookings.dateTime));

  return rows.map((row) => row.dateTime);
}
