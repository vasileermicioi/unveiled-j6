import { and, asc, desc, eq, gte, ilike, max, notExists, or, type SQL } from "drizzle-orm";

import type { Db } from "../index";
import { type Event, events } from "../schema/events";
import { featuredEvents } from "../schema/featured-events";
import { CatalogValidationError } from "./errors";
import { getEventById } from "./events";

export type FeaturedEventRow = Event & { sortOrder: number };

export type ListFeaturedEventsOptions = {
  upcomingOnly?: boolean;
  now?: Date;
};

export type SearchEventsNotFeaturedOptions = {
  q?: string;
  limit?: number;
  offset?: number;
};

function eventSearchCondition(q?: string): SQL | undefined {
  const search = q?.trim();
  if (!search) {
    return undefined;
  }

  const pattern = `%${search}%`;
  return or(ilike(events.title, pattern), ilike(events.partnerName, pattern));
}

export async function listFeaturedEvents(
  db: Db,
  options: ListFeaturedEventsOptions = {},
): Promise<FeaturedEventRow[]> {
  const conditions: SQL[] = [];
  if (options.upcomingOnly) {
    const now = options.now ?? new Date();
    conditions.push(gte(events.dateTime, now));
  }

  let query = db
    .select({
      event: events,
      sortOrder: featuredEvents.sortOrder,
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
  return rows.map((row) => ({ ...row.event, sortOrder: row.sortOrder }));
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
  const limit = options.limit ?? 25;
  const offset = options.offset ?? 0;
  const conditions: SQL[] = [
    notExists(
      db
        .select({ one: featuredEvents.eventId })
        .from(featuredEvents)
        .where(eq(featuredEvents.eventId, events.id)),
    ),
  ];

  const searchCondition = eventSearchCondition(options.q);
  if (searchCondition) {
    conditions.push(searchCondition);
  }

  return db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(desc(events.createdAt), desc(events.id))
    .limit(limit)
    .offset(offset);
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

  return { ...event, sortOrder };
}

export async function removeFeaturedEvent(db: Db, eventId: string): Promise<void> {
  await db.delete(featuredEvents).where(eq(featuredEvents.eventId, eventId));
}
