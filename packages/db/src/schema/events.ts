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
export const ticketTypeEnum = pgEnum("ticket_type", [
  "SECRET_CODE",
  "VOUCHER_PROMO",
  "VOUCHER_PDF",
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
    street: text("street").notNull(),
    houseNumber: text("house_number").notNull(),
    addressLine2: text("address_line2"),
    country: text("country").notNull().default("DE"),
    city: text("city").notNull().default("berlin"),
    zipCode: text("zip_code").notNull(),
    imageId: uuid("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "restrict" }),
    category: text("category").notNull(),
    eventType: text("event_type").notNull(),
    tags: text("tags").array().notNull().default([]),
    /**
     * Full sorted unique list of occurrence instants.
     * `dateTime` is the denormalized primary/next instant derived from this list on write.
     */
    dateTimes: timestamp("date_times", { withTimezone: true, mode: "date" }).array().notNull(),
    /** Next upcoming instant in `dateTimes`, or earliest when all are past. */
    dateTime: timestamp("date_time", { withTimezone: true, mode: "date" }).notNull(),
    timingMode: timingModeEnum("timing_mode").notNull(),
    startTimeMinutes: integer("start_time_minutes").notNull(),
    weekday: integer("weekday").notNull(),
    creditPrice: integer("credit_price").notNull(),
    totalCapacity: integer("total_capacity").notNull(),
    remainingCapacity: integer("remaining_capacity").notNull(),
    ticketType: ticketTypeEnum("ticket_type").notNull(),
    secretCode: text("secret_code"),
    /** @deprecated Unused for new writes; legacy migration seed only. Prefer event_voucher_codes. */
    promoCode: text("promo_code"),
    eventWebsiteUrl: text("event_website_url"),
    barrierFree: boolean("barrier_free"),
    languageIndependent: boolean("language_independent").notNull().default(false),
    languages: text("languages").array(),
    /** When true, `subtitle_language` MUST be an allowlisted code; when false, language is null. */
    hasSubtitles: boolean("has_subtitles").notNull().default(false),
    /** Single subtitle language code (same allowlist as spoken event languages); null when off. */
    subtitleLanguage: text("subtitle_language"),
    lat: numeric("lat"),
    lng: numeric("lng"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    check("events_remaining_capacity_non_negative", sql`${table.remainingCapacity} >= 0`),
    check("events_date_times_non_empty", sql`cardinality(${table.dateTimes}) >= 1`),
    index("events_date_time_idx").on(table.dateTime),
    index("events_date_time_partner_id_idx").on(table.dateTime, table.partnerId),
    index("events_date_time_category_idx").on(table.dateTime, table.category),
  ],
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type TimingMode = (typeof timingModeEnum.enumValues)[number];
export type TicketType = (typeof ticketTypeEnum.enumValues)[number];
