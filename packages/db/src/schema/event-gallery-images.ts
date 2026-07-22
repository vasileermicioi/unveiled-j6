import { index, integer, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { events } from "./events";
import { images } from "./images";

export const eventGalleryImages = pgTable(
  "event_gallery_images",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    imageId: uuid("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "restrict" }),
    sortOrder: integer("sort_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.eventId, table.imageId] }),
    index("event_gallery_images_event_id_sort_order_idx").on(table.eventId, table.sortOrder),
  ],
);

export type EventGalleryImage = typeof eventGalleryImages.$inferSelect;
export type NewEventGalleryImage = typeof eventGalleryImages.$inferInsert;
