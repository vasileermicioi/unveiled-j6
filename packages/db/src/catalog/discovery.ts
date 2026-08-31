import { and, asc, count, eq, gte, inArray, ne, or, type SQL, sql } from "drizzle-orm";

import type { Db } from "../index";
import { type Event, events } from "../schema/events";
import { savedEvents } from "../schema/saved-events";
import {
  type BerlinDayRange,
  berlinInclusiveDateRange,
  berlinTodayRange,
  getBerlinCalendarDate,
} from "./datetime";
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
 * - otherwise inclusive Berlin day bounds (timed slots still intersect with `now`;
 *   all-day uses the Berlin day start so 00:00 stays in range).
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

/**
 * Timed events drop at `now`. All-day events stay listed through Berlin midnight
 * of the next calendar day (`date_time` is stored as that day's 00:00).
 */
function upcomingDateTimeCondition(now: Date): SQL {
  const todayStart = berlinTodayRange(now).start;
  return or(
    and(eq(events.timingMode, "ALL_DAY"), gte(events.dateTime, todayStart)),
    and(ne(events.timingMode, "ALL_DAY"), gte(events.dateTime, now)),
  ) as SQL;
}

function memberFeedConditions(filters: MemberFeedFilters, now: Date): SQL[] {
  const window = resolveFeedWindow(filters, now);
  // Default: upcoming soonest-first. Ranged: inclusive Europe/Berlin calendar
  // days, from ≥ Berlin today. Timed slots still require dt >= now; all-day
  // occurrences match the Berlin day (`dt < next midnight`) even after 00:00.
  const conditions: SQL[] = [eq(events.published, true)];

  if (window === "empty") {
    conditions.push(sql`false`);
  } else if (window === null) {
    conditions.push(upcomingDateTimeCondition(now));
  } else {
    const timedStart = window.start > now ? window.start : now;
    conditions.push(upcomingDateTimeCondition(now));
    conditions.push(
      or(
        and(
          eq(events.timingMode, "ALL_DAY"),
          sql`EXISTS (
            SELECT 1
            FROM unnest(${events.dateTimes}) AS occurrence(dt)
            WHERE occurrence.dt >= ${window.start}
              AND occurrence.dt < ${window.end}
          )`,
        ),
        and(
          ne(events.timingMode, "ALL_DAY"),
          sql`EXISTS (
            SELECT 1
            FROM unnest(${events.dateTimes}) AS occurrence(dt)
            WHERE occurrence.dt >= ${timedStart}
              AND occurrence.dt < ${window.end}
          )`,
        ),
      ) as SQL,
    );
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
      and(
        eq(savedEvents.userId, userId),
        upcomingDateTimeCondition(now),
        eq(events.published, true),
      ),
    )
    .orderBy(asc(events.dateTime), asc(events.id));

  return rows.map((row) => row.event);
}
