import { asc, count, desc, eq, inArray } from "drizzle-orm";

import type { Db } from "../index";
import { type BookingTicket, bookingTickets } from "../schema/booking-tickets";
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
  tickets: BookingTicket[];
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

export async function listBookingTickets(db: Db, bookingId: string): Promise<BookingTicket[]> {
  return db
    .select()
    .from(bookingTickets)
    .where(eq(bookingTickets.bookingId, bookingId))
    .orderBy(asc(bookingTickets.ordinal));
}

export async function listUserBookings(
  db: Db,
  input: ListUserBookingsInput,
): Promise<ListUserBookingsResult> {
  const pageSize = input.pageSize ?? BOOKINGS_PAGE_SIZE;
  const page = Math.max(1, input.page ?? 1);
  const offset = (page - 1) * pageSize;
  const where = eq(bookings.userId, input.userId);

  const [rows, [totalRow]] = await Promise.all([
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

  const bookingIds = rows.map((row) => row.booking.id);
  const ticketRows =
    bookingIds.length === 0
      ? []
      : await db
          .select()
          .from(bookingTickets)
          .where(inArray(bookingTickets.bookingId, bookingIds))
          .orderBy(asc(bookingTickets.bookingId), asc(bookingTickets.ordinal));

  const ticketsByBookingId = new Map<string, BookingTicket[]>();
  for (const ticket of ticketRows) {
    const list = ticketsByBookingId.get(ticket.bookingId) ?? [];
    list.push(ticket);
    ticketsByBookingId.set(ticket.bookingId, list);
  }

  return {
    items: rows.map((row) => ({
      booking: row.booking,
      event: {
        id: row.eventId,
        title: row.eventTitle,
        partnerName: row.eventPartnerName,
        dateTime: row.eventDateTime,
        address: row.eventAddress,
      },
      tickets: ticketsByBookingId.get(row.booking.id) ?? [],
    })),
    total: totalRow?.count ?? 0,
    page,
    pageSize,
  };
}
