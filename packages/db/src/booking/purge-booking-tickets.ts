import { inArray, sql } from "drizzle-orm";

import type { Db } from "../index";
import { bookingTickets } from "../schema/booking-tickets";
import { eventVoucherCodes } from "../schema/event-voucher-codes";
import { eventVoucherPdfs } from "../schema/event-voucher-pdfs";

/**
 * Clear inventory allocation pointers and delete booking_tickets for the given bookings.
 * Call before deleting `bookings` rows (RESTRICT FKs).
 */
export async function purgeBookingTicketsForBookings(db: Db, bookingIds: string[]): Promise<void> {
  if (bookingIds.length === 0) {
    return;
  }

  const tickets = await db
    .select({ id: bookingTickets.id })
    .from(bookingTickets)
    .where(inArray(bookingTickets.bookingId, bookingIds));
  const ticketIds = tickets.map((row) => row.id);

  if (ticketIds.length > 0) {
    await db
      .update(eventVoucherCodes)
      .set({ bookingTicketId: null })
      .where(inArray(eventVoucherCodes.bookingTicketId, ticketIds));
    await db
      .update(eventVoucherPdfs)
      .set({ bookingTicketId: null })
      .where(inArray(eventVoucherPdfs.bookingTicketId, ticketIds));
  }

  await db.delete(bookingTickets).where(inArray(bookingTickets.bookingId, bookingIds));
}

/** Seed/reset helper: wipe all voucher inventory and booking tickets. */
export async function purgeAllBookingTicketGraph(db: Db): Promise<void> {
  await db.delete(eventVoucherCodes).where(sql`true`);
  await db.delete(eventVoucherPdfs).where(sql`true`);
  await db.delete(bookingTickets).where(sql`true`);
}
