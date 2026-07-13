import { describe, expect, test } from "bun:test";

import type { TxDb } from "../index";
import { cancelBookingAsAdmin } from "./cancel-booking-as-admin";
import { createCompTicket } from "./create-comp-ticket";
import { AdminCapacityError, isAdminCapacityError } from "./errors";

describe("admin capacity ops helpers", () => {
  test("isAdminCapacityError narrows", () => {
    const err = new AdminCapacityError("NOT_CONFIRMED", "nope");
    expect(isAdminCapacityError(err)).toBe(true);
    expect(isAdminCapacityError(new Error("nope"))).toBe(false);
  });

  test("cancelBookingAsAdmin rejects empty reason before touching the db", async () => {
    const fakeDb = {} as TxDb;
    await expect(
      cancelBookingAsAdmin(fakeDb, {
        bookingId: "b1",
        reason: "   ",
        adminUserId: "admin-1",
      }),
    ).rejects.toMatchObject({ code: "INVALID_REASON" });
  });

  test("createCompTicket requires idempotencyKey via bookEvent (empty key rejects)", async () => {
    const fakeDb = {} as TxDb;
    await expect(
      createCompTicket(fakeDb, {
        userId: "u1",
        eventId: "e1",
        idempotencyKey: "  ",
        adminUserId: "admin-1",
      }),
    ).rejects.toMatchObject({ code: "INVALID_TICKET_COUNT" });
  });
});
