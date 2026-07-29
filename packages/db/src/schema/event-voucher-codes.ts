import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { bookingTickets } from "./booking-tickets";
import { events } from "./events";

export const voucherInventoryStatusEnum = pgEnum("voucher_inventory_status", [
  "AVAILABLE",
  "ALLOCATED",
]);

export const eventVoucherCodes = pgTable(
  "event_voucher_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "restrict" }),
    code: text("code").notNull(),
    status: voucherInventoryStatusEnum("status").notNull().default("AVAILABLE"),
    bookingTicketId: uuid("booking_ticket_id").references(() => bookingTickets.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("event_voucher_codes_event_id_code_uidx").on(table.eventId, table.code),
    index("event_voucher_codes_event_id_status_idx").on(table.eventId, table.status),
  ],
);

export type EventVoucherCode = typeof eventVoucherCodes.$inferSelect;
export type NewEventVoucherCode = typeof eventVoucherCodes.$inferInsert;
export type VoucherInventoryStatus = (typeof voucherInventoryStatusEnum.enumValues)[number];
