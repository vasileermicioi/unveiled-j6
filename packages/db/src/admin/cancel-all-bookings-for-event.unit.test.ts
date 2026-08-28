import { describe, expect, test } from "bun:test";

import type { TxDb } from "../index";
import { cancelAllBookingsForEvent } from "./cancel-all-bookings-for-event";

describe("cancelAllBookingsForEvent", () => {
  test("rejects empty reason before touching the db", async () => {
    const fakeDb = {} as TxDb;
    await expect(
      cancelAllBookingsForEvent(fakeDb, {
        eventId: "e1",
        reason: "   ",
        adminUserId: "admin-1",
      }),
    ).rejects.toMatchObject({ code: "INVALID_REASON" });
  });
});
