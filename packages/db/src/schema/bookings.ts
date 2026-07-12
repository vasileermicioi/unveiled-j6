import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { events, ticketTypeEnum } from "./events";
import { partners } from "./partners";
import { users } from "./users";

export const bookingStatusEnum = pgEnum("booking_status", [
  "CONFIRMED",
  "WAITLIST",
  "CANCELLED",
  "USED",
]);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "restrict" }),
    partnerId: uuid("partner_id")
      .notNull()
      .references(() => partners.id, { onDelete: "restrict" }),
    ticketsCount: integer("tickets_count").notNull(),
    totalCredits: integer("total_credits").notNull(),
    status: bookingStatusEnum("status").notNull(),
    redemptionType: ticketTypeEnum("redemption_type"),
    redemptionInfo: text("redemption_info"),
    redemptionUrl: text("redemption_url"),
    idempotencyKey: text("idempotency_key").notNull(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true, mode: "date" }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: "date" }),
    cancellationReason: text("cancellation_reason"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("bookings_user_id_idempotency_key_uidx").on(table.userId, table.idempotencyKey),
    index("bookings_user_id_created_at_idx").on(table.userId, table.createdAt),
    index("bookings_partner_id_created_at_idx").on(table.partnerId, table.createdAt),
    index("bookings_event_id_idx").on(table.eventId),
  ],
);

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];
