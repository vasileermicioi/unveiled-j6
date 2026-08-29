import { and, asc, count, eq, gte, inArray, type SQL, sql } from "drizzle-orm";

import type { Db } from "../index";
import { type Event, events } from "../schema/events";
import { savedEvents } from "../schema/saved-events";
import { type BerlinDayRange, berlinInclusiveDateRange, getBerlinCalendarDate } from "./datetime";
import { CatalogValidationError } from "./errors";
import { eventTitleLocaleIlike } from "./event-copy";

export const MEMBER_FEED_PAGE_SIZE = 24;

/** Max markers returned for the member map view when loading the full filtered set. */
export const MEMBER_FEED_MAP_MAX = 500;

export type MemberFeedFilters = {
  /** Case-insensitive substring match on `title_de` or `title_en`. */
  title?: string;
  /** One or more categories (OR). Single string still accepted. */
  category?: string | string[];
  /** One or more partner ids (OR). Single string still accepted. */
  partnerId?: string | string[];
  /** YYYY-MM-DD Europe/Berlin calendar day (inclusive). */
  from?: string;
  /** YYYY-MM-DD Europe/Berlin calendar day (inclusive). */
  to?: string;
  /** 1-based page; default 1. */
  page?: number;
  /** Injected clock for tests; defaults to `new Date()`. */
  now?: Date;
  // Language filter UI is not shipped yet. When added, use
  // `eventMatchesLanguageFilter` from `./language-filter` (language-independent ⇒ match all).
};

export type MemberFeedResult = {
  items: Event[];
  total: number;
};

/** Map list omits feed `page`; same filter window / past exclusion as the feed. */
export type MemberFeedMapFilters = Omit<MemberFeedFilters, "page">;

/** Escape `\`, `%`, and `_` so user input is literal in Postgres `ILIKE` patterns. */
function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/**
 * Resolve the calendar range for a ranged feed query.
 * - `null` — no from/to (default upcoming window).
 * - `"empty"` — inverted after clamping (past-only range).
 * - otherwise inclusive Berlin day bounds (caller still intersects with `now`).
 */
function resolveFeedWindow(filters: MemberFeedFilters, now: Date): BerlinDayRange | "empty" | null {
  const hasFrom = Boolean(filters.from?.trim());
  const hasTo = Boolean(filters.to?.trim());

  if (!hasFrom && !hasTo) {
    return null;
  }

  let fromYmd = hasFrom ? (filters.from as string).trim() : (filters.to as string).trim();
  let toYmd = hasTo ? (filters.to as string).trim() : (filters.from as string).trim();

  if (fromYmd > toYmd) {
    const swap = fromYmd;
    fromYmd = toYmd;
    toYmd = swap;
  }

  const todayYmd = getBerlinCalendarDate(now);
  if (fromYmd < todayYmd) {
    fromYmd = todayYmd;
  }

  if (fromYmd > toYmd) {
    return "empty";
  }

  return berlinInclusiveDateRange(fromYmd, toYmd);
}

function normalizeFilterList(value?: string | string[]): string[] {
  if (value == null) {
    return [];
  }
  const raw = Array.isArray(value) ? value : [value];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    const trimmed = entry.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

function memberFeedConditions(filters: MemberFeedFilters, now: Date): SQL[] {
  const window = resolveFeedWindow(filters, now);
  // Default: all upcoming (`date_time >= now`), soonest first via orderBy.
  // Ranged: inclusive Europe/Berlin calendar days, clamped so from ≥ Berlin today,
  // always intersected with `date_time >= now` so past showtimes stay hidden.
  const conditions: SQL[] = [eq(events.published, true)];

  if (window === "empty") {
    conditions.push(sql`false`);
  } else if (window === null) {
    conditions.push(gte(events.dateTime, now));
  } else {
    const effectiveStart = window.start > now ? window.start : now;
    if (effectiveStart >= window.end) {
      conditions.push(sql`false`);
    } else {
      // Upcoming gate via denormalized next; range matches any occurrence in the window.
      conditions.push(gte(events.dateTime, now));
      conditions.push(
        sql`EXISTS (
          SELECT 1
          FROM unnest(${events.dateTimes}) AS occurrence(dt)
          WHERE occurrence.dt >= ${effectiveStart}
            AND occurrence.dt < ${window.end}
        )`,
      );
    }
  }

  const title = filters.title?.trim();
  if (title) {
    const titleCondition = eventTitleLocaleIlike(`%${escapeIlikePattern(title)}%`);
    if (titleCondition) {
      conditions.push(titleCondition);
    }
  }

  const categories = normalizeFilterList(filters.category);
  if (categories.length === 1) {
    conditions.push(eq(events.category, categories[0]!));
  } else if (categories.length > 1) {
    conditions.push(inArray(events.category, categories));
  }

  const partnerIds = normalizeFilterList(filters.partnerId);
  if (partnerIds.length === 1) {
    conditions.push(eq(events.partnerId, partnerIds[0]!));
  } else if (partnerIds.length > 1) {
    conditions.push(inArray(events.partnerId, partnerIds));
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
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });
  if (!event?.published) {
    throw new CatalogValidationError("EVENT_NOT_FOUND", `Event ${eventId} not found`);
  }

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
    .where(
      and(eq(savedEvents.userId, userId), gte(events.dateTime, now), eq(events.published, true)),
    )
    .orderBy(asc(events.dateTime), asc(events.id));

  return rows.map((row) => row.event);
}
