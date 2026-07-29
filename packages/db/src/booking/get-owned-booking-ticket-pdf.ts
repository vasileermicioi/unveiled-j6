import { and, eq } from "drizzle-orm";

import type { Db } from "../index";
import { bookingTickets } from "../schema/booking-tickets";
import { bookings } from "../schema/bookings";
import { eventVoucherPdfs } from "../schema/event-voucher-pdfs";

export type GetOwnedBookingTicketPdfInput = {
  userId: string;
  bookingId: string;
  ticketId: string;
};

export type OwnedBookingTicketPdf = {
  bookingId: string;
  ticketId: string;
  ordinal: number;
  objectKey: string;
  originalFilename: string | null;
  pageLabel: string | null;
};

/**
 * Resolve a PDF voucher for download when the session user owns the booking.
 * Returns null when the booking/ticket/PDF is missing, not owned, or not a PDF ticket.
 */
export async function getOwnedBookingTicketPdf(
  db: Db,
  input: GetOwnedBookingTicketPdfInput,
): Promise<OwnedBookingTicketPdf | null> {
  const [row] = await db
    .select({
      bookingId: bookings.id,
      ticketId: bookingTickets.id,
      ordinal: bookingTickets.ordinal,
      objectKey: eventVoucherPdfs.objectKey,
      originalFilename: eventVoucherPdfs.originalFilename,
      pageLabel: eventVoucherPdfs.pageLabel,
    })
    .from(bookings)
    .innerJoin(bookingTickets, eq(bookingTickets.bookingId, bookings.id))
    .innerJoin(eventVoucherPdfs, eq(eventVoucherPdfs.id, bookingTickets.voucherPdfId))
    .where(
      and(
        eq(bookings.id, input.bookingId),
        eq(bookings.userId, input.userId),
        eq(bookingTickets.id, input.ticketId),
      ),
    )
    .limit(1);

  return row ?? null;
}
