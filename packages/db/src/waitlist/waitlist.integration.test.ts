import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { createEvent, setEventPublished } from "../catalog/events";
import { createTestImagePrebuilt } from "../catalog/test-image";
import { structuredLocationFromAddress } from "../catalog/test-location";
import { createPublishedEvent } from "../catalog/test-published-event";

import {
  bookEvent,
  bookings,
  cancelWaitlistEntry,
  createDb,
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
  purgeBookingTicketsForBookings,
  subscriptions,
  users,
  WaitlistError,
  waitlistEntries,
} from "../index";

const databaseUrl = process.env.DATABASE_URL;

async function createTestImage() {
  return createTestImagePrebuilt();
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
    const partnerImage = await createTestImage();
    const eventImage = await createTestImage();

    const partner = await createPartner(httpDb, {
      name: `Waitlist Venue ${suffix.slice(0, 8)}`,
      ...structuredLocationFromAddress("Teststraße 9, Berlin"),
      contactEmail: `wait-${suffix}@example.com`,
      logoPrebuilt: partnerImage,
      skipUpload: true,
    });

    const event = await createPublishedEvent(httpDb, {
      partnerId: partner.id,
      title: `Waitlist Event ${suffix.slice(0, 8)}`,
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 9, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date(Date.now() + 86_400_000)],
      creditPrice: 2,
      totalCapacity: 2,
      secretCode: "WAITTEST",
      imagePrebuilt: eventImage,
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
        requestedQty: 1,
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
        requestedQty: 1,
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
        requestedQty: 1,
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
      expect(afterD?.status).toBe("PROMOTED");
      expect(afterE?.status).toBe("WAITING");
    } finally {
      const allUsers = [userA, userB, userC, userSkip, `wait-d-${suffix}`, `wait-e-${suffix}`];
      const eventBookingIds = (
        await httpDb
          .select({ id: bookings.id })
          .from(bookings)
          .where(eq(bookings.eventId, event.id))
      ).map((row) => row.id);
      await purgeBookingTicketsForBookings(httpDb, eventBookingIds);
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

  test("promotion skips ALREADY_BOOKED and leaves the entry WAITING", async () => {
    if (!databaseUrl) {
      console.warn("Skipping waitlist already-booked skip test (DATABASE_URL unset)");
      return;
    }

    const httpDb = createDb(databaseUrl);
    const txDb = createTxDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const userId = `wait-held-${suffix}`;
    const partnerImage = await createTestImage();
    const eventImage = await createTestImage();

    const partner = await createPartner(httpDb, {
      name: `Waitlist Held Venue ${suffix.slice(0, 8)}`,
      ...structuredLocationFromAddress("Teststraße 9, Berlin"),
      contactEmail: `wait-held-${suffix}@example.com`,
      logoPrebuilt: partnerImage,
      skipUpload: true,
    });

    const event = await createPublishedEvent(httpDb, {
      partnerId: partner.id,
      title: `Waitlist Held Event ${suffix.slice(0, 8)}`,
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 9, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date(Date.now() + 86_400_000)],
      creditPrice: 1,
      totalCapacity: 2,
      secretCode: "HELDTEST",
      imagePrebuilt: eventImage,
      skipUpload: true,
    });

    try {
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

      await bookEvent(txDb, {
        userId,
        eventId: event.id,
        ticketsCount: 1,
        idempotencyKey: `held-book-${suffix}`,
      });

      const join = await joinWaitlist(httpDb, {
        userId,
        eventId: event.id,
        requestedQty: 1,
      });
      expect(join.created).toBe(true);

      await httpDb
        .update(events)
        .set({ remainingCapacity: 1, updatedAt: new Date() })
        .where(eq(events.id, event.id));

      const processed = await processWaitlistForEvent(txDb, event.id);
      expect(processed.promoted).toHaveLength(0);
      expect(processed.skippedEntryIds).toContain(join.entry.id);

      const after = await httpDb.query.waitlistEntries.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, join.entry.id),
      });
      expect(after?.status).toBe("WAITING");
      expect(after?.skippedOnce).toBe(true);

      const userBookings = await httpDb.select().from(bookings).where(eq(bookings.userId, userId));
      expect(userBookings.filter((row) => row.status === "CONFIRMED")).toHaveLength(1);
    } finally {
      const bookingIds = (
        await httpDb.select({ id: bookings.id }).from(bookings).where(eq(bookings.userId, userId))
      ).map((row) => row.id);
      await purgeBookingTicketsForBookings(httpDb, bookingIds);
      await httpDb.delete(creditLedger).where(eq(creditLedger.userId, userId));
      await httpDb.delete(bookings).where(eq(bookings.userId, userId));
      await httpDb.delete(waitlistEntries).where(eq(waitlistEntries.eventId, event.id));
      await httpDb.delete(subscriptions).where(eq(subscriptions.userId, userId));
      await httpDb.delete(users).where(eq(users.id, userId));
      await deleteEvent(httpDb, event.id, { skipBucket: true });
      await deletePartner(httpDb, partner.id, { skipBucket: true });
      await txDb.pool.end().catch(() => undefined);
    }
  });

  test("joinWaitlist rejects unpublished; existing WAITING survives unpublish", async () => {
    if (!databaseUrl) {
      console.warn("Skipping waitlist unpublished test (DATABASE_URL unset)");
      return;
    }

    const httpDb = createDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const userId = `wait-unpub-${suffix}`;
    const partner = await createPartner(httpDb, {
      name: `Waitlist Unpub Venue ${suffix.slice(0, 8)}`,
      ...structuredLocationFromAddress("Teststraße 9, Berlin"),
      contactEmail: `wait-unpub-${suffix}@example.com`,
      logoPrebuilt: await createTestImage(),
      skipUpload: true,
    });
    const draft = await createEvent(httpDb, {
      partnerId: partner.id,
      title: `Waitlist Unpub Event ${suffix.slice(0, 8)}`,
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 9, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date(Date.now() + 86_400_000)],
      creditPrice: 2,
      totalCapacity: 1,
      secretCode: "WAITUNPUB",
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });
    const live = await createPublishedEvent(httpDb, {
      partnerId: partner.id,
      title: `Waitlist Then Unpub ${suffix.slice(0, 8)}`,
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 9, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date(Date.now() + 172_800_000)],
      creditPrice: 2,
      totalCapacity: 1,
      secretCode: "WAITTHEN",
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });

    try {
      await httpDb.insert(users).values({
        id: userId,
        email: `${userId}@example.com`,
        emailVerified: true,
        credits: 10,
      });

      await expect(
        joinWaitlist(httpDb, { userId, eventId: draft.id, requestedQty: 1 }),
      ).rejects.toMatchObject({ name: "WaitlistError", code: "EVENT_NOT_FOUND" });
      expect(
        await httpDb.select().from(waitlistEntries).where(eq(waitlistEntries.eventId, draft.id)),
      ).toEqual([]);

      const joined = await joinWaitlist(httpDb, { userId, eventId: live.id, requestedQty: 1 });
      expect(joined.created).toBe(true);
      await setEventPublished(httpDb, live.id, false);
      const stillWaiting = await httpDb.query.waitlistEntries.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, joined.entry.id),
      });
      expect(stillWaiting?.status).toBe("WAITING");

      const again = await joinWaitlist(httpDb, { userId, eventId: live.id, requestedQty: 1 });
      expect(again.created).toBe(false);
      expect(again.entry.id).toBe(joined.entry.id);
    } finally {
      await httpDb.delete(waitlistEntries).where(eq(waitlistEntries.userId, userId));
      await httpDb.delete(users).where(eq(users.id, userId));
      await deleteEvent(httpDb, draft.id, { skipBucket: true });
      await deleteEvent(httpDb, live.id, { skipBucket: true });
      await deletePartner(httpDb, partner.id, { skipBucket: true });
    }
  });
});
