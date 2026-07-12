import { describe, expect, test } from "bun:test";
import { getTableName } from "drizzle-orm";
import { bookings, creditLedger } from "../schema";

describe("Phase 6 schema exports", () => {
  test("exports bookings and creditLedger tables", () => {
    expect(getTableName(bookings)).toBe("bookings");
    expect(getTableName(creditLedger)).toBe("credit_ledger");
  });
});
