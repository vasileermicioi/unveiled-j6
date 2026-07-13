import { describe, expect, test } from "bun:test";
import { createSolidJpeg } from "@unveiled/images";
import { eq } from "drizzle-orm";

import {
  bookings,
  cancelWaitlistEntry,
  createDb,
  createEvent,
  createPartner,
  createTxDb,
  creditLedger,
  deleteEvent,
  deletePartner,
  events,
  joinWaitlist,
  listUserWaitlistEntries,
  processWaitlistForEvent,
  promoteWaitlistEntry,
  subscriptions,
  users,
  WaitlistError,
  waitlistEntries,
} from "../index";

const databaseUrl = process.env.DATABASE_URL;

async function createTestImageBuffer(): Promise<Buffer> {
  return createSolidJpeg(800, 420, { r: 250, g: 255, b: 134 });
}

describe("waitlist domain", () => {
  test("join, duplicate, cancel, list, queue promote, skip, partial capacity, idempotency", async () => {
    if (!databaseUrl) {
      console.warn("Skipping waitlist integration test (DATABASE_URL unset)");
      return;
    }

    const httpDb = createDb(databaseUrl);
    const txDb = createTxDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const image = await createTestImageBuffer();

    const partner = await createPartner(httpDb, {
      name: `Waitlist Venue ${suffix.slice(0, 8)}`,
      address: "Teststraße 9, Berlin",
      contactEmail: `wait-${suffix}@example.com`,
      logoUpload: image,
      skipUpload: true,
    });

    const event = await createEvent(httpDb, {
      partnerId: partner.id,
      title: `Waitlist Event ${suffix.slice(0, 8)}`,
      description: "Description",
      address: "Teststraße 9, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date(Date.now() + 86_400_000),
      creditPrice: 2,
      totalCapacity: 2,
      secretCode: "WAITTEST",
      imageUpload: image,
      skipUpload: true,
    });

    // Start sold out so waitlist is the path (capacity 0).
    await httpDb
      .update(events)
      .set({ remainingCapacity: 0, updatedAt: new Date() })
      .where(eq(events.id, event.id));

    const userA = `wait-a-${suffix}`;
    const userB = `wait-b-${suffix}`;
    const userC = `wait-c-${suffix}`;
    const userSkip = `wait-skip-${suffix}`;

    try {
      for (const [userId, credits, status] of [
        [userA, 10, "ACTIVE"],
        [userB, 10, "ACTIVE"],
        [userC, 10, "ACTIVE"],
        [userSkip, 10, "INACTIVE"],
      ] as const) {
        await httpDb.insert(users).values({
          id: userId,
          email: `${userId}@example.com`,
          emailVerified: true,
          credits,
        });
        await httpDb.insert(subscriptions).values({
          userId,
          status,
          plan: "Basic Berlin",
        });
      }

      // Join + duplicate
      const first = await joinWaitlist(httpDb, {
        userId: userA,
        eventId: event.id,
        requestedQty: 1,
      });
      expect(first.created).toBe(true);
      expect(first.entry.status).toBe("WAITING");

      const dup = await joinWaitlist(httpDb, {
        userId: userA,
        eventId: event.id,
        requestedQty: 2,
      });
      expect(dup.created).toBe(false);
      expect(dup.entry.id).toBe(first.entry.id);
      expect(dup.entry.requestedQty).toBe(1);

      // Second and third waiters (qty 1 each); skip-user joins first in queue after A
      const skipJoin = await joinWaitlist(httpDb, {
        userId: userSkip,
        eventId: event.id,
        requestedQty: 1,
      });
      const joinB = await joinWaitlist(httpDb, {
        userId: userB,
        eventId: event.id,
        requestedQty: 1,
      });
      const joinC = await joinWaitlist(httpDb, {
        userId: userC,
        eventId: event.id,
        requestedQty: 2,
      });
      expect(joinB.created).toBe(true);
      expect(joinC.created).toBe(true);

      // List scoping
      const listA = await listUserWaitlistEntries(httpDb, userA);
      expect(listA.every((e) => e.userId === userA)).toBe(true);
      expect(listA).toHaveLength(1);

      // Forbidden cancel
      await expect(
        cancelWaitlistEntry(httpDb, { entryId: first.entry.id, userId: userB }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      // Owner cancel of C (qty 2) — leave A, skip, B waiting
      const cancelled = await cancelWaitlistEntry(httpDb, {
        entryId: joinC.entry.id,
        userId: userC,
      });
      expect(cancelled.status).toBe("CANCELLED");

      // Free 1 seat — should promote A (earliest eligible), skip inactive, promote B with remaining?
      // remaining after A promote = 0 if we free only 1. Free 2 seats.
      await httpDb
        .update(events)
        .set({ remainingCapacity: 2, updatedAt: new Date() })
        .where(eq(events.id, event.id));

      const processed = await processWaitlistForEvent(txDb, event.id);
      expect(processed.promoted.length).toBe(2);
      expect(processed.skippedEntryIds).toContain(skipJoin.entry.id);

      const entryA = await httpDb.query.waitlistEntries.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, first.entry.id),
      });
      const entrySkip = await httpDb.query.waitlistEntries.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, skipJoin.entry.id),
      });
      const entryB = await httpDb.query.waitlistEntries.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, joinB.entry.id),
      });
      const entryC = await httpDb.query.waitlistEntries.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, joinC.entry.id),
      });

      expect(entryA?.status).toBe("PROMOTED");
      expect(entrySkip?.status).toBe("WAITING");
      expect(entrySkip?.skippedOnce).toBe(true);
      expect(entryB?.status).toBe("PROMOTED");
      expect(entryC?.status).toBe("CANCELLED");

      const bookingCount = await httpDb.query.bookings.findMany({
        where: (fields, { eq: eqOp }) => eqOp(fields.eventId, event.id),
      });
      expect(bookingCount).toHaveLength(2);

      // Idempotent re-promote
      const again = await promoteWaitlistEntry(txDb, first.entry.id);
      expect(again.kind).toBe("already_promoted");

      const bookingsAfterRetry = await httpDb.query.bookings.findMany({
        where: (fields, { eq: eqOp }) => eqOp(fields.eventId, event.id),
      });
      expect(bookingsAfterRetry).toHaveLength(2);

      // Partial capacity: new waiters needing 2 and 1, free only 1 → promote only qty-1
      const userD = `wait-d-${suffix}`;
      const userE = `wait-e-${suffix}`;
      for (const userId of [userD, userE]) {
        await httpDb.insert(users).values({
          id: userId,
          email: `${userId}@example.com`,
          emailVerified: true,
          credits: 10,
        });
        await httpDb.insert(subscriptions).values({
          userId,
          status: "ACTIVE",
          plan: "Basic Berlin",
        });
      }
      const joinD = await joinWaitlist(httpDb, {
        userId: userD,
        eventId: event.id,
        requestedQty: 2,
      });
      const joinE = await joinWaitlist(httpDb, {
        userId: userE,
        eventId: event.id,
        requestedQty: 1,
      });

      await httpDb
        .update(events)
        .set({ remainingCapacity: 1, updatedAt: new Date() })
        .where(eq(events.id, event.id));

      const partial = await processWaitlistForEvent(txDb, event.id);
      expect(partial.promoted).toHaveLength(1);

      const afterD = await httpDb.query.waitlistEntries.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, joinD.entry.id),
      });
      const afterE = await httpDb.query.waitlistEntries.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, joinE.entry.id),
      });
      expect(afterD?.status).toBe("WAITING");
      expect(afterD?.skippedOnce).toBe(false);
      expect(afterE?.status).toBe("PROMOTED");
    } finally {
      const allUsers = [userA, userB, userC, userSkip, `wait-d-${suffix}`, `wait-e-${suffix}`];
      await httpDb.delete(bookings).where(eq(bookings.eventId, event.id));
      await httpDb.delete(waitlistEntries).where(eq(waitlistEntries.eventId, event.id));
      for (const userId of allUsers) {
        await httpDb.delete(creditLedger).where(eq(creditLedger.userId, userId));
        await httpDb.delete(subscriptions).where(eq(subscriptions.userId, userId));
        await httpDb.delete(users).where(eq(users.id, userId));
      }
      await deleteEvent(httpDb, event.id, { skipBucket: true });
      await deletePartner(httpDb, partner.id, { skipBucket: true });
      await txDb.pool.end().catch(() => undefined);
    }
  }, 60_000);

  test("cancel rejects unknown entry", async () => {
    if (!databaseUrl) {
      console.warn("Skipping waitlist cancel-not-found test (DATABASE_URL unset)");
      return;
    }
    const httpDb = createDb(databaseUrl);
    await expect(
      cancelWaitlistEntry(httpDb, {
        entryId: "00000000-0000-0000-0000-000000000099",
        userId: "nobody",
      }),
    ).rejects.toBeInstanceOf(WaitlistError);
  });
});
