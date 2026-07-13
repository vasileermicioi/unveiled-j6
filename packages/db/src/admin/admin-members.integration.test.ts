import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";

import {
  adjustMemberCredits,
  createDb,
  createTxDb,
  creditLedger,
  getMemberDetail,
  isAdminMemberError,
  listMembers,
  refundMemberCredits,
  subscriptions,
  users,
} from "../index";

const databaseUrl = process.env.DATABASE_URL;

describe("admin members (integration)", () => {
  test("list/search/detail, adjust, refund, and fail-closed paths", async () => {
    if (!databaseUrl) {
      console.warn("Skipping admin members integration test (DATABASE_URL unset)");
      return;
    }

    const httpDb = createDb(databaseUrl);
    const txDb = createTxDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const userA = `admin-a-${suffix}`;
    const userB = `admin-b-${suffix}`;
    const userDeleted = `admin-del-${suffix}`;

    try {
      await httpDb.insert(users).values([
        {
          id: userA,
          email: `zeta-${suffix}@example.com`,
          emailVerified: true,
          credits: 5,
          role: "USER",
          profile: { first_name: "Zara", last_name: "Alpha" },
          behavior: { event_open_count: 3, session_count: 2 },
        },
        {
          id: userB,
          email: `alpha-${suffix}@example.com`,
          emailVerified: true,
          credits: 2,
          role: "USER",
          profile: { first_name: "Ada", last_name: `Beta-${suffix.slice(0, 8)}` },
          behavior: {},
        },
        {
          id: userDeleted,
          email: `gone-${suffix}@example.com`,
          emailVerified: true,
          credits: 0,
          role: "USER",
          deletedAt: new Date(),
          profile: { first_name: "Gone", last_name: "User" },
        },
      ]);

      await httpDb.insert(subscriptions).values([
        {
          userId: userA,
          status: "ACTIVE",
          plan: "Basic Berlin",
          stripeCustomerId: `cus_${userA}`,
          stripeSubscriptionId: `sub_${userA}`,
        },
        {
          userId: userB,
          status: "INACTIVE",
          plan: "Basic Berlin",
        },
      ]);

      const listed = await listMembers(httpDb, { q: suffix, limit: 50 });
      expect(listed.map((m) => m.id)).toEqual([userB, userA]);
      expect(listed.every((m) => m.id !== userDeleted)).toBe(true);
      expect(listed.find((m) => m.id === userA)?.eventOpenCount).toBe(3);
      expect(listed.find((m) => m.id === userA)?.subscriptionStatus).toBe("ACTIVE");

      const byEmail = await listMembers(httpDb, { q: `zeta-${suffix}`, limit: 10 });
      expect(byEmail.map((m) => m.id)).toEqual([userA]);

      const byName = await listMembers(httpDb, {
        q: `Beta-${suffix.slice(0, 8)}`,
        limit: 50,
      });
      expect(byName.map((m) => m.id)).toEqual([userB]);

      const detail = await getMemberDetail(httpDb, userA);
      expect(detail.user.profile.first_name).toBe("Zara");
      expect(detail.subscription?.status).toBe("ACTIVE");
      expect(detail.counts.bookings).toBe(0);
      expect(detail.counts.waitlistEntries).toBe(0);
      expect(detail.counts.savedEvents).toBe(0);
      expect(detail.user.behavior.event_open_count).toBe(3);

      await expect(getMemberDetail(httpDb, userDeleted)).rejects.toMatchObject({
        code: "USER_NOT_FOUND",
      });

      const adjusted = await adjustMemberCredits(txDb, {
        userId: userA,
        amount: 3,
        description: "Support goodwill",
        idempotencyKey: `adj-up-${suffix}`,
      });
      expect(adjusted.credits).toBe(8);
      expect(adjusted.ledgerEntry.type).toBe("ADMIN_ADJUST");
      expect(adjusted.ledgerEntry.balanceAfter).toBe(8);

      const down = await adjustMemberCredits(txDb, {
        userId: userA,
        amount: -2,
        description: "Correction",
        idempotencyKey: `adj-down-${suffix}`,
      });
      expect(down.credits).toBe(6);

      try {
        await adjustMemberCredits(txDb, {
          userId: userA,
          amount: 0,
          description: "noop",
        });
        expect.unreachable("zero adjust should throw");
      } catch (error) {
        expect(isAdminMemberError(error) && error.code === "ZERO_AMOUNT").toBe(true);
      }

      try {
        await adjustMemberCredits(txDb, {
          userId: userA,
          amount: -100,
          description: "too much",
        });
        expect.unreachable("insufficient adjust should throw");
      } catch (error) {
        expect(isAdminMemberError(error) && error.code === "INSUFFICIENT_CREDITS").toBe(true);
      }

      const afterFail = await httpDb.query.users.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, userA),
      });
      expect(afterFail?.credits).toBe(6);

      const refunded = await refundMemberCredits(txDb, {
        userId: userA,
        amount: 4,
        description: "Service complaint refund",
        idempotencyKey: `refund-${suffix}`,
      });
      expect(refunded.credits).toBe(10);
      expect(refunded.ledgerEntry.type).toBe("REFUND");

      const ledger = await httpDb.query.creditLedger.findMany({
        where: (fields, { eq: eqOp }) => eqOp(fields.userId, userA),
      });
      expect(ledger.some((row) => row.type === "ADMIN_ADJUST")).toBe(true);
      expect(ledger.some((row) => row.type === "REFUND")).toBe(true);
    } finally {
      await httpDb.delete(creditLedger).where(eq(creditLedger.userId, userA));
      await httpDb.delete(creditLedger).where(eq(creditLedger.userId, userB));
      await httpDb.delete(subscriptions).where(eq(subscriptions.userId, userA));
      await httpDb.delete(subscriptions).where(eq(subscriptions.userId, userB));
      await httpDb.delete(users).where(eq(users.id, userA));
      await httpDb.delete(users).where(eq(users.id, userB));
      await httpDb.delete(users).where(eq(users.id, userDeleted));
      await txDb.pool.end().catch(() => undefined);
    }
  });
});
