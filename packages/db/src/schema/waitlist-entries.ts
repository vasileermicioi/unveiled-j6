import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { events } from "./events";
import { users } from "./users";

export const waitlistStatusEnum = pgEnum("waitlist_status", ["WAITING", "PROMOTED", "CANCELLED"]);

export const waitlistEntries = pgTable(
  "waitlist_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "restrict" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    requestedQty: integer("requested_qty").notNull(),
    status: waitlistStatusEnum("status").notNull(),
    skippedOnce: boolean("skipped_once").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("waitlist_entries_event_id_created_at_idx").on(table.eventId, table.createdAt),
    index("waitlist_entries_user_id_created_at_idx").on(table.userId, table.createdAt),
    uniqueIndex("waitlist_entries_user_event_waiting_uidx")
      .on(table.userId, table.eventId)
      .where(sql`${table.status} = 'WAITING'`),
  ],
);

export type WaitlistEntry = typeof waitlistEntries.$inferSelect;
export type NewWaitlistEntry = typeof waitlistEntries.$inferInsert;
export type WaitlistStatus = (typeof waitlistStatusEnum.enumValues)[number];
