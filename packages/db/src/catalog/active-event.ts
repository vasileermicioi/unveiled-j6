import { and, gt, gte, type SQL } from "drizzle-orm";

import { events } from "../schema/events";

/**
 * Active event: upcoming (`date_time >= now`) with remaining capacity.
 * Shared by partner-list counts and later sales-export / dashboard-adjacent queries.
 */
export function activeEventCondition(now: Date): SQL {
  return and(gte(events.dateTime, now), gt(events.remainingCapacity, 0)) as SQL;
}
