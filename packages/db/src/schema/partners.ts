import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { images } from "./images";
import { users } from "./users";

export const partners = pgTable("partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  contactEmail: text("contact_email").notNull(),
  logoImageId: uuid("logo_image_id").references(() => images.id, { onDelete: "restrict" }),
  venueCheckInToken: text("venue_check_in_token").unique(),
  portalUserId: text("portal_user_id").references(() => users.id, { onDelete: "restrict" }),
  portalUserEmail: text("portal_user_email"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;
