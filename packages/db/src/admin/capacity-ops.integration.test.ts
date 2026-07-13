import { describe, expect, test } from "bun:test";
import { createSolidJpeg } from "@unveiled/images";
import { eq } from "drizzle-orm";

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
  joinWaitlist,
  listAdminWaitlistEntries,
  promoteWaitlistEntryAsAdmin,
  subscriptions,
  users,
  waitlistEntries,
} from "../index";

const databaseUrl = process.env.DATABASE_URL;

async function createTestImageBuffer(): Promise<Buffer> {
  return createSolidJpeg(800, 420, { r: 250, g: 255, b: 134 });
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
    const image = await createTestImageBuffer();

    const partner = await createPartner(httpDb, {
      name: `Capacity Ops Venue ${suffix.slice(0, 8)}`,
      address: "Teststraße 11, Berlin",
      contactEmail: `cap-${suffix}@example.com`,
      logoUpload: image,
      skipUpload: true,
    });

    const event = await createEvent(httpDb, {
      partnerId: partner.id,
      title: `Capacity Ops Event ${suffix.slice(0, 8)}`,
      description: "Description",
      address: "Teststraße 11, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date(Date.now() + 86_400_000),
      creditPrice: 2,
      totalCapacity: 1,
      secretCode: "CAPTEST",
      imageUpload: image,
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
        address: "Teststraße 11, Berlin",
        neighborhood: "Mitte",
        category: "Theater",
        eventType: "Performance",
        dateTime: new Date(Date.now() + 172_800_000),
        creditPrice: 3,
        totalCapacity: 2,
        secretCode: "COMPTEST",
        imageUpload: image,
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
        await httpDb.delete(bookings).where(eq(bookings.eventId, compEvent.id));
        await deleteEvent(httpDb, compEvent.id, { skipStorage: true });
      }
    } finally {
      await httpDb.delete(waitlistEntries).where(eq(waitlistEntries.eventId, event.id));
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
      await deleteEvent(httpDb, event.id, { skipStorage: true });
      await deletePartner(httpDb, partner.id, { skipStorage: true });
      await txDb.pool.end();
    }
  }, 30_000);
});
