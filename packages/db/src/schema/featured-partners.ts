import { boolean, integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { partners } from "./partners";

export const featuredPartners = pgTable("featured_partners", {
  partnerId: uuid("partner_id")
    .primaryKey()
    .references(() => partners.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull(),
  /** Unused on public Discover. Default unpublished. */
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export type FeaturedPartner = typeof featuredPartners.$inferSelect;
export type NewFeaturedPartner = typeof featuredPartners.$inferInsert;
