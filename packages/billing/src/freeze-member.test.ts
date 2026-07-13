import { describe, expect, test } from "bun:test";
import { createDb, createTxDb, eq, subscriptions, users } from "@unveiled/db";

import {
  FreezeMemberError,
  freezeMember,
  isFreezeMemberError,
  unfreezeMember,
} from "./freeze-member";

describe("freezeMember helpers", () => {
  test("isFreezeMemberError narrows", () => {
    const err = new FreezeMemberError("INVALID_STATUS", "bad");
    expect(isFreezeMemberError(err)).toBe(true);
    expect(isFreezeMemberError(new Error("nope"))).toBe(false);
  });
});

describe("freezeMember / unfreezeMember (integration)", () => {
  const databaseUrl = process.env.DATABASE_URL;

  test("freeze ACTIVE→UNPAID preserves Stripe ids; unfreeze restores ACTIVE", async () => {
    if (!databaseUrl) {
      console.warn("Skipping freezeMember integration test (DATABASE_URL unset)");
      return;
    }

    const httpDb = createDb(databaseUrl);
    const txDb = createTxDb(databaseUrl);
    const userId = `freeze-test-${crypto.randomUUID()}`;
    const stripeCustomerId = `cus_${userId}`;
    const stripeSubscriptionId = `sub_${userId}`;

    try {
      await httpDb.insert(users).values({
        id: userId,
        email: `${userId}@example.com`,
        emailVerified: true,
        credits: 17,
      });
      await httpDb.insert(subscriptions).values({
        userId,
        status: "ACTIVE",
        plan: "Basic Berlin",
        paymentMethod: "CARD",
        billingAddress: "Berlin",
        stripeCustomerId,
        stripeSubscriptionId,
        periodEnd: new Date("2030-06-01T00:00:00.000Z"),
      });

      const frozen = await freezeMember(txDb, { userId });
      expect(frozen.status).toBe("UNPAID");
      expect(frozen.stripeCustomerId).toBe(stripeCustomerId);
      expect(frozen.stripeSubscriptionId).toBe(stripeSubscriptionId);
      expect(frozen.plan).toBe("Basic Berlin");
      expect(frozen.paymentMethod).toBe("CARD");
      expect(frozen.billingAddress).toBe("Berlin");

      try {
        await freezeMember(txDb, { userId });
        expect.unreachable("second freeze should fail");
      } catch (error) {
        expect(isFreezeMemberError(error) && error.code === "INVALID_STATUS").toBe(true);
      }

      const unfrozen = await unfreezeMember(txDb, { userId });
      expect(unfrozen.status).toBe("ACTIVE");
      expect(unfrozen.stripeCustomerId).toBe(stripeCustomerId);
      expect(unfrozen.stripeSubscriptionId).toBe(stripeSubscriptionId);

      try {
        await unfreezeMember(txDb, { userId });
        expect.unreachable("second unfreeze should fail");
      } catch (error) {
        expect(isFreezeMemberError(error) && error.code === "INVALID_STATUS").toBe(true);
      }
    } finally {
      await httpDb.delete(subscriptions).where(eq(subscriptions.userId, userId));
      await httpDb.delete(users).where(eq(users.id, userId));
      await txDb.pool.end().catch(() => undefined);
    }
  });
});
