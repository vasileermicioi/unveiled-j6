import { describe, expect, test } from "bun:test";

import type { TxDb } from "../index";
import { adjustMemberCredits } from "./adjust-member-credits";
import { AdminMemberError, isAdminMemberError } from "./errors";
import { refundMemberCredits } from "./refund-member-credits";

describe("admin member helpers", () => {
  test("isAdminMemberError narrows", () => {
    const err = new AdminMemberError("ZERO_AMOUNT", "zero");
    expect(isAdminMemberError(err)).toBe(true);
    expect(isAdminMemberError(new Error("nope"))).toBe(false);
  });

  test("adjustMemberCredits rejects zero before touching the db", async () => {
    const fakeDb = {} as TxDb;
    await expect(
      adjustMemberCredits(fakeDb, {
        userId: "u1",
        amount: 0,
        description: "noop",
      }),
    ).rejects.toMatchObject({ code: "ZERO_AMOUNT" });
  });

  test("adjustMemberCredits rejects empty description before touching the db", async () => {
    const fakeDb = {} as TxDb;
    await expect(
      adjustMemberCredits(fakeDb, {
        userId: "u1",
        amount: 1,
        description: "   ",
      }),
    ).rejects.toMatchObject({ code: "INVALID_DESCRIPTION" });
  });

  test("refundMemberCredits rejects non-positive amount before touching the db", async () => {
    const fakeDb = {} as TxDb;
    await expect(
      refundMemberCredits(fakeDb, {
        userId: "u1",
        amount: 0,
        description: "refund",
      }),
    ).rejects.toMatchObject({ code: "INVALID_AMOUNT" });

    await expect(
      refundMemberCredits(fakeDb, {
        userId: "u1",
        amount: -2,
        description: "refund",
      }),
    ).rejects.toBeInstanceOf(AdminMemberError);
  });
});
