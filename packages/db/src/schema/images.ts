import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const imageSourceEnum = pgEnum("image_source", ["UPLOAD", "REMOTE_URL"]);

export const images = pgTable("images", {
  id: uuid("id").primaryKey().defaultRandom(),
  originalWidth: integer("original_width").notNull(),
  originalHeight: integer("original_height").notNull(),
  source: imageSourceEnum("source").notNull(),
  sourceUrl: text("source_url"),
  uploadedBy: text("uploaded_by").references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
export type ImageSource = (typeof imageSourceEnum.enumValues)[number];
