import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN", "PARTNER"]);

export type AgeGroup = "18-25" | "26-35" | "36-50" | "50+";
export type ProfileLanguage = "DE" | "EN";

export type UserProfile = {
  first_name?: string | null;
  last_name?: string | null;
  age_group?: AgeGroup | null;
  interests?: string[] | null;
  moods?: string[] | null;
  districts?: string[] | null;
  timing?: string[] | null;
  preferred_days?: string[] | null;
  preferred_languages?: string[] | null;
  max_distance?: number | null;
  accessibility?: boolean | null;
  language?: ProfileLanguage | null;
  onboarding_complete?: boolean | null;
};

export type UserBehaviorFilter = {
  category?: string | null;
  partner?: string | null;
  date_range?: string | null;
  result_count?: number | null;
  applied_at?: string | null;
};

export type UserBehavior = {
  session_count?: number;
  event_open_count?: number;
  booking_count?: number;
  waitlist_count?: number;
  saved_count?: number;
  unsaved_count?: number;
  filter_apply_count?: number;
  view_counts?: Record<string, number>;
  recent_event_ids?: string[];
  last_seen_at?: string | null;
  last_view?: string | null;
  last_opened_event_id?: string | null;
  last_booked_event_id?: string | null;
  last_waitlisted_event_id?: string | null;
  last_saved_event_id?: string | null;
  onboarding_completed_at?: string | null;
  preferences_updated_at?: string | null;
  last_filter?: UserBehaviorFilter | null;
};

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    role: userRoleEnum("role").notNull().default("USER"),
    credits: integer("credits").notNull().default(0),
    partnerId: text("partner_id"),
    profile: jsonb("profile").$type<UserProfile>().notNull().default({}),
    behavior: jsonb("behavior").$type<UserBehavior>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [check("users_credits_non_negative", sql`${table.credits} >= 0`)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
