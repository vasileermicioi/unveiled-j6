import { describe, expect, test } from "bun:test";

import { isWaitlistError, WaitlistError } from "./errors";
import { joinWaitlist, type WaitlistDb } from "./join-waitlist";
import { waitlistPromoteIdempotencyKey } from "./promote-waitlist-entry";

describe("waitlist helpers", () => {
  test("idempotency key is stable per entry", () => {
    expect(waitlistPromoteIdempotencyKey("abc")).toBe("waitlist-promote:abc");
  });

  test("isWaitlistError narrows", () => {
    const err = new WaitlistError("NOT_FOUND", "missing");
    expect(isWaitlistError(err)).toBe(true);
    expect(isWaitlistError(new Error("nope"))).toBe(false);
  });

  test("joinWaitlist rejects invalid qty before touching the db", async () => {
    const fakeDb = {} as WaitlistDb;
    await expect(
      joinWaitlist(fakeDb, {
        userId: "u1",
        eventId: "00000000-0000-0000-0000-000000000001",
        requestedQty: 0,
      }),
    ).rejects.toMatchObject({ code: "INVALID_QTY" });

    await expect(
      joinWaitlist(fakeDb, {
        userId: "u1",
        eventId: "00000000-0000-0000-0000-000000000001",
        requestedQty: 4,
      }),
    ).rejects.toBeInstanceOf(WaitlistError);
  });
});
