import { and, asc, count, eq, gte, lt, type SQL } from "drizzle-orm";

import type { Db } from "../index";
import { type Event, events } from "../schema/events";
import { savedEvents } from "../schema/saved-events";
import { berlinInclusiveDateRange, berlinTodayRange } from "./datetime";

export const MEMBER_FEED_PAGE_SIZE = 24;

/** Max markers returned for the member map view (full filtered set, no page slice). */
export const MEMBER_FEED_MAP_MAX = 500;

export type MemberFeedFilters = {
  category?: string;
  partnerId?: string;
  /** YYYY-MM-DD Europe/Berlin calendar day (inclusive). */
  from?: string;
  /** YYYY-MM-DD Europe/Berlin calendar day (inclusive). */
  to?: string;
  /** 1-based page; default 1. */
  page?: number;
  /** Injected clock for tests; defaults to `new Date()`. */
  now?: Date;
};

export type MemberFeedResult = {
  items: Event[];
  total: number;
};

/** Map list omits feed `page`; same filter window / past exclusion as the feed. */
export type MemberFeedMapFilters = Omit<MemberFeedFilters, "page">;

function resolveFeedWindow(filters: MemberFeedFilters, now: Date) {
  const hasFrom = Boolean(filters.from?.trim());
  const hasTo = Boolean(filters.to?.trim());

  if (!hasFrom && !hasTo) {
    return berlinTodayRange(now);
  }

  const from = hasFrom ? (filters.from as string) : (filters.to as string);
  const to = hasTo ? (filters.to as string) : (filters.from as string);
  return berlinInclusiveDateRange(from, to);
}

function memberFeedConditions(filters: MemberFeedFilters, now: Date): SQL[] {
  const window = resolveFeedWindow(filters, now);
  const conditions: SQL[] = [
    gte(events.dateTime, now),
    gte(events.dateTime, window.start),
    lt(events.dateTime, window.end),
  ];

  if (filters.category?.trim()) {
    conditions.push(eq(events.category, filters.category.trim()));
  }

  if (filters.partnerId?.trim()) {
    conditions.push(eq(events.partnerId, filters.partnerId.trim()));
  }

  return conditions;
}

export async function listMemberFeedEvents(
  db: Db,
  filters: MemberFeedFilters = {},
): Promise<MemberFeedResult> {
  const now = filters.now ?? new Date();
  const rawPage = filters.page ?? 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const offset = (page - 1) * MEMBER_FEED_PAGE_SIZE;
  const conditions = memberFeedConditions(filters, now);
  const where = and(...conditions);

  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(events)
      .where(where)
      .orderBy(asc(events.dateTime), asc(events.id))
      .limit(MEMBER_FEED_PAGE_SIZE)
      .offset(offset),
    db.select({ count: count() }).from(events).where(where),
  ]);

  return {
    items,
    total: countRows[0]?.count ?? 0,
  };
}

/**
 * Full filtered feed set for the map (no page offset), capped at {@link MEMBER_FEED_MAP_MAX}.
 * Does not require lat/lng — callers omit events without coordinates when building markers.
 */
export async function listMemberFeedMapEvents(
  db: Db,
  filters: MemberFeedMapFilters = {},
): Promise<MemberFeedResult> {
  const now = filters.now ?? new Date();
  const conditions = memberFeedConditions(filters, now);
  const where = and(...conditions);

  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(events)
      .where(where)
      .orderBy(asc(events.dateTime), asc(events.id))
      .limit(MEMBER_FEED_MAP_MAX),
    db.select({ count: count() }).from(events).where(where),
  ]);

  return {
    items,
    total: countRows[0]?.count ?? 0,
  };
}

export async function saveEvent(db: Db, userId: string, eventId: string): Promise<void> {
  await db
    .insert(savedEvents)
    .values({ userId, eventId })
    .onConflictDoNothing({ target: [savedEvents.userId, savedEvents.eventId] });
}

export async function unsaveEvent(db: Db, userId: string, eventId: string): Promise<void> {
  await db
    .delete(savedEvents)
    .where(and(eq(savedEvents.userId, userId), eq(savedEvents.eventId, eventId)));
}

export async function isEventSaved(db: Db, userId: string, eventId: string): Promise<boolean> {
  const row = await db
    .select({ userId: savedEvents.userId })
    .from(savedEvents)
    .where(and(eq(savedEvents.userId, userId), eq(savedEvents.eventId, eventId)))
    .limit(1);

  return row.length > 0;
}

export async function listSavedEventIds(db: Db, userId: string): Promise<string[]> {
  const rows = await db
    .select({ eventId: savedEvents.eventId })
    .from(savedEvents)
    .where(eq(savedEvents.userId, userId));

  return rows.map((row) => row.eventId);
}

export async function listSavedUpcomingEvents(
  db: Db,
  userId: string,
  now: Date = new Date(),
): Promise<Event[]> {
  const rows = await db
    .select({ event: events })
    .from(savedEvents)
    .innerJoin(events, eq(savedEvents.eventId, events.id))
    .where(and(eq(savedEvents.userId, userId), gte(events.dateTime, now)))
    .orderBy(asc(events.dateTime), asc(events.id));

  return rows.map((row) => row.event);
}
