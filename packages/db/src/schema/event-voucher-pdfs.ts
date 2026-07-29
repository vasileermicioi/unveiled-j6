import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { bookingTickets } from "./booking-tickets";
import { voucherInventoryStatusEnum } from "./event-voucher-codes";
import { events } from "./events";

export const eventVoucherPdfs = pgTable(
  "event_voucher_pdfs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "restrict" }),
    objectKey: text("object_key").notNull(),
    originalFilename: text("original_filename"),
    pageLabel: text("page_label"),
    status: voucherInventoryStatusEnum("status").notNull().default("AVAILABLE"),
    bookingTicketId: uuid("booking_ticket_id").references(() => bookingTickets.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("event_voucher_pdfs_event_id_object_key_uidx").on(table.eventId, table.objectKey),
    index("event_voucher_pdfs_event_id_status_idx").on(table.eventId, table.status),
  ],
);

export type EventVoucherPdf = typeof eventVoucherPdfs.$inferSelect;
export type NewEventVoucherPdf = typeof eventVoucherPdfs.$inferInsert;
