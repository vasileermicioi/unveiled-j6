import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "ACTIVE",
  "CANCELLED_PENDING",
  "INACTIVE",
  "PAST_DUE",
  "UNPAID",
]);

export const paymentMethodEnum = pgEnum("payment_method", ["CARD", "PAYPAL", "SEPA"]);

export const subscriptions = pgTable("subscriptions", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "restrict" }),
  status: subscriptionStatusEnum("status").notNull().default("INACTIVE"),
  periodEnd: timestamp("period_end", { withTimezone: true, mode: "date" }),
  plan: text("plan"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  paymentMethod: paymentMethodEnum("payment_method"),
  billingAddress: text("billing_address"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
