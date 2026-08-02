import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { createTestImagePrebuilt } from "../catalog/test-image";
import { structuredLocationFromAddress } from "../catalog/test-location";

import {
  bookEvent,
  bookings,
  cancelBookingAsAdmin,
  createCompTicket,
  createDb,
  createEvent,
  createPartner,
  createTxDb,
  creditLedger,
  deleteEvent,
  deletePartner,
  events,
  eventVoucherCodes,
  joinWaitlist,
  listAdminWaitlistEntries,
  promoteWaitlistEntryAsAdmin,
  purgeBookingTicketsForBookings,
  subscriptions,
  users,
  waitlistEntries,
} from "../index";

const databaseUrl = process.env.DATABASE_URL;

async function createTestImage() {
  return createTestImagePrebuilt();
}

describe("admin capacity ops (integration)", () => {
  test("cancel restores capacity without refund; list/promote/comp happy paths", async () => {
    if (!databaseUrl) {
      console.warn("Skipping admin capacity ops integration test (DATABASE_URL unset)");
      return;
    }

    const httpDb = createDb(databaseUrl);
    const txDb = createTxDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const adminId = `cap-admin-${suffix}`;
    const memberId = `cap-member-${suffix}`;
    const waiterId = `cap-waiter-${suffix}`;
    const partnerImage = await createTestImage();
    const eventImage = await createTestImage();
    const compImage = await createTestImage();

    const partner = await createPartner(httpDb, {
      name: `Capacity Ops Venue ${suffix.slice(0, 8)}`,
      ...structuredLocationFromAddress("Teststraße 11, Berlin"),
      contactEmail: `cap-${suffix}@example.com`,
      logoPrebuilt: partnerImage,
      skipUpload: true,
    });

    const event = await createEvent(httpDb, {
      partnerId: partner.id,
      title: `Capacity Ops Event ${suffix.slice(0, 8)}`,
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 11, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date(Date.now() + 86_400_000),
      creditPrice: 2,
      totalCapacity: 1,
      secretCode: "CAPTEST",
      imagePrebuilt: eventImage,
      skipUpload: true,
    });

    try {
      await httpDb.insert(users).values([
        {
          id: adminId,
          email: `${adminId}@example.com`,
          emailVerified: true,
          credits: 0,
          role: "ADMIN",
        },
        {
          id: memberId,
          email: `${memberId}@example.com`,
          emailVerified: true,
          credits: 10,
          role: "USER",
        },
        {
          id: waiterId,
          email: `${waiterId}@example.com`,
          emailVerified: true,
          credits: 10,
          role: "USER",
        },
      ]);

      await httpDb.insert(subscriptions).values([
        { userId: memberId, status: "ACTIVE", plan: "Basic Berlin" },
        { userId: waiterId, status: "ACTIVE", plan: "Basic Berlin" },
      ]);

      const booked = await bookEvent(txDb, {
        userId: memberId,
        eventId: event.id,
        ticketsCount: 1,
        idempotencyKey: `book-${suffix}`,
      });
      expect(booked.booking.status).toBe("CONFIRMED");

      const afterBook = await httpDb.query.users.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, memberId),
      });
      expect(afterBook?.credits).toBe(8);

      const eventSoldOut = await httpDb.query.events.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, event.id),
      });
      expect(eventSoldOut?.remainingCapacity).toBe(0);

      const waitJoin = await joinWaitlist(txDb, {
        userId: waiterId,
        eventId: event.id,
        requestedQty: 1,
      });
      expect(waitJoin.entry.status).toBe("WAITING");

      const listedAll = await listAdminWaitlistEntries(httpDb, { eventId: event.id });
      expect(listedAll.total).toBeGreaterThanOrEqual(1);
      expect(listedAll.items.some((row) => row.id === waitJoin.entry.id)).toBe(true);
      expect(listedAll.items.find((row) => row.id === waitJoin.entry.id)?.skippedOnce).toBe(false);

      const listedWaiting = await listAdminWaitlistEntries(httpDb, {
        eventId: event.id,
        status: "WAITING",
      });
      expect(listedWaiting.items.every((row) => row.status === "WAITING")).toBe(true);

      await expect(
        cancelBookingAsAdmin(txDb, {
          bookingId: booked.booking.id,
          reason: "  ",
          adminUserId: adminId,
        }),
      ).rejects.toMatchObject({ code: "INVALID_REASON" });

      const ledgerBeforeCancel = await httpDb
        .select()
        .from(creditLedger)
        .where(eq(creditLedger.userId, memberId));
      const ledgerCountBefore = ledgerBeforeCancel.length;

      const cancelled = await cancelBookingAsAdmin(txDb, {
        bookingId: booked.booking.id,
        reason: "Member called in — support cancel",
        adminUserId: adminId,
      });
      expect(cancelled.booking.status).toBe("CANCELLED");
      expect(cancelled.booking.cancellationReason).toBe("Member called in — support cancel");
      expect(cancelled.booking.cancelledAt).toBeTruthy();
      // Capacity restored then FIFO waitlist promote consumes it.
      expect(cancelled.waitlist.promoted.length).toBe(1);

      const memberAfterCancel = await httpDb.query.users.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, memberId),
      });
      expect(memberAfterCancel?.credits).toBe(8);

      const ledgerAfterCancel = await httpDb
        .select()
        .from(creditLedger)
        .where(eq(creditLedger.userId, memberId));
      expect(ledgerAfterCancel.length).toBe(ledgerCountBefore);
      expect(ledgerAfterCancel.every((row) => row.type !== "REFUND")).toBe(true);

      await expect(
        cancelBookingAsAdmin(txDb, {
          bookingId: booked.booking.id,
          reason: "again",
          adminUserId: adminId,
        }),
      ).rejects.toMatchObject({ code: "NOT_CONFIRMED" });

      const waiterEntry = await httpDb.query.waitlistEntries.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, waitJoin.entry.id),
      });
      expect(waiterEntry?.status).toBe("PROMOTED");

      const already = await promoteWaitlistEntryAsAdmin(txDb, {
        entryId: waitJoin.entry.id,
        adminUserId: adminId,
      });
      expect(already.kind).toBe("already_promoted");

      // Manual promote happy path: waiting entry + available capacity.
      const manualWaiterId = `cap-manual-${suffix}`;
      await httpDb.insert(users).values({
        id: manualWaiterId,
        email: `${manualWaiterId}@example.com`,
        emailVerified: true,
        credits: 10,
        role: "USER",
      });
      await httpDb.insert(subscriptions).values({
        userId: manualWaiterId,
        status: "ACTIVE",
        plan: "Basic Berlin",
      });
      await httpDb.update(events).set({ remainingCapacity: 0 }).where(eq(events.id, event.id));
      const manualJoin = await joinWaitlist(txDb, {
        userId: manualWaiterId,
        eventId: event.id,
        requestedQty: 1,
      });
      await httpDb.update(events).set({ remainingCapacity: 1 }).where(eq(events.id, event.id));
      const manualPromote = await promoteWaitlistEntryAsAdmin(txDb, {
        entryId: manualJoin.entry.id,
        adminUserId: adminId,
      });
      expect(manualPromote.kind).toBe("promoted");

      // Comp ticket on a fresh event with capacity.
      const compEvent = await createEvent(httpDb, {
        partnerId: partner.id,
        title: `Comp Event ${suffix.slice(0, 8)}`,
        description: "Comp",
        ...structuredLocationFromAddress("Teststraße 11, Berlin"),
        country: "DE",
        city: "berlin",
        zipCode: "10115",
        category: "Theater",
        eventType: "Performance",
        dateTime: new Date(Date.now() + 172_800_000),
        creditPrice: 3,
        totalCapacity: 2,
        secretCode: "COMPTEST",
        imagePrebuilt: compImage,
        skipUpload: true,
      });

      try {
        const creditsBeforeComp = (
          await httpDb.query.users.findFirst({
            where: (fields, { eq: eqOp }) => eqOp(fields.id, memberId),
          })
        )?.credits;

        const ledgerBeforeComp = await httpDb
          .select()
          .from(creditLedger)
          .where(eq(creditLedger.userId, memberId));

        const comp = await createCompTicket(txDb, {
          userId: memberId,
          eventId: compEvent.id,
          idempotencyKey: `comp-${suffix}`,
          adminUserId: adminId,
        });
        expect(comp.created).toBe(true);
        expect(comp.booking.status).toBe("CONFIRMED");
        expect(comp.booking.totalCredits).toBe(0);

        const creditsAfterComp = (
          await httpDb.query.users.findFirst({
            where: (fields, { eq: eqOp }) => eqOp(fields.id, memberId),
          })
        )?.credits;
        expect(creditsAfterComp).toBe(creditsBeforeComp);

        const ledgerAfterComp = await httpDb
          .select()
          .from(creditLedger)
          .where(eq(creditLedger.userId, memberId));
        expect(ledgerAfterComp.length).toBe(ledgerBeforeComp.length);

        await httpDb
          .update(events)
          .set({ remainingCapacity: 0 })
          .where(eq(events.id, compEvent.id));

        await expect(
          createCompTicket(txDb, {
            userId: memberId,
            eventId: compEvent.id,
            idempotencyKey: `comp-sold-${suffix}`,
            adminUserId: adminId,
          }),
        ).rejects.toMatchObject({ code: "SOLD_OUT" });
      } finally {
        const compBookingIds = (
          await httpDb
            .select({ id: bookings.id })
            .from(bookings)
            .where(eq(bookings.eventId, compEvent.id))
        ).map((row) => row.id);
        await purgeBookingTicketsForBookings(httpDb, compBookingIds);
        await httpDb.delete(bookings).where(eq(bookings.eventId, compEvent.id));
        await deleteEvent(httpDb, compEvent.id, { skipBucket: true });
      }
    } finally {
      await httpDb.delete(waitlistEntries).where(eq(waitlistEntries.eventId, event.id));
      const eventBookingIds = (
        await httpDb
          .select({ id: bookings.id })
          .from(bookings)
          .where(eq(bookings.eventId, event.id))
      ).map((row) => row.id);
      await purgeBookingTicketsForBookings(httpDb, eventBookingIds);
      await httpDb.delete(bookings).where(eq(bookings.eventId, event.id));
      await httpDb.delete(creditLedger).where(eq(creditLedger.userId, memberId));
      await httpDb.delete(creditLedger).where(eq(creditLedger.userId, waiterId));
      await httpDb.delete(creditLedger).where(eq(creditLedger.userId, `cap-manual-${suffix}`));
      await httpDb.delete(subscriptions).where(eq(subscriptions.userId, memberId));
      await httpDb.delete(subscriptions).where(eq(subscriptions.userId, waiterId));
      await httpDb.delete(subscriptions).where(eq(subscriptions.userId, `cap-manual-${suffix}`));
      await httpDb.delete(users).where(eq(users.id, memberId));
      await httpDb.delete(users).where(eq(users.id, waiterId));
      await httpDb.delete(users).where(eq(users.id, `cap-manual-${suffix}`));
      await httpDb.delete(users).where(eq(users.id, adminId));
      await deleteEvent(httpDb, event.id, { skipBucket: true });
      await deletePartner(httpDb, partner.id, { skipBucket: true });
      await txDb.pool.end();
    }
  }, 30_000);

  test("cancel restocks promo inventory", async () => {
    if (!databaseUrl) {
      console.warn("Skipping cancel restock integration test (DATABASE_URL unset)");
      return;
    }

    const httpDb = createDb(databaseUrl);
    const txDb = createTxDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const adminId = `restock-admin-${suffix}`;
    const memberId = `restock-member-${suffix}`;
    const partnerImage = await createTestImage();
    const eventImage = await createTestImage();

    const partner = await createPartner(httpDb, {
      name: `Restock Venue ${suffix.slice(0, 8)}`,
      ...structuredLocationFromAddress("Teststraße 11, Berlin"),
      contactEmail: `restock-${suffix}@example.com`,
      logoPrebuilt: partnerImage,
      skipUpload: true,
    });

    const event = await createEvent(httpDb, {
      partnerId: partner.id,
      title: `Restock Event ${suffix.slice(0, 8)}`,
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 11, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date(Date.now() + 86_400_000),
      creditPrice: 1,
      totalCapacity: 5,
      ticketType: "VOUCHER_PROMO",
      eventWebsiteUrl: "https://example.com/restock",
      imagePrebuilt: eventImage,
      skipUpload: true,
    });

    await httpDb.insert(eventVoucherCodes).values([
      { eventId: event.id, code: `R1-${suffix.slice(0, 8)}`, status: "AVAILABLE" },
      { eventId: event.id, code: `R2-${suffix.slice(0, 8)}`, status: "AVAILABLE" },
    ]);

    try {
      await httpDb.insert(users).values([
        {
          id: adminId,
          email: `${adminId}@example.com`,
          emailVerified: true,
          credits: 0,
          role: "ADMIN",
        },
        {
          id: memberId,
          email: `${memberId}@example.com`,
          emailVerified: true,
          credits: 10,
          role: "USER",
        },
      ]);
      await httpDb.insert(subscriptions).values({
        userId: memberId,
        status: "ACTIVE",
        plan: "Basic Berlin",
      });

      const booked = await bookEvent(txDb, {
        userId: memberId,
        eventId: event.id,
        ticketsCount: 2,
        idempotencyKey: `restock-book-${suffix}`,
      });

      const beforeCancel = await httpDb
        .select()
        .from(eventVoucherCodes)
        .where(eq(eventVoucherCodes.eventId, event.id));
      expect(beforeCancel.every((row) => row.status === "ALLOCATED")).toBe(true);

      const cancelled = await cancelBookingAsAdmin(txDb, {
        bookingId: booked.booking.id,
        reason: "Restock inventory after member cancel request",
        adminUserId: adminId,
      });
      expect(cancelled.booking.status).toBe("CANCELLED");

      const afterCancel = await httpDb
        .select()
        .from(eventVoucherCodes)
        .where(eq(eventVoucherCodes.eventId, event.id));
      expect(afterCancel).toHaveLength(2);
      expect(afterCancel.every((row) => row.status === "AVAILABLE")).toBe(true);
      expect(afterCancel.every((row) => row.bookingTicketId == null)).toBe(true);

      const eventAfter = await httpDb.query.events.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, event.id),
      });
      expect(eventAfter?.remainingCapacity).toBe(5);

      const memberAfter = await httpDb.query.users.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, memberId),
      });
      expect(memberAfter?.credits).toBe(8);
    } finally {
      const bookingIds = (
        await httpDb
          .select({ id: bookings.id })
          .from(bookings)
          .where(eq(bookings.eventId, event.id))
      ).map((row) => row.id);
      await purgeBookingTicketsForBookings(httpDb, bookingIds);
      await httpDb.delete(bookings).where(eq(bookings.eventId, event.id));
      await httpDb.delete(eventVoucherCodes).where(eq(eventVoucherCodes.eventId, event.id));
      await httpDb.delete(creditLedger).where(eq(creditLedger.userId, memberId));
      await httpDb.delete(subscriptions).where(eq(subscriptions.userId, memberId));
      await httpDb.delete(users).where(eq(users.id, memberId));
      await httpDb.delete(users).where(eq(users.id, adminId));
      await deleteEvent(httpDb, event.id, { skipBucket: true });
      await deletePartner(httpDb, partner.id, { skipBucket: true });
      await txDb.pool.end();
    }
  }, 30_000);
});
