import { and, count, desc, eq, exists, ilike, or, type SQL, sql } from "drizzle-orm";

import { eventTitleLocaleIlike } from "../catalog/event-copy";
import type { Db } from "../index";
import { type Booking, type BookingStatus, bookings } from "../schema/bookings";
import { events } from "../schema/events";
import { type UserProfile, users } from "../schema/users";
import { waitlistEntries } from "../schema/waitlist-entries";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export type ListEventBookingsOptions = {
  eventId: string;
  status?: BookingStatus;
  /** 1-based page; non-positive values become 1. */
  page?: number;
  /** Page size; default 25, clamped 1–100. */
  limit?: number;
};

export type EventBookingListItem = Booking & {
  userEmail: string;
  userProfile: UserProfile;
};

export type ListEventBookingsResult = {
  items: EventBookingListItem[];
  total: number;
};

export type ListEventsWithBookingStatsOptions = {
  /** When set, restrict to this event (confirm-page stats). */
  eventId?: string;
  title?: string;
  partner?: string;
  page?: number;
  limit?: number;
};

export type EventBookingStatsRow = {
  eventId: string;
  title: string;
  titleDe: string;
  titleEn: string;
  partnerName: string;
  dateTime: Date;
  remainingCapacity: number;
  totalCapacity: number;
  confirmedCount: number;
  usedCount: number;
  cancelledCount: number;
  waitingCount: number;
  refundableCredits: number;
  compConfirmedCount: number;
};

export type ListEventsWithBookingStatsResult = {
  items: EventBookingStatsRow[];
  total: number;
};

function resolvePagePagination(options: { page?: number; limit?: number }): {
  limit: number;
  offset: number;
} {
  const requestedLimit = Number.isFinite(options.limit)
    ? Math.floor(options.limit as number)
    : DEFAULT_LIMIT;
  const limit = Math.max(1, Math.min(requestedLimit, MAX_LIMIT));
  const requestedPage = Number.isFinite(options.page) ? Math.floor(options.page as number) : 1;
  const page = requestedPage >= 1 ? requestedPage : 1;
  return { limit, offset: (page - 1) * limit };
}

/**
 * Paginated bookings for one event. Auth is enforced at the route.
 */
export async function listEventBookings(
  db: Db,
  options: ListEventBookingsOptions,
): Promise<ListEventBookingsResult> {
  const { limit, offset } = resolvePagePagination(options);
  const conditions: SQL[] = [eq(bookings.eventId, options.eventId)];
  if (options.status) {
    conditions.push(eq(bookings.status, options.status));
  }
  const where = and(...conditions);

  const [totalRow] = await db.select({ value: count() }).from(bookings).where(where);
  const total = totalRow?.value ?? 0;

  const rows = await db
    .select({
      booking: bookings,
      userEmail: users.email,
      userProfile: users.profile,
    })
    .from(bookings)
    .innerJoin(users, eq(users.id, bookings.userId))
    .where(where)
    .orderBy(desc(bookings.createdAt), desc(bookings.id))
    .limit(limit)
    .offset(offset);

  return {
    items: rows.map((row) => ({
      ...row.booking,
      userEmail: row.userEmail,
      userProfile: row.userProfile,
    })),
    total,
  };
}

function eventHasBookingOrWaitlist(db: Db): SQL {
  const hasBooking = exists(
    db.select({ id: bookings.id }).from(bookings).where(eq(bookings.eventId, events.id)),
  );
  const hasWaitlist = exists(
    db
      .select({ id: waitlistEntries.id })
      .from(waitlistEntries)
      .where(eq(waitlistEntries.eventId, events.id)),
  );
  return or(hasBooking, hasWaitlist) as SQL;
}

function statsFilterConditions(db: Db, options: ListEventsWithBookingStatsOptions): SQL {
  const conditions: SQL[] = [eventHasBookingOrWaitlist(db)];
  if (options.eventId) {
    conditions.push(eq(events.id, options.eventId));
  }
  const title = options.title?.trim();
  if (title) {
    const titleCondition = eventTitleLocaleIlike(`%${title}%`);
    if (titleCondition) {
      conditions.push(titleCondition);
    }
  }
  const partner = options.partner?.trim();
  if (partner) {
    conditions.push(ilike(events.partnerName, `%${partner}%`));
  }
  return and(...conditions) as SQL;
}

/**
 * Events that have at least one booking or waitlist entry, with per-status counts
 * for the admin Bookings tab landing and cancel-all confirm preview.
 */
export async function listEventsWithBookingStats(
  db: Db,
  options: ListEventsWithBookingStatsOptions = {},
): Promise<ListEventsWithBookingStatsResult> {
  const { limit, offset } = resolvePagePagination(options);
  const where = statsFilterConditions(db, options);

  const [totalRow] = await db.select({ value: count() }).from(events).where(where);
  const total = totalRow?.value ?? 0;

  const bookingStats = db
    .select({
      eventId: bookings.eventId,
      confirmedCount:
        sql<number>`count(*) filter (where ${eq(bookings.status, "CONFIRMED")})::int`.as(
          "confirmed_count",
        ),
      usedCount: sql<number>`count(*) filter (where ${eq(bookings.status, "USED")})::int`.as(
        "used_count",
      ),
      cancelledCount:
        sql<number>`count(*) filter (where ${eq(bookings.status, "CANCELLED")})::int`.as(
          "cancelled_count",
        ),
      refundableCredits:
        sql<number>`coalesce(sum(${bookings.totalCredits}) filter (where ${eq(bookings.status, "CONFIRMED")} and ${bookings.totalCredits} > 0), 0)::int`.as(
          "refundable_credits",
        ),
      compConfirmedCount:
        sql<number>`count(*) filter (where ${eq(bookings.status, "CONFIRMED")} and ${bookings.totalCredits} = 0)::int`.as(
          "comp_confirmed_count",
        ),
    })
    .from(bookings)
    .groupBy(bookings.eventId)
    .as("event_booking_stats");

  const waitlistStats = db
    .select({
      eventId: waitlistEntries.eventId,
      waitingCount:
        sql<number>`count(*) filter (where ${eq(waitlistEntries.status, "WAITING")})::int`.as(
          "waiting_count",
        ),
    })
    .from(waitlistEntries)
    .groupBy(waitlistEntries.eventId)
    .as("event_waitlist_stats");

  const rows = await db
    .select({
      eventId: events.id,
      title: events.title,
      titleDe: events.titleDe,
      titleEn: events.titleEn,
      partnerName: events.partnerName,
      dateTime: events.dateTime,
      remainingCapacity: events.remainingCapacity,
      totalCapacity: events.totalCapacity,
      confirmedCount: bookingStats.confirmedCount,
      usedCount: bookingStats.usedCount,
      cancelledCount: bookingStats.cancelledCount,
      waitingCount: waitlistStats.waitingCount,
      refundableCredits: bookingStats.refundableCredits,
      compConfirmedCount: bookingStats.compConfirmedCount,
    })
    .from(events)
    .leftJoin(bookingStats, eq(events.id, bookingStats.eventId))
    .leftJoin(waitlistStats, eq(events.id, waitlistStats.eventId))
    .where(where)
    .orderBy(desc(events.dateTime), desc(events.id))
    .limit(limit)
    .offset(offset);

  return {
    items: rows.map((row) => ({
      eventId: row.eventId,
      title: row.title,
      titleDe: row.titleDe,
      titleEn: row.titleEn,
      partnerName: row.partnerName,
      dateTime: row.dateTime,
      remainingCapacity: row.remainingCapacity,
      totalCapacity: row.totalCapacity,
      confirmedCount: Number(row.confirmedCount ?? 0),
      usedCount: Number(row.usedCount ?? 0),
      cancelledCount: Number(row.cancelledCount ?? 0),
      waitingCount: Number(row.waitingCount ?? 0),
      refundableCredits: Number(row.refundableCredits ?? 0),
      compConfirmedCount: Number(row.compConfirmedCount ?? 0),
    })),
    total,
  };
}
