import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const creditLedgerTypeEnum = pgEnum("credit_ledger_type", [
  "SUBSCRIPTION_REFILL",
  "BOOKING",
  "EXPIRY",
  "REFUND",
  "ADMIN_ADJUST",
]);

export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    amount: integer("amount").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    type: creditLedgerTypeEnum("type").notNull(),
    description: text("description").notNull(),
    idempotencyKey: text("idempotency_key"),
    timestamp: timestamp("timestamp", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("credit_ledger_idempotency_key_uidx")
      .on(table.idempotencyKey)
      .where(sql`${table.idempotencyKey} IS NOT NULL`),
    index("credit_ledger_user_id_timestamp_idx").on(table.userId, table.timestamp),
  ],
);

export type CreditLedgerEntry = typeof creditLedger.$inferSelect;
export type NewCreditLedgerEntry = typeof creditLedger.$inferInsert;
export type CreditLedgerType = (typeof creditLedgerTypeEnum.enumValues)[number];
