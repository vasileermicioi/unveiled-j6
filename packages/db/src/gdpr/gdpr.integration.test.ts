import { describe, expect, test } from "bun:test";
import { createSolidJpeg } from "@unveiled/images";
import { eq } from "drizzle-orm";

import {
  anonymizeUserAccount,
  bookings,
  buildUserDataExport,
  createDb,
  createEvent,
  createPartner,
  createTxDb,
  creditLedger,
  deletedEmailPlaceholder,
  deleteEvent,
  deletePartner,
  isGdprError,
  savedEvents,
  subscriptions,
  users,
  waitlistEntries,
} from "../index";

const databaseUrl = process.env.DATABASE_URL;

async function createTestImageBuffer(): Promise<Buffer> {
  return createSolidJpeg(800, 420, { r: 250, g: 255, b: 134 });
}

describe("gdpr domain (integration)", () => {
  test("export shape, anonymize, retention, already-deleted, auth/cancel mocks", async () => {
    if (!databaseUrl) {
      console.warn("Skipping GDPR integration test (DATABASE_URL unset)");
      return;
    }

    const httpDb = createDb(databaseUrl);
    const txDb = createTxDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const userId = `gdpr-${suffix}`;
    const adminId = `gdpr-admin-${suffix}`;
    const image = await createTestImageBuffer();

    const partner = await createPartner(httpDb, {
      name: `GDPR Venue ${suffix.slice(0, 8)}`,
      address: "Teststraße 9, Berlin",
      contactEmail: `gdpr-${suffix}@example.com`,
      logoUpload: image,
      skipUpload: true,
    });

    const event = await createEvent(httpDb, {
      partnerId: partner.id,
      title: `GDPR Event ${suffix.slice(0, 8)}`,
      description: "Description",
      address: "Teststraße 9, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date(Date.now() + 86_400_000),
      creditPrice: 2,
      totalCapacity: 5,
      secretCode: "GDPRTEST",
      imageUpload: image,
      skipUpload: true,
    });

    const authCalls: string[] = [];
    const cancelCalls: Array<{ stripeSubscriptionId: string }> = [];

    try {
      await httpDb.insert(users).values({
        id: userId,
        email: `${userId}@example.com`,
        emailVerified: true,
        credits: 10,
        role: "USER",
        profile: {
          first_name: "Ada",
          last_name: "Lovelace",
          interests: ["Theater"],
          onboarding_complete: true,
        },
        behavior: {
          session_count: 4,
          recent_event_ids: [event.id],
          last_filter: { category: "Theater", result_count: 1 },
        },
      });
      await httpDb.insert(users).values({
        id: adminId,
        email: `${adminId}@example.com`,
        emailVerified: true,
        credits: 0,
        role: "ADMIN",
      });
      await httpDb.insert(subscriptions).values({
        userId,
        status: "ACTIVE",
        plan: "Basic Berlin",
        stripeCustomerId: `cus_${userId}`,
        stripeSubscriptionId: `sub_${userId}`,
      });
      await httpDb.insert(creditLedger).values({
        userId,
        amount: 10,
        balanceAfter: 10,
        type: "SUBSCRIPTION_REFILL",
        description: "Starter",
      });
      await httpDb.insert(bookings).values({
        userId,
        eventId: event.id,
        partnerId: partner.id,
        ticketsCount: 1,
        totalCredits: 2,
        status: "CONFIRMED",
        redemptionType: "SECRET_CODE",
        redemptionInfo: "GDPRTEST",
        idempotencyKey: `gdpr-book-${suffix}`,
      });
      await httpDb.insert(savedEvents).values({
        userId,
        eventId: event.id,
      });
      await httpDb.insert(waitlistEntries).values({
        userId,
        eventId: event.id,
        requestedQty: 1,
        status: "WAITING",
      });

      const exported = await buildUserDataExport(httpDb, userId);
      expect(exported.user.email).toBe(`${userId}@example.com`);
      expect(exported.user.profile.first_name).toBe("Ada");
      expect(exported.bookings).toHaveLength(1);
      expect(exported.bookings[0]?.redemptionInfo).toBe("GDPRTEST");
      expect(exported.creditLedger).toHaveLength(1);
      expect(exported.creditLedger[0]?.type).toBe("SUBSCRIPTION_REFILL");
      expect(typeof exported.exportedAt).toBe("string");

      const result = await anonymizeUserAccount(txDb, {
        userId,
        actor: "admin",
        adminId,
        disableAuthUser: async ({ userId: id }) => {
          authCalls.push(id);
        },
        cancelSubscription: async (args) => {
          cancelCalls.push({ stripeSubscriptionId: args.stripeSubscriptionId });
        },
      });

      expect(result.userId).toBe(userId);
      expect(result.actor).toBe("admin");
      expect(result.adminId).toBe(adminId);
      expect(result.deletedAt).toBeInstanceOf(Date);
      expect(authCalls).toEqual([userId]);
      expect(cancelCalls).toEqual([{ stripeSubscriptionId: `sub_${userId}` }]);

      const after = await httpDb.query.users.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, userId),
      });
      expect(after?.email).toBe(deletedEmailPlaceholder(userId));
      expect(after?.emailVerified).toBe(false);
      expect(after?.deletedAt).not.toBeNull();
      expect(after?.profile).toEqual({});
      expect(after?.behavior).toEqual({});

      const retainedBookings = await httpDb
        .select()
        .from(bookings)
        .where(eq(bookings.userId, userId));
      expect(retainedBookings).toHaveLength(1);

      const retainedLedger = await httpDb
        .select()
        .from(creditLedger)
        .where(eq(creditLedger.userId, userId));
      expect(retainedLedger).toHaveLength(1);

      const saved = await httpDb.select().from(savedEvents).where(eq(savedEvents.userId, userId));
      expect(saved).toHaveLength(0);

      const waitlist = await httpDb
        .select()
        .from(waitlistEntries)
        .where(eq(waitlistEntries.userId, userId));
      expect(waitlist).toHaveLength(0);

      await expect(buildUserDataExport(httpDb, userId)).rejects.toMatchObject({
        code: "ALREADY_DELETED",
      });

      const authCallsBeforeSecond = authCalls.length;
      const cancelCallsBeforeSecond = cancelCalls.length;
      try {
        await anonymizeUserAccount(txDb, {
          userId,
          actor: "self",
          disableAuthUser: async ({ userId: id }) => {
            authCalls.push(id);
          },
          cancelSubscription: async (args) => {
            cancelCalls.push({ stripeSubscriptionId: args.stripeSubscriptionId });
          },
        });
        expect.unreachable("second anonymize should throw");
      } catch (error) {
        expect(isGdprError(error)).toBe(true);
        if (isGdprError(error)) {
          expect(error.code).toBe("ALREADY_DELETED");
        }
      }
      expect(authCalls.length).toBe(authCallsBeforeSecond);
      expect(cancelCalls.length).toBe(cancelCallsBeforeSecond);

      // Billing-only cancel must not set deleted_at (regression on a fresh user).
      const cancelOnlyUser = `gdpr-cancel-only-${suffix}`;
      await httpDb.insert(users).values({
        id: cancelOnlyUser,
        email: `${cancelOnlyUser}@example.com`,
        emailVerified: true,
        credits: 5,
      });
      await httpDb.insert(subscriptions).values({
        userId: cancelOnlyUser,
        status: "ACTIVE",
        plan: "Basic Berlin",
        stripeCustomerId: `cus_${cancelOnlyUser}`,
        stripeSubscriptionId: `sub_${cancelOnlyUser}`,
      });
      // Simulate billing cancel side effect without anonymize:
      await httpDb
        .update(subscriptions)
        .set({ status: "CANCELLED_PENDING", updatedAt: new Date() })
        .where(eq(subscriptions.userId, cancelOnlyUser));
      const cancelOnlyAfter = await httpDb.query.users.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, cancelOnlyUser),
      });
      expect(cancelOnlyAfter?.deletedAt).toBeNull();
      expect(cancelOnlyAfter?.email).toBe(`${cancelOnlyUser}@example.com`);

      await expect(
        anonymizeUserAccount(txDb, {
          userId: "missing-user",
          actor: "self",
          disableAuthUser: async () => undefined,
        }),
      ).rejects.toMatchObject({ code: "USER_NOT_FOUND" });

      await expect(
        anonymizeUserAccount(txDb, {
          userId: cancelOnlyUser,
          actor: "admin",
          disableAuthUser: async () => undefined,
        }),
      ).rejects.toMatchObject({ code: "INVALID_ACTOR" });
    } finally {
      await httpDb.delete(waitlistEntries).where(eq(waitlistEntries.userId, userId));
      await httpDb.delete(savedEvents).where(eq(savedEvents.userId, userId));
      await httpDb.delete(bookings).where(eq(bookings.userId, userId));
      await httpDb.delete(creditLedger).where(eq(creditLedger.userId, userId));
      await httpDb.delete(subscriptions).where(eq(subscriptions.userId, userId));
      await httpDb.delete(users).where(eq(users.id, userId));

      await httpDb
        .delete(subscriptions)
        .where(eq(subscriptions.userId, `gdpr-cancel-only-${suffix}`));
      await httpDb.delete(users).where(eq(users.id, `gdpr-cancel-only-${suffix}`));
      await httpDb.delete(users).where(eq(users.id, adminId));

      await deleteEvent(httpDb, event.id, { skipBucket: true });
      await deletePartner(httpDb, partner.id, { skipBucket: true });
      await txDb.pool.end().catch(() => undefined);
    }
  });

  test("self actor anonymize calls Auth disable once", async () => {
    if (!databaseUrl) {
      console.warn("Skipping GDPR self-actor integration test (DATABASE_URL unset)");
      return;
    }

    const httpDb = createDb(databaseUrl);
    const txDb = createTxDb(databaseUrl);
    const userId = `gdpr-self-${crypto.randomUUID()}`;
    const authCalls: string[] = [];

    try {
      await httpDb.insert(users).values({
        id: userId,
        email: `${userId}@example.com`,
        emailVerified: true,
        credits: 3,
        profile: { first_name: "Self" },
      });
      await httpDb.insert(subscriptions).values({
        userId,
        status: "INACTIVE",
        plan: "Basic Berlin",
      });

      await anonymizeUserAccount(txDb, {
        userId,
        actor: "self",
        disableAuthUser: async ({ userId: id }) => {
          authCalls.push(id);
        },
        cancelSubscription: async () => {
          throw new Error("cancel should not run for INACTIVE without Stripe id");
        },
      });

      expect(authCalls).toEqual([userId]);
    } finally {
      await httpDb.delete(subscriptions).where(eq(subscriptions.userId, userId));
      await httpDb.delete(users).where(eq(users.id, userId));
      await txDb.pool.end().catch(() => undefined);
    }
  });
});
