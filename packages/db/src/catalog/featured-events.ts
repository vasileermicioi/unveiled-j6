import { and, asc, eq, gte, inArray, max, type SQL } from "drizzle-orm";

import type { Db } from "../index";
import { type Event, events } from "../schema/events";
import { featuredEvents } from "../schema/featured-events";
import { CatalogValidationError } from "./errors";
import { getEventById, type ListEventsOptions, listEvents } from "./events";

export type FeaturedEventRow = Event & { sortOrder: number; featuredPublished: boolean };

/** Temp offset for reorder writes (admin curated lists stay small). */
const FEATURED_EVENTS_REORDER_TEMP_BASE = 10_000;

export type ListFeaturedEventsOptions = {
  upcomingOnly?: boolean;
  now?: Date;
  /** When true, require catalog `events.published`. Featured membership is not draftable. */
  publishedOnly?: boolean;
};

export type SearchEventsNotFeaturedOptions = Pick<
  ListEventsOptions,
  "q" | "title" | "partner" | "language" | "limit" | "offset" | "sort" | "desc"
>;

export async function listFeaturedEvents(
  db: Db,
  options: ListFeaturedEventsOptions = {},
): Promise<FeaturedEventRow[]> {
  const conditions: SQL[] = [];
  if (options.upcomingOnly) {
    const now = options.now ?? new Date();
    conditions.push(gte(events.dateTime, now));
  }
  if (options.publishedOnly) {
    conditions.push(eq(events.published, true));
  }

  let query = db
    .select({
      event: events,
      sortOrder: featuredEvents.sortOrder,
      featuredPublished: featuredEvents.published,
    })
    .from(featuredEvents)
    .innerJoin(events, eq(featuredEvents.eventId, events.id))
    .$dynamic();

  if (conditions.length === 1) {
    query = query.where(conditions[0]);
  } else if (conditions.length > 1) {
    query = query.where(and(...conditions));
  }

  const rows = await query.orderBy(asc(featuredEvents.sortOrder), asc(events.dateTime));
  return rows.map((row) => ({
    ...row.event,
    sortOrder: row.sortOrder,
    featuredPublished: row.featuredPublished,
  }));
}

export async function listFeaturedEventIds(db: Db): Promise<string[]> {
  const rows = await db
    .select({ eventId: featuredEvents.eventId })
    .from(featuredEvents)
    .orderBy(asc(featuredEvents.sortOrder));
  return rows.map((row) => row.eventId);
}

export async function searchEventsNotFeatured(
  db: Db,
  options: SearchEventsNotFeaturedOptions = {},
): Promise<Event[]> {
  return listEvents(db, {
    ...options,
    excludeFeatured: true,
  });
}

export async function getFeaturedEventByEventId(
  db: Db,
  eventId: string,
): Promise<FeaturedEventRow | null> {
  const [row] = await db
    .select({
      event: events,
      sortOrder: featuredEvents.sortOrder,
      featuredPublished: featuredEvents.published,
    })
    .from(featuredEvents)
    .innerJoin(events, eq(featuredEvents.eventId, events.id))
    .where(eq(featuredEvents.eventId, eventId))
    .limit(1);
  if (!row) {
    return null;
  }
  return {
    ...row.event,
    sortOrder: row.sortOrder,
    featuredPublished: row.featuredPublished,
  };
}

export async function setFeaturedEventPublished(
  db: Db,
  eventId: string,
  published: boolean,
): Promise<void> {
  const [existing] = await db
    .select({
      eventId: featuredEvents.eventId,
      published: featuredEvents.published,
    })
    .from(featuredEvents)
    .where(eq(featuredEvents.eventId, eventId))
    .limit(1);
  if (!existing) {
    throw new CatalogValidationError("EVENT_NOT_FOUND", `Event ${eventId} not found`);
  }
  if (existing.published === published) {
    return;
  }

  await db.update(featuredEvents).set({ published }).where(eq(featuredEvents.eventId, eventId));
}

export async function addFeaturedEvent(db: Db, eventId: string): Promise<FeaturedEventRow> {
  const event = await getEventById(db, eventId);
  if (!event) {
    throw new CatalogValidationError("EVENT_NOT_FOUND", `Event ${eventId} not found`);
  }

  const [existing] = await db
    .select({ eventId: featuredEvents.eventId })
    .from(featuredEvents)
    .where(eq(featuredEvents.eventId, eventId))
    .limit(1);
  if (existing) {
    throw new CatalogValidationError("ALREADY_FEATURED", `Event ${eventId} is already featured`);
  }

  const [maxRow] = await db.select({ maxSort: max(featuredEvents.sortOrder) }).from(featuredEvents);
  const sortOrder = (maxRow?.maxSort ?? -1) + 1;

  await db.insert(featuredEvents).values({ eventId, sortOrder });

  return { ...event, sortOrder, featuredPublished: false };
}

export async function removeFeaturedEvent(db: Db, eventId: string): Promise<void> {
  await removeFeaturedEvents(db, [eventId]);
}

/**
 * Remove featured membership for the given events. Underlying `events` rows are kept.
 */
export async function removeFeaturedEvents(db: Db, eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) {
    return;
  }
  const uniqueIds = [...new Set(eventIds)];
  await db.delete(featuredEvents).where(inArray(featuredEvents.eventId, uniqueIds));
}

/**
 * Persist a new featured-events order. `orderedEventIds` must be a permutation of
 * the current featured set (same ids, same length). Writes `sort_order` as 0..n-1.
 */
export async function reorderFeaturedEvents(
  db: Db,
  orderedEventIds: string[],
): Promise<FeaturedEventRow[]> {
  const existing = await listFeaturedEvents(db);
  const existingIds = existing.map((row) => row.id);

  if (orderedEventIds.length === 0 && existingIds.length === 0) {
    return [];
  }

  const uniqueOrdered = [...new Set(orderedEventIds)];
  if (
    uniqueOrdered.length !== orderedEventIds.length ||
    uniqueOrdered.length !== existingIds.length
  ) {
    throw new CatalogValidationError(
      "FEATURED_EVENTS_REORDER_INVALID",
      "Featured events reorder must include each current event id exactly once",
    );
  }

  const existingSet = new Set(existingIds);
  for (const eventId of uniqueOrdered) {
    if (!existingSet.has(eventId)) {
      throw new CatalogValidationError(
        "FEATURED_EVENTS_REORDER_INVALID",
        `Event ${eventId} is not on the featured events list`,
      );
    }
  }

  for (let i = 0; i < uniqueOrdered.length; i += 1) {
    const eventId = uniqueOrdered[i];
    if (!eventId) {
      continue;
    }
    await db
      .update(featuredEvents)
      .set({ sortOrder: FEATURED_EVENTS_REORDER_TEMP_BASE + i })
      .where(eq(featuredEvents.eventId, eventId));
  }

  for (let i = 0; i < uniqueOrdered.length; i += 1) {
    const eventId = uniqueOrdered[i];
    if (!eventId) {
      continue;
    }
    await db
      .update(featuredEvents)
      .set({ sortOrder: i })
      .where(eq(featuredEvents.eventId, eventId));
  }

  return listFeaturedEvents(db);
}
