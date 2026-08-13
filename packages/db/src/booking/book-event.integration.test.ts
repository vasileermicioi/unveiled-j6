import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { createTestImagePrebuilt } from "../catalog/test-image";
import { structuredLocationFromAddress } from "../catalog/test-location";

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
  eventVoucherCodes,
  eventVoucherPdfs,
  listBookingTickets,
  purgeBookingTicketsForBookings,
  subscriptions,
  users,
} from "../index";

const databaseUrl = process.env.DATABASE_URL;

async function createTestImage() {
  return createTestImagePrebuilt();
}

async function cleanupUserBookings(httpDb: ReturnType<typeof createDb>, userId: string) {
  const rows = await httpDb
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.userId, userId));
  await purgeBookingTicketsForBookings(
    httpDb,
    rows.map((row) => row.id),
  );
  await httpDb.delete(creditLedger).where(eq(creditLedger.userId, userId));
  await httpDb.delete(bookings).where(eq(bookings.userId, userId));
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
    const partnerImage = await createTestImage();
    const eventImage = await createTestImage();

    const partner = await createPartner(httpDb, {
      name: `Booking Test Venue ${suffix.slice(0, 8)}`,
      ...structuredLocationFromAddress("Teststraße 9, Berlin"),
      contactEmail: `book-${suffix}@example.com`,
      logoPrebuilt: partnerImage,
      skipUpload: true,
    });

    const event = await createEvent(httpDb, {
      partnerId: partner.id,
      title: `Booking Test Event ${suffix.slice(0, 8)}`,
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 9, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTimes: [new Date(Date.now() + 86_400_000)],
      creditPrice: 2,
      totalCapacity: 3,
      secretCode: "BOOKTEST",
      imagePrebuilt: eventImage,
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

      const secretTickets = await listBookingTickets(httpDb, first.booking.id);
      expect(secretTickets).toHaveLength(1);
      expect(secretTickets[0]?.redemptionCode).toBe("BOOKTEST");

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

      const ticketsAfterRetry = await listBookingTickets(httpDb, first.booking.id);
      expect(ticketsAfterRetry).toHaveLength(1);

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
      await cleanupUserBookings(httpDb, userId);
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
    const partnerImage = await createTestImage();
    const eventImage = await createTestImage();

    const partner = await createPartner(httpDb, {
      name: `Booking Qty Venue ${suffix.slice(0, 8)}`,
      ...structuredLocationFromAddress("Teststraße 9, Berlin"),
      contactEmail: `book-qty4-${suffix}@example.com`,
      logoPrebuilt: partnerImage,
      skipUpload: true,
    });

    const event = await createEvent(httpDb, {
      partnerId: partner.id,
      title: `Booking Qty Event ${suffix.slice(0, 8)}`,
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 9, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTimes: [new Date(Date.now() + 86_400_000)],
      creditPrice: 2,
      totalCapacity: 10,
      secretCode: "QTY4TEST",
      imagePrebuilt: eventImage,
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

      const tickets = await listBookingTickets(httpDb, result.booking.id);
      expect(tickets).toHaveLength(4);
      expect(tickets.every((ticket) => ticket.redemptionCode === "QTY4TEST")).toBe(true);

      const afterBook = await httpDb.query.users.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, userId),
      });
      expect(afterBook?.credits).toBe(9);

      const eventAfter = await httpDb.query.events.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, event.id),
      });
      expect(eventAfter?.remainingCapacity).toBe(6);
    } finally {
      await cleanupUserBookings(httpDb, userId);
      await httpDb.delete(subscriptions).where(eq(subscriptions.userId, userId));
      await httpDb.delete(users).where(eq(users.id, userId));
      await deleteEvent(httpDb, event.id, { skipBucket: true });
      await deletePartner(httpDb, partner.id, { skipBucket: true });
      await txDb.pool.end().catch(() => undefined);
    }
  });

  test("allocates promo codes, rejects insufficient inventory, and is idempotent", async () => {
    if (!databaseUrl) {
      console.warn("Skipping voucher promo allocation integration test (DATABASE_URL unset)");
      return;
    }

    const httpDb = createDb(databaseUrl);
    const txDb = createTxDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const userId = `book-promo-${suffix}`;
    const partnerImage = await createTestImage();
    const eventImage = await createTestImage();

    const partner = await createPartner(httpDb, {
      name: `Promo Venue ${suffix.slice(0, 8)}`,
      ...structuredLocationFromAddress("Teststraße 9, Berlin"),
      contactEmail: `promo-${suffix}@example.com`,
      logoPrebuilt: partnerImage,
      skipUpload: true,
    });

    const event = await createEvent(httpDb, {
      partnerId: partner.id,
      title: `Promo Event ${suffix.slice(0, 8)}`,
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 9, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTimes: [new Date(Date.now() + 86_400_000)],
      creditPrice: 1,
      totalCapacity: 10,
      ticketType: "VOUCHER_PROMO",
      eventWebsiteUrl: "https://example.com/promo",
      imagePrebuilt: eventImage,
      skipUpload: true,
    });

    await httpDb.insert(eventVoucherCodes).values([
      { eventId: event.id, code: `PROMO-A-${suffix.slice(0, 8)}`, status: "AVAILABLE" },
      { eventId: event.id, code: `PROMO-B-${suffix.slice(0, 8)}`, status: "AVAILABLE" },
    ]);

    try {
      await httpDb.insert(users).values({
        id: userId,
        email: `${userId}@example.com`,
        emailVerified: true,
        credits: 20,
      });
      await httpDb.insert(subscriptions).values({
        userId,
        status: "ACTIVE",
        plan: "Basic Berlin",
      });

      const idempotencyKey = `idem-promo-${suffix}`;
      const booked = await bookEvent(txDb, {
        userId,
        eventId: event.id,
        ticketsCount: 2,
        idempotencyKey,
      });
      expect(booked.created).toBe(true);
      expect(booked.booking.redemptionType).toBe("VOUCHER_PROMO");
      expect(booked.booking.redemptionUrl).toBe("https://example.com/promo");

      const tickets = await listBookingTickets(httpDb, booked.booking.id);
      expect(tickets).toHaveLength(2);
      expect(new Set(tickets.map((ticket) => ticket.redemptionCode)).size).toBe(2);

      const allocated = await httpDb
        .select()
        .from(eventVoucherCodes)
        .where(eq(eventVoucherCodes.eventId, event.id));
      expect(allocated.every((row) => row.status === "ALLOCATED")).toBe(true);
      expect(allocated.every((row) => row.bookingTicketId != null)).toBe(true);

      const retry = await bookEvent(txDb, {
        userId,
        eventId: event.id,
        ticketsCount: 2,
        idempotencyKey,
      });
      expect(retry.created).toBe(false);
      const allocatedAfterRetry = await httpDb
        .select()
        .from(eventVoucherCodes)
        .where(eq(eventVoucherCodes.eventId, event.id));
      expect(allocatedAfterRetry.filter((row) => row.status === "ALLOCATED")).toHaveLength(2);

      let inventoryCode: string | undefined;
      try {
        await bookEvent(txDb, {
          userId,
          eventId: event.id,
          ticketsCount: 1,
          idempotencyKey: `idem-promo-short-${suffix}`,
        });
      } catch (error) {
        inventoryCode = error instanceof Error ? (error as { code?: string }).code : undefined;
      }
      expect(inventoryCode).toBe("INSUFFICIENT_VOUCHER_INVENTORY");

      const userAfterFail = await httpDb.query.users.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, userId),
      });
      expect(userAfterFail?.credits).toBe(18);
      const eventAfterFail = await httpDb.query.events.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, event.id),
      });
      expect(eventAfterFail?.remainingCapacity).toBe(8);
    } finally {
      await cleanupUserBookings(httpDb, userId);
      await httpDb.delete(eventVoucherCodes).where(eq(eventVoucherCodes.eventId, event.id));
      await httpDb.delete(subscriptions).where(eq(subscriptions.userId, userId));
      await httpDb.delete(users).where(eq(users.id, userId));
      await deleteEvent(httpDb, event.id, { skipBucket: true });
      await deletePartner(httpDb, partner.id, { skipBucket: true });
      await txDb.pool.end().catch(() => undefined);
    }
  });

  test("allocates PDF vouchers per ticket", async () => {
    if (!databaseUrl) {
      console.warn("Skipping voucher PDF allocation integration test (DATABASE_URL unset)");
      return;
    }

    const httpDb = createDb(databaseUrl);
    const txDb = createTxDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const userId = `book-pdf-${suffix}`;
    const partnerImage = await createTestImage();
    const eventImage = await createTestImage();

    const partner = await createPartner(httpDb, {
      name: `PDF Venue ${suffix.slice(0, 8)}`,
      ...structuredLocationFromAddress("Teststraße 9, Berlin"),
      contactEmail: `pdf-${suffix}@example.com`,
      logoPrebuilt: partnerImage,
      skipUpload: true,
    });

    const event = await createEvent(httpDb, {
      partnerId: partner.id,
      title: `PDF Event ${suffix.slice(0, 8)}`,
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 9, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTimes: [new Date(Date.now() + 86_400_000)],
      creditPrice: 1,
      totalCapacity: 5,
      ticketType: "VOUCHER_PDF",
      imagePrebuilt: eventImage,
      skipUpload: true,
    });

    const [pdfA, pdfB] = await httpDb
      .insert(eventVoucherPdfs)
      .values([
        {
          eventId: event.id,
          objectKey: `vouchers/${event.id}/a.pdf`,
          pageLabel: "1",
          status: "AVAILABLE",
        },
        {
          eventId: event.id,
          objectKey: `vouchers/${event.id}/b.pdf`,
          pageLabel: "2",
          status: "AVAILABLE",
        },
      ])
      .returning();

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

      const booked = await bookEvent(txDb, {
        userId,
        eventId: event.id,
        ticketsCount: 2,
        idempotencyKey: `idem-pdf-${suffix}`,
      });
      expect(booked.created).toBe(true);
      expect(booked.booking.redemptionType).toBe("VOUCHER_PDF");
      expect(["1", "2"]).toContain(booked.booking.redemptionInfo);

      const tickets = await listBookingTickets(httpDb, booked.booking.id);
      expect(tickets).toHaveLength(2);
      expect(new Set(tickets.map((ticket) => ticket.voucherPdfId))).toEqual(
        new Set([pdfA?.id, pdfB?.id]),
      );

      const inventory = await httpDb
        .select()
        .from(eventVoucherPdfs)
        .where(eq(eventVoucherPdfs.eventId, event.id));
      expect(inventory.every((row) => row.status === "ALLOCATED")).toBe(true);
    } finally {
      await cleanupUserBookings(httpDb, userId);
      await httpDb.delete(eventVoucherPdfs).where(eq(eventVoucherPdfs.eventId, event.id));
      await httpDb.delete(subscriptions).where(eq(subscriptions.userId, userId));
      await httpDb.delete(users).where(eq(users.id, userId));
      await deleteEvent(httpDb, event.id, { skipBucket: true });
      await deletePartner(httpDb, partner.id, { skipBucket: true });
      await txDb.pool.end().catch(() => undefined);
    }
  });

  test("charges selected slot, rejects unknown/past, and ignores datetime on idempotent retry", async () => {
    if (!databaseUrl) {
      console.warn("Skipping bookEvent slot integration test (DATABASE_URL unset)");
      return;
    }

    const httpDb = createDb(databaseUrl);
    const txDb = createTxDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const userId = `book-slot-${suffix}`;
    const partnerImage = await createTestImage();
    const eventImage = await createTestImage();
    const pastEventImage = await createTestImage();
    const morning = new Date(Date.now() + 86_400_000);
    morning.setUTCHours(8, 0, 0, 0);
    const evening = new Date(morning.getTime() + 10 * 3_600_000);
    const pastSlot = new Date(Date.now() - 86_400_000);

    const partner = await createPartner(httpDb, {
      name: `Slot Venue ${suffix.slice(0, 8)}`,
      ...structuredLocationFromAddress("Teststraße 9, Berlin"),
      contactEmail: `slot-${suffix}@example.com`,
      logoPrebuilt: partnerImage,
      skipUpload: true,
    });

    const event = await createEvent(httpDb, {
      partnerId: partner.id,
      title: `Slot Event ${suffix.slice(0, 8)}`,
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 9, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTimes: [morning, evening],
      occurrenceCreditPrices: [1, 3],
      creditPrice: 1,
      totalCapacity: 10,
      secretCode: "SLOTTEST",
      imagePrebuilt: eventImage,
      skipUpload: true,
    });

    let pastOnEventId: string | undefined;
    try {
      await httpDb.insert(users).values({
        id: userId,
        email: `${userId}@example.com`,
        emailVerified: true,
        credits: 20,
      });
      await httpDb.insert(subscriptions).values({
        userId,
        status: "ACTIVE",
        plan: "Basic Berlin",
      });

      const eveningBook = await bookEvent(txDb, {
        userId,
        eventId: event.id,
        ticketsCount: 2,
        dateTime: evening,
        idempotencyKey: `idem-slot-evening-${suffix}`,
      });
      expect(eveningBook.created).toBe(true);
      expect(eveningBook.booking.dateTime.getTime()).toBe(evening.getTime());
      expect(eveningBook.booking.totalCredits).toBe(6);

      const afterEvening = await httpDb.query.users.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, userId),
      });
      expect(afterEvening?.credits).toBe(14);
      const eventAfterEvening = await httpDb.query.events.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, event.id),
      });
      expect(eventAfterEvening?.remainingCapacity).toBe(8);

      const morningBook = await bookEvent(txDb, {
        userId,
        eventId: event.id,
        ticketsCount: 2,
        dateTime: morning,
        idempotencyKey: `idem-slot-morning-${suffix}`,
      });
      expect(morningBook.created).toBe(true);
      expect(morningBook.booking.dateTime.getTime()).toBe(morning.getTime());
      expect(morningBook.booking.totalCredits).toBe(2);

      const afterMorning = await httpDb.query.users.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, userId),
      });
      expect(afterMorning?.credits).toBe(12);

      const omitted = await bookEvent(txDb, {
        userId,
        eventId: event.id,
        ticketsCount: 1,
        idempotencyKey: `idem-slot-omit-${suffix}`,
      });
      expect(omitted.created).toBe(true);
      expect(omitted.booking.dateTime.getTime()).toBe(morning.getTime());
      expect(omitted.booking.totalCredits).toBe(1);

      let unknownCode: string | undefined;
      try {
        await bookEvent(txDb, {
          userId,
          eventId: event.id,
          ticketsCount: 1,
          dateTime: new Date(evening.getTime() + 60_000),
          idempotencyKey: `idem-slot-unknown-${suffix}`,
        });
      } catch (error) {
        unknownCode = error instanceof Error ? (error as { code?: string }).code : undefined;
      }
      expect(unknownCode).toBe("UNKNOWN_SLOT");

      let pastCode: string | undefined;
      try {
        await bookEvent(txDb, {
          userId,
          eventId: event.id,
          ticketsCount: 1,
          dateTime: pastSlot,
          idempotencyKey: `idem-slot-past-${suffix}`,
        });
      } catch (error) {
        pastCode = error instanceof Error ? (error as { code?: string }).code : undefined;
      }
      expect(pastCode).toBe("UNKNOWN_SLOT");

      const pastOnEvent = await createEvent(httpDb, {
        partnerId: partner.id,
        title: `Past Slot Event ${suffix.slice(0, 8)}`,
        description: "Description",
        ...structuredLocationFromAddress("Teststraße 9, Berlin"),
        country: "DE",
        city: "berlin",
        zipCode: "10115",
        category: "Theater",
        eventType: "Performance",
        dateTimes: [pastSlot, evening],
        occurrenceCreditPrices: [1, 3],
        creditPrice: 3,
        totalCapacity: 5,
        secretCode: "PASTSLOT",
        imagePrebuilt: pastEventImage,
        skipUpload: true,
      });
      pastOnEventId = pastOnEvent.id;

      let pastOnEventCode: string | undefined;
      try {
        await bookEvent(txDb, {
          userId,
          eventId: pastOnEvent.id,
          ticketsCount: 1,
          dateTime: pastSlot,
          idempotencyKey: `idem-slot-past-on-event-${suffix}`,
        });
      } catch (error) {
        pastOnEventCode = error instanceof Error ? (error as { code?: string }).code : undefined;
      }
      expect(pastOnEventCode).toBe("PAST_SLOT");

      const retry = await bookEvent(txDb, {
        userId,
        eventId: event.id,
        ticketsCount: 2,
        dateTime: morning,
        idempotencyKey: `idem-slot-evening-${suffix}`,
      });
      expect(retry.created).toBe(false);
      expect(retry.booking.id).toBe(eveningBook.booking.id);
      expect(retry.booking.dateTime.getTime()).toBe(evening.getTime());

      const creditsAfterRetry = await httpDb.query.users.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, userId),
      });
      expect(creditsAfterRetry?.credits).toBe(11);
    } finally {
      await cleanupUserBookings(httpDb, userId);
      await httpDb.delete(subscriptions).where(eq(subscriptions.userId, userId));
      await httpDb.delete(users).where(eq(users.id, userId));
      if (typeof pastOnEventId === "string") {
        await deleteEvent(httpDb, pastOnEventId, { skipBucket: true });
      }
      await deleteEvent(httpDb, event.id, { skipBucket: true });
      await deletePartner(httpDb, partner.id, { skipBucket: true });
      await txDb.pool.end().catch(() => undefined);
    }
  });
});
