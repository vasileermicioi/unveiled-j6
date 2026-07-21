import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { createTestImagePrebuilt } from "../catalog/test-image";

import {
  bookEvent,
  bookings,
  createDb,
  createEvent,
  createPartner,
  createTxDb,
  creditLedger,
  deleteEvent,
  deletePartner,
  events,
  subscriptions,
  users,
} from "../index";

const databaseUrl = process.env.DATABASE_URL;

async function createTestImage() {
  return createTestImagePrebuilt();
}

describe("bookEvent", () => {
  test("success, insufficient credits, sold out, past due, and idempotent retry", async () => {
    if (!databaseUrl) {
      console.warn("Skipping bookEvent integration test (DATABASE_URL unset)");
      return;
    }

    const httpDb = createDb(databaseUrl);
    const txDb = createTxDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const userId = `book-test-${suffix}`;
    const image = await createTestImage();

    const partner = await createPartner(httpDb, {
      name: `Booking Test Venue ${suffix.slice(0, 8)}`,
      address: "Teststraße 9, Berlin",
      contactEmail: `book-${suffix}@example.com`,
      logoPrebuilt: image,
      skipUpload: true,
    });

    const event = await createEvent(httpDb, {
      partnerId: partner.id,
      title: `Booking Test Event ${suffix.slice(0, 8)}`,
      description: "Description",
      address: "Teststraße 9, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date(Date.now() + 86_400_000),
      creditPrice: 2,
      totalCapacity: 3,
      secretCode: "BOOKTEST",
      imagePrebuilt: image,
      skipUpload: true,
    });

    try {
      await httpDb.insert(users).values({
        id: userId,
        email: `${userId}@example.com`,
        emailVerified: true,
        credits: 5,
      });
      await httpDb.insert(subscriptions).values({
        userId,
        status: "ACTIVE",
        plan: "Basic Berlin",
      });

      const idempotencyKey = `idem-${suffix}`;
      const first = await bookEvent(txDb, {
        userId,
        eventId: event.id,
        ticketsCount: 1,
        idempotencyKey,
      });
      expect(first.created).toBe(true);
      expect(first.booking.status).toBe("CONFIRMED");
      expect(first.booking.redemptionInfo).toBe("BOOKTEST");
      expect(first.booking.totalCredits).toBe(2);

      const afterBook = await httpDb.query.users.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, userId),
      });
      expect(afterBook?.credits).toBe(3);

      const eventAfter = await httpDb.query.events.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, event.id),
      });
      expect(eventAfter?.remainingCapacity).toBe(2);

      const ledger = await httpDb.query.creditLedger.findMany({
        where: (fields, { eq: eqOp }) => eqOp(fields.userId, userId),
      });
      expect(ledger.some((row) => row.type === "BOOKING" && row.amount === -2)).toBe(true);

      const retry = await bookEvent(txDb, {
        userId,
        eventId: event.id,
        ticketsCount: 1,
        idempotencyKey,
      });
      expect(retry.created).toBe(false);
      expect(retry.booking.id).toBe(first.booking.id);

      const afterRetry = await httpDb.query.users.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, userId),
      });
      expect(afterRetry?.credits).toBe(3);
      const eventAfterRetry = await httpDb.query.events.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, event.id),
      });
      expect(eventAfterRetry?.remainingCapacity).toBe(2);

      let insufficientCode: string | undefined;
      try {
        await bookEvent(txDb, {
          userId,
          eventId: event.id,
          ticketsCount: 2,
          idempotencyKey: `idem-short-${suffix}`,
        });
      } catch (error) {
        insufficientCode = error instanceof Error ? (error as { code?: string }).code : undefined;
      }
      expect(insufficientCode).toBe("INSUFFICIENT_CREDITS");

      const capacityUnchanged = await httpDb.query.events.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, event.id),
      });
      expect(capacityUnchanged?.remainingCapacity).toBe(2);

      await httpDb.update(users).set({ credits: 20 }).where(eq(users.id, userId));
      await httpDb.update(events).set({ remainingCapacity: 1 }).where(eq(events.id, event.id));

      let soldOutCode: string | undefined;
      try {
        await bookEvent(txDb, {
          userId,
          eventId: event.id,
          ticketsCount: 2,
          idempotencyKey: `idem-sold-${suffix}`,
        });
      } catch (error) {
        soldOutCode = error instanceof Error ? (error as { code?: string }).code : undefined;
      }
      expect(soldOutCode).toBe("SOLD_OUT");

      await httpDb
        .update(subscriptions)
        .set({ status: "PAST_DUE" })
        .where(eq(subscriptions.userId, userId));

      let pastDueCode: string | undefined;
      try {
        await bookEvent(txDb, {
          userId,
          eventId: event.id,
          ticketsCount: 1,
          idempotencyKey: `idem-pastdue-${suffix}`,
        });
      } catch (error) {
        pastDueCode = error instanceof Error ? (error as { code?: string }).code : undefined;
      }
      expect(pastDueCode).toBe("PAST_DUE");
    } finally {
      await httpDb.delete(creditLedger).where(eq(creditLedger.userId, userId));
      await httpDb.delete(bookings).where(eq(bookings.userId, userId));
      await httpDb.delete(subscriptions).where(eq(subscriptions.userId, userId));
      await httpDb.delete(users).where(eq(users.id, userId));
      await deleteEvent(httpDb, event.id, { skipBucket: true });
      await deletePartner(httpDb, partner.id, { skipBucket: true });
      await txDb.pool.end().catch(() => undefined);
    }
  });

  test("books more than 3 tickets when credits and capacity allow", async () => {
    if (!databaseUrl) {
      console.warn("Skipping bookEvent qty>3 integration test (DATABASE_URL unset)");
      return;
    }

    const httpDb = createDb(databaseUrl);
    const txDb = createTxDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const userId = `book-qty4-${suffix}`;
    const image = await createTestImage();

    const partner = await createPartner(httpDb, {
      name: `Booking Qty Venue ${suffix.slice(0, 8)}`,
      address: "Teststraße 9, Berlin",
      contactEmail: `book-qty4-${suffix}@example.com`,
      logoPrebuilt: image,
      skipUpload: true,
    });

    const event = await createEvent(httpDb, {
      partnerId: partner.id,
      title: `Booking Qty Event ${suffix.slice(0, 8)}`,
      description: "Description",
      address: "Teststraße 9, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date(Date.now() + 86_400_000),
      creditPrice: 2,
      totalCapacity: 10,
      secretCode: "QTY4TEST",
      imagePrebuilt: image,
      skipUpload: true,
    });

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
      });

      const result = await bookEvent(txDb, {
        userId,
        eventId: event.id,
        ticketsCount: 4,
        idempotencyKey: `idem-qty4-${suffix}`,
      });
      expect(result.created).toBe(true);
      expect(result.booking.ticketsCount).toBe(4);
      expect(result.booking.totalCredits).toBe(8);

      const afterBook = await httpDb.query.users.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, userId),
      });
      expect(afterBook?.credits).toBe(9);

      const eventAfter = await httpDb.query.events.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, event.id),
      });
      expect(eventAfter?.remainingCapacity).toBe(6);
    } finally {
      await httpDb.delete(creditLedger).where(eq(creditLedger.userId, userId));
      await httpDb.delete(bookings).where(eq(bookings.userId, userId));
      await httpDb.delete(subscriptions).where(eq(subscriptions.userId, userId));
      await httpDb.delete(users).where(eq(users.id, userId));
      await deleteEvent(httpDb, event.id, { skipBucket: true });
      await deletePartner(httpDb, partner.id, { skipBucket: true });
      await txDb.pool.end().catch(() => undefined);
    }
  });
});
