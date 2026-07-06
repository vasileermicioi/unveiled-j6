import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { images } from "./images";
import { partners } from "./partners";

export const timingModeEnum = pgEnum("timing_mode", ["TIME_SLOT", "ALL_DAY"]);
export const ticketTypeEnum = pgEnum("ticket_type", ["VOUCHER", "SECRET_CODE"]);
export const secretCodeModeEnum = pgEnum("secret_code_mode", [
  "MANUAL",
  "SHARED_GENERATED",
  "UNIQUE_PER_BOOKING",
]);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partnerId: uuid("partner_id")
      .notNull()
      .references(() => partners.id, { onDelete: "restrict" }),
    partnerName: text("partner_name").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    address: text("address").notNull(),
    neighborhood: text("neighborhood").notNull(),
    imageId: uuid("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "restrict" }),
    category: text("category").notNull(),
    eventType: text("event_type").notNull(),
    tags: text("tags").array().notNull().default([]),
    dateTime: timestamp("date_time", { withTimezone: true, mode: "date" }).notNull(),
    timingMode: timingModeEnum("timing_mode").notNull(),
    startTimeMinutes: integer("start_time_minutes").notNull(),
    weekday: integer("weekday").notNull(),
    creditPrice: integer("credit_price").notNull(),
    totalCapacity: integer("total_capacity").notNull(),
    remainingCapacity: integer("remaining_capacity").notNull(),
    ticketType: ticketTypeEnum("ticket_type").notNull(),
    secretCodeMode: secretCodeModeEnum("secret_code_mode"),
    secretCode: text("secret_code"),
    promoCode: text("promo_code"),
    eventWebsiteUrl: text("event_website_url"),
    barrierFree: boolean("barrier_free"),
    languages: text("languages").array(),
    targetAgeGroups: text("target_age_groups").array(),
    lat: numeric("lat"),
    lng: numeric("lng"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    check("events_remaining_capacity_non_negative", sql`${table.remainingCapacity} >= 0`),
    index("events_date_time_idx").on(table.dateTime),
    index("events_date_time_partner_id_idx").on(table.dateTime, table.partnerId),
    index("events_date_time_category_idx").on(table.dateTime, table.category),
  ],
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type TimingMode = (typeof timingModeEnum.enumValues)[number];
export type TicketType = (typeof ticketTypeEnum.enumValues)[number];
export type SecretCodeMode = (typeof secretCodeModeEnum.enumValues)[number];
