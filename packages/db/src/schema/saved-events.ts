import { index, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { events } from "./events";
import { users } from "./users";

export const savedEvents = pgTable(
  "saved_events",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.eventId] }),
    index("saved_events_user_id_idx").on(table.userId),
  ],
);

export type SavedEvent = typeof savedEvents.$inferSelect;
export type NewSavedEvent = typeof savedEvents.$inferInsert;
