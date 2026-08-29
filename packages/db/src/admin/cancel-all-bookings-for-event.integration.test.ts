import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { createTestImagePrebuilt } from "../catalog/test-image";
import { structuredLocationFromAddress } from "../catalog/test-location";
import { createPublishedEvent } from "../catalog/test-published-event";

import {
  bookEvent,
  bookings,
  cancelAllBookingsForEvent,
  createCompTicket,
  createDb,
  createPartner,
  createTxDb,
  creditLedger,
  deleteEvent,
  deletePartner,
  eventVoucherCodes,
  eventVoucherPdfs,
  joinWaitlist,
  listBookingTickets,
  purgeBookingTicketsForBookings,
  subscriptions,
  users,
  waitlistEntries,
} from "../index";

const databaseUrl = process.env.DATABASE_URL;
const location = structuredLocationFromAddress("Teststraße 11, Berlin");

describe("cancelAllBookingsForEvent (integration)", () => {
  test("refunds paid CONFIRMED, restocks promo/PDF, skips USED and comps ledger, closes waitlist", async () => {
    if (!databaseUrl) {
      console.warn("Skipping cancel-all integration test (DATABASE_URL unset)");
      return;
    }

    const httpDb = createDb(databaseUrl);
    const txDb = createTxDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const token = suffix.slice(0, 8);
    const adminId = `caa-admin-${suffix}`;
    const paidA = `caa-paid-a-${suffix}`;
    const paidB = `caa-paid-b-${suffix}`;
    const compId = `caa-comp-${suffix}`;
    const usedId = `caa-used-${suffix}`;
    const waiterId = `caa-wait-${suffix}`;
    const pdfMemberId = `caa-pdf-${suffix}`;
    const promotedId = `caa-promoted-${suffix}`;

    const partnerImage = await createTestImagePrebuilt();
    const promoImage = await createTestImagePrebuilt();
    const pdfImage = await createTestImagePrebuilt();

    const partner = await createPartner(httpDb, {
      name: `Cancel All Venue ${token}`,
      ...location,
      contactEmail: `caa-${suffix}@example.com`,
      logoPrebuilt: partnerImage,
      skipUpload: true,
    });

    const promoEvent = await createPublishedEvent(httpDb, {
      partnerId: partner.id,
      title: `Cancel All Promo ${token}`,
      description: "Description",
      ...location,
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date(Date.now() + 86_400_000)],
      creditPrice: 2,
      totalCapacity: 4,
      ticketType: "VOUCHER_PROMO",
      eventWebsiteUrl: "https://example.com/caa-promo",
      imagePrebuilt: promoImage,
      skipUpload: true,
    });

    const pdfEvent = await createPublishedEvent(httpDb, {
      partnerId: partner.id,
      title: `Cancel All PDF ${token}`,
      description: "Description",
      ...location,
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date(Date.now() + 172_800_000)],
      creditPrice: 3,
      totalCapacity: 2,
      ticketType: "VOUCHER_PDF",
      imagePrebuilt: pdfImage,
      skipUpload: true,
    });

    await httpDb.insert(eventVoucherCodes).values([
      { eventId: promoEvent.id, code: `CA1-${token}`, status: "AVAILABLE" },
      { eventId: promoEvent.id, code: `CA2-${token}`, status: "AVAILABLE" },
      { eventId: promoEvent.id, code: `CA3-${token}`, status: "AVAILABLE" },
      { eventId: promoEvent.id, code: `CA4-${token}`, status: "AVAILABLE" },
    ]);
    await httpDb.insert(eventVoucherPdfs).values({
      eventId: pdfEvent.id,
      objectKey: `vouchers/${pdfEvent.id}/a.pdf`,
      pageLabel: "1",
      status: "AVAILABLE",
    });

    const memberIds = [paidA, paidB, compId, usedId, waiterId, pdfMemberId, promotedId];

    try {
      await httpDb.insert(users).values([
        {
          id: adminId,
          email: `${adminId}@example.com`,
          emailVerified: true,
          credits: 0,
          role: "ADMIN",
        },
        ...memberIds.map((id) => ({
          id,
          email: `${id}@example.com`,
          emailVerified: true,
          credits: 10,
          role: "USER" as const,
        })),
      ]);
      await httpDb.insert(subscriptions).values(
        memberIds.map((userId) => ({
          userId,
          status: "ACTIVE" as const,
          plan: "Basic Berlin",
        })),
      );

      const bookedA = await bookEvent(txDb, {
        userId: paidA,
        eventId: promoEvent.id,
        ticketsCount: 1,
        idempotencyKey: `caa-a-${suffix}`,
      });
      const bookedB = await bookEvent(txDb, {
        userId: paidB,
        eventId: promoEvent.id,
        ticketsCount: 1,
        idempotencyKey: `caa-b-${suffix}`,
      });
      const bookedComp = await createCompTicket(txDb, {
        userId: compId,
        eventId: promoEvent.id,
        idempotencyKey: `caa-comp-${suffix}`,
        adminUserId: adminId,
      });
      const bookedUsed = await bookEvent(txDb, {
        userId: usedId,
        eventId: promoEvent.id,
        ticketsCount: 1,
        idempotencyKey: `caa-used-${suffix}`,
      });
      await httpDb
        .update(bookings)
        .set({ status: "USED", updatedAt: new Date() })
        .where(eq(bookings.id, bookedUsed.booking.id));

      const waitJoin = await joinWaitlist(httpDb, {
        userId: waiterId,
        eventId: promoEvent.id,
        requestedQty: 1,
      });
      await httpDb.insert(waitlistEntries).values({
        userId: promotedId,
        eventId: promoEvent.id,
        requestedQty: 1,
        status: "PROMOTED",
      });

      const bookedPdf = await bookEvent(txDb, {
        userId: pdfMemberId,
        eventId: pdfEvent.id,
        ticketsCount: 1,
        idempotencyKey: `caa-pdf-${suffix}`,
      });

      const promoBefore = await httpDb.query.events.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, promoEvent.id),
      });
      expect(promoBefore?.remainingCapacity).toBe(0);

      await expect(
        cancelAllBookingsForEvent(txDb, {
          eventId: crypto.randomUUID(),
          reason: "missing",
          adminUserId: adminId,
        }),
      ).rejects.toMatchObject({ code: "EVENT_NOT_FOUND" });

      const promoTicketsBefore = await listBookingTickets(httpDb, bookedA.booking.id);
      expect(promoTicketsBefore.some((ticket) => ticket.redemptionCode)).toBe(true);

      const result = await cancelAllBookingsForEvent(txDb, {
        eventId: promoEvent.id,
        reason: "Venue cancelled the night",
        adminUserId: adminId,
      });
      expect(result.cancelled).toBe(3);
      expect(result.refundedCredits).toBe(4);
      expect(result.waitlistCancelled).toBe(1);
      expect(result.skippedUsed).toBe(1);
      expect(result.cancelledMembers).toHaveLength(3);
      expect(result.cancelledMembers.map((member) => member.userId).sort()).toEqual(
        [paidA, paidB, compId].sort(),
      );
      expect(result.cancelledMembers.some((member) => member.userId === usedId)).toBe(false);
      expect(result.cancelledMembers.find((member) => member.userId === paidA)?.totalCredits).toBe(
        2,
      );
      expect(result.cancelledMembers.find((member) => member.userId === compId)?.totalCredits).toBe(
        0,
      );
      expect(result.cancelledMembers.every((member) => member.email.endsWith("@example.com"))).toBe(
        true,
      );
      expect(result.closedWaitlistMembers).toHaveLength(1);
      expect(result.closedWaitlistMembers[0]?.userId).toBe(waiterId);
      expect(result.closedWaitlistMembers[0]?.email).toBe(`${waiterId}@example.com`);

      const pdfResult = await cancelAllBookingsForEvent(txDb, {
        eventId: pdfEvent.id,
        reason: "Venue cancelled the night",
        adminUserId: adminId,
      });
      expect(pdfResult.cancelled).toBe(1);
      expect(pdfResult.refundedCredits).toBe(3);

      const [afterA, afterB, afterComp, afterUsed, afterPdf] = await Promise.all([
        httpDb.query.users.findFirst({
          where: (fields, { eq: eqOp }) => eqOp(fields.id, paidA),
        }),
        httpDb.query.users.findFirst({
          where: (fields, { eq: eqOp }) => eqOp(fields.id, paidB),
        }),
        httpDb.query.users.findFirst({
          where: (fields, { eq: eqOp }) => eqOp(fields.id, compId),
        }),
        httpDb.query.users.findFirst({
          where: (fields, { eq: eqOp }) => eqOp(fields.id, usedId),
        }),
        httpDb.query.users.findFirst({
          where: (fields, { eq: eqOp }) => eqOp(fields.id, pdfMemberId),
        }),
      ]);
      expect(afterA?.credits).toBe(10);
      expect(afterB?.credits).toBe(10);
      expect(afterComp?.credits).toBe(10);
      expect(afterUsed?.credits).toBe(8);
      expect(afterPdf?.credits).toBe(10);

      const refundsA = await httpDb
        .select()
        .from(creditLedger)
        .where(eq(creditLedger.userId, paidA));
      expect(refundsA.some((row) => row.type === "REFUND")).toBe(true);
      expect(
        refundsA.some(
          (row) =>
            row.type === "REFUND" &&
            row.idempotencyKey === `event-cancel-all:${bookedA.booking.id}`,
        ),
      ).toBe(true);

      const refundsComp = await httpDb
        .select()
        .from(creditLedger)
        .where(eq(creditLedger.userId, compId));
      expect(refundsComp.every((row) => row.type !== "REFUND")).toBe(true);

      const refundsUsed = await httpDb
        .select()
        .from(creditLedger)
        .where(eq(creditLedger.userId, usedId));
      expect(refundsUsed.every((row) => row.type !== "REFUND")).toBe(true);

      const cancelledA = await httpDb.query.bookings.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, bookedA.booking.id),
      });
      const cancelledB = await httpDb.query.bookings.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, bookedB.booking.id),
      });
      const cancelledComp = await httpDb.query.bookings.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, bookedComp.booking.id),
      });
      const stillUsed = await httpDb.query.bookings.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, bookedUsed.booking.id),
      });
      expect(cancelledA?.status).toBe("CANCELLED");
      expect(cancelledA?.cancellationReason).toBe("Venue cancelled the night");
      expect(cancelledA?.cancelledAt).toBeTruthy();
      expect(cancelledB?.status).toBe("CANCELLED");
      expect(cancelledComp?.status).toBe("CANCELLED");
      expect(stillUsed?.status).toBe("USED");

      const codes = await httpDb
        .select()
        .from(eventVoucherCodes)
        .where(eq(eventVoucherCodes.eventId, promoEvent.id));
      expect(codes).toHaveLength(4);
      expect(codes.filter((row) => row.status === "AVAILABLE")).toHaveLength(3);
      expect(codes.filter((row) => row.status === "ALLOCATED")).toHaveLength(1);
      expect(
        codes
          .filter((row) => row.status === "AVAILABLE")
          .every((row) => row.bookingTicketId == null),
      ).toBe(true);

      const pdfs = await httpDb
        .select()
        .from(eventVoucherPdfs)
        .where(eq(eventVoucherPdfs.eventId, pdfEvent.id));
      expect(pdfs).toHaveLength(1);
      expect(pdfs[0]?.status).toBe("AVAILABLE");
      expect(pdfs[0]?.bookingTicketId).toBeNull();

      const ticketsAfter = await listBookingTickets(httpDb, bookedA.booking.id);
      expect(ticketsAfter.every((ticket) => ticket.redemptionCode == null)).toBe(true);

      const promoAfter = await httpDb.query.events.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, promoEvent.id),
      });
      expect(promoAfter?.remainingCapacity).toBe(3);

      const waiter = await httpDb.query.waitlistEntries.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, waitJoin.entry.id),
      });
      expect(waiter?.status).toBe("CANCELLED");
      const waiterBookings = await httpDb
        .select()
        .from(bookings)
        .where(eq(bookings.userId, waiterId));
      expect(waiterBookings).toHaveLength(0);

      const promoted = await httpDb.query.waitlistEntries.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.userId, promotedId),
      });
      expect(promoted?.status).toBe("PROMOTED");

      const second = await cancelAllBookingsForEvent(txDb, {
        eventId: promoEvent.id,
        reason: "Venue cancelled the night",
        adminUserId: adminId,
      });
      expect(second.cancelled).toBe(0);
      expect(second.refundedCredits).toBe(0);
      expect(second.waitlistCancelled).toBe(0);
      expect(second.skippedUsed).toBe(1);
      expect(second.cancelledMembers).toHaveLength(0);
      expect(second.closedWaitlistMembers).toHaveLength(0);

      const promoAgain = await httpDb.query.events.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, promoEvent.id),
      });
      expect(promoAgain?.remainingCapacity).toBe(3);
      const paidAfterSecond = await httpDb.query.users.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, paidA),
      });
      expect(paidAfterSecond?.credits).toBe(10);

      const cancelledPdf = await httpDb.query.bookings.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, bookedPdf.booking.id),
      });
      expect(cancelledPdf?.status).toBe("CANCELLED");
    } finally {
      for (const event of [promoEvent, pdfEvent]) {
        await httpDb.delete(waitlistEntries).where(eq(waitlistEntries.eventId, event.id));
        const bookingIds = (
          await httpDb
            .select({ id: bookings.id })
            .from(bookings)
            .where(eq(bookings.eventId, event.id))
        ).map((row) => row.id);
        await purgeBookingTicketsForBookings(httpDb, bookingIds);
        await httpDb.delete(bookings).where(eq(bookings.eventId, event.id));
        await httpDb.delete(eventVoucherCodes).where(eq(eventVoucherCodes.eventId, event.id));
        await httpDb.delete(eventVoucherPdfs).where(eq(eventVoucherPdfs.eventId, event.id));
        await deleteEvent(httpDb, event.id, { skipBucket: true });
      }
      for (const id of [...memberIds, adminId]) {
        await httpDb.delete(creditLedger).where(eq(creditLedger.userId, id));
        await httpDb.delete(subscriptions).where(eq(subscriptions.userId, id));
        await httpDb.delete(users).where(eq(users.id, id));
      }
      await deletePartner(httpDb, partner.id, { skipBucket: true });
      await txDb.pool.end();
    }
  }, 60_000);
});
