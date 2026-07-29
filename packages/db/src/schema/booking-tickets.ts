import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { bookings } from "./bookings";

/**
 * One redemption artifact per ticket on a booking (ordinal 1..N).
 * `voucher_pdf_id` is a nullable uuid without FK here to avoid a circular FK with
 * `event_voucher_pdfs.booking_ticket_id` (inventory owns the allocation pointer).
 */
export const bookingTickets = pgTable(
  "booking_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    ordinal: integer("ordinal").notNull(),
    redemptionCode: text("redemption_code"),
    redemptionUrl: text("redemption_url"),
    voucherPdfId: uuid("voucher_pdf_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("booking_tickets_booking_id_ordinal_uidx").on(table.bookingId, table.ordinal),
  ],
);

export type BookingTicket = typeof bookingTickets.$inferSelect;
export type NewBookingTicket = typeof bookingTickets.$inferInsert;
