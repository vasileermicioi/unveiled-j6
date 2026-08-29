import { boolean, integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { events } from "./events";

export const featuredEvents = pgTable("featured_events", {
  eventId: uuid("event_id")
    .primaryKey()
    .references(() => events.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull(),
  /** Unused on public Discover (catalog `events.published` gates visibility). Default unpublished. */
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export type FeaturedEvent = typeof featuredEvents.$inferSelect;
export type NewFeaturedEvent = typeof featuredEvents.$inferInsert;
