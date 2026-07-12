import { count, desc, eq } from "drizzle-orm";

import type { Db } from "../index";
import { type Booking, bookings } from "../schema/bookings";
import { events } from "../schema/events";

export const BOOKINGS_PAGE_SIZE = 20;

export type UserBookingEventSummary = {
  id: string;
  title: string;
  partnerName: string;
  dateTime: Date;
  address: string;
};

export type UserBookingListItem = {
  booking: Booking;
  event: UserBookingEventSummary;
};

export type ListUserBookingsResult = {
  items: UserBookingListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type ListUserBookingsInput = {
  userId: string;
  /** 1-based page; default 1. */
  page?: number;
  pageSize?: number;
};

export async function listUserBookings(
  db: Db,
  input: ListUserBookingsInput,
): Promise<ListUserBookingsResult> {
  const pageSize = input.pageSize ?? BOOKINGS_PAGE_SIZE;
  const page = Math.max(1, input.page ?? 1);
  const offset = (page - 1) * pageSize;
  const where = eq(bookings.userId, input.userId);

  const [items, [totalRow]] = await Promise.all([
    db
      .select({
        booking: bookings,
        eventId: events.id,
        eventTitle: events.title,
        eventPartnerName: events.partnerName,
        eventDateTime: events.dateTime,
        eventAddress: events.address,
      })
      .from(bookings)
      .innerJoin(events, eq(bookings.eventId, events.id))
      .where(where)
      .orderBy(desc(bookings.createdAt), desc(bookings.id))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(bookings).where(where),
  ]);

  return {
    items: items.map((row) => ({
      booking: row.booking,
      event: {
        id: row.eventId,
        title: row.eventTitle,
        partnerName: row.eventPartnerName,
        dateTime: row.eventDateTime,
        address: row.eventAddress,
      },
    })),
    total: totalRow?.count ?? 0,
    page,
    pageSize,
  };
}
