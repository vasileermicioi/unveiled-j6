import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { createTestImagePrebuilt } from "../catalog/test-image";
import { structuredLocationFromAddress } from "../catalog/test-location";

import {
  bookEvent,
  bookings,
  createCompTicket,
  createDb,
  createEvent,
  createPartner,
  createTxDb,
  creditLedger,
  deleteEvent,
  deletePartner,
  joinWaitlist,
  listEventBookings,
  listEventsWithBookingStats,
  purgeBookingTicketsForBookings,
  subscriptions,
  users,
  waitlistEntries,
} from "../index";

const databaseUrl = process.env.DATABASE_URL;
const location = structuredLocationFromAddress("Teststraße 12, Berlin");

describe("listEventBookings / listEventsWithBookingStats (integration)", () => {
  test("paginates, filters by status/title/partner, and includes booking-only and waitlist-only events", async () => {
    if (!databaseUrl) {
      console.warn("Skipping list-event-bookings integration test (DATABASE_URL unset)");
      return;
    }

    const httpDb = createDb(databaseUrl);
    const txDb = createTxDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const token = `lst-${suffix.slice(0, 8)}`;
    const paidId = `lst-paid-${suffix}`;
    const compId = `lst-comp-${suffix}`;
    const waiterId = `lst-wait-${suffix}`;
    const otherPaidId = `lst-other-${suffix}`;
    const adminId = `lst-admin-${suffix}`;

    const partnerImageA = await createTestImagePrebuilt();
    const partnerImageB = await createTestImagePrebuilt();
    const imageMixed = await createTestImagePrebuilt();
    const imageWait = await createTestImagePrebuilt();
    const imageOther = await createTestImagePrebuilt();

    const partnerA = await createPartner(httpDb, {
      name: `List Alpha ${token}`,
      ...location,
      contactEmail: `lst-a-${suffix}@example.com`,
      logoPrebuilt: partnerImageA,
      skipUpload: true,
    });
    const partnerB = await createPartner(httpDb, {
      name: `List Beta ${token}`,
      ...location,
      contactEmail: `lst-b-${suffix}@example.com`,
      logoPrebuilt: partnerImageB,
      skipUpload: true,
    });

    const mixedEvent = await createEvent(httpDb, {
      partnerId: partnerA.id,
      title: `Mixed ${token}`,
      description: "Description",
      ...location,
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date(Date.now() + 86_400_000)],
      creditPrice: 2,
      totalCapacity: 10,
      secretCode: `MX${token.slice(0, 6)}`,
      imagePrebuilt: imageMixed,
      skipUpload: true,
    });
    const waitlistOnly = await createEvent(httpDb, {
      partnerId: partnerA.id,
      title: `Waitonly ${token}`,
      description: "Description",
      ...location,
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date(Date.now() + 172_800_000)],
      creditPrice: 2,
      totalCapacity: 10,
      secretCode: `WO${token.slice(0, 6)}`,
      imagePrebuilt: imageWait,
      skipUpload: true,
    });
    const otherPartnerEvent = await createEvent(httpDb, {
      partnerId: partnerB.id,
      title: `Other ${token}`,
      description: "Description",
      ...location,
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date(Date.now() + 259_200_000)],
      creditPrice: 1,
      totalCapacity: 10,
      secretCode: `OT${token.slice(0, 6)}`,
      imagePrebuilt: imageOther,
      skipUpload: true,
    });

    const events = [mixedEvent, waitlistOnly, otherPartnerEvent];
    const memberIds = [paidId, compId, waiterId, otherPaidId];

    try {
      await httpDb.insert(users).values([
        {
          id: adminId,
          email: `${adminId}@example.com`,
          emailVerified: true,
          credits: 0,
          role: "ADMIN",
          profile: { first_name: "Ada", last_name: "Admin" },
        },
        {
          id: paidId,
          email: `${paidId}@example.com`,
          emailVerified: true,
          credits: 10,
          role: "USER",
          profile: { first_name: "Pat", last_name: "Paid" },
        },
        {
          id: compId,
          email: `${compId}@example.com`,
          emailVerified: true,
          credits: 10,
          role: "USER",
          profile: { first_name: "Cam", last_name: "Comp" },
        },
        {
          id: waiterId,
          email: `${waiterId}@example.com`,
          emailVerified: true,
          credits: 10,
          role: "USER",
        },
        {
          id: otherPaidId,
          email: `${otherPaidId}@example.com`,
          emailVerified: true,
          credits: 10,
          role: "USER",
        },
      ]);
      await httpDb.insert(subscriptions).values(
        memberIds.map((userId) => ({
          userId,
          status: "ACTIVE" as const,
          plan: "Basic Berlin",
        })),
      );

      await bookEvent(txDb, {
        userId: paidId,
        eventId: mixedEvent.id,
        ticketsCount: 1,
        idempotencyKey: `lst-paid-${suffix}`,
      });
      await createCompTicket(txDb, {
        userId: compId,
        eventId: mixedEvent.id,
        idempotencyKey: `lst-comp-${suffix}`,
        adminUserId: adminId,
      });
      await joinWaitlist(httpDb, {
        userId: waiterId,
        eventId: waitlistOnly.id,
        requestedQty: 1,
      });
      await bookEvent(txDb, {
        userId: otherPaidId,
        eventId: otherPartnerEvent.id,
        ticketsCount: 1,
        idempotencyKey: `lst-other-${suffix}`,
      });

      const listed = await listEventBookings(httpDb, { eventId: mixedEvent.id, limit: 1 });
      expect(listed.total).toBe(2);
      expect(listed.items).toHaveLength(1);
      expect(listed.items[0]?.userEmail).toBeTruthy();
      expect(listed.items[0]?.userProfile).toBeTruthy();

      const page2 = await listEventBookings(httpDb, {
        eventId: mixedEvent.id,
        page: 2,
        limit: 1,
      });
      expect(page2.items).toHaveLength(1);
      expect(page2.items[0]?.id).not.toBe(listed.items[0]?.id);

      const confirmedOnly = await listEventBookings(httpDb, {
        eventId: mixedEvent.id,
        status: "CONFIRMED",
      });
      expect(confirmedOnly.total).toBe(2);
      expect(confirmedOnly.items.every((row) => row.status === "CONFIRMED")).toBe(true);

      const paidRow = confirmedOnly.items.find((row) => row.userId === paidId);
      expect(paidRow?.userEmail).toBe(`${paidId}@example.com`);
      expect(paidRow?.userProfile.first_name).toBe("Pat");

      const byTitle = await listEventsWithBookingStats(httpDb, { title: token });
      expect(byTitle.total).toBe(3);
      expect(byTitle.items.map((row) => row.eventId).sort()).toEqual(
        events.map((event) => event.id).sort(),
      );

      const paged = await listEventsWithBookingStats(httpDb, { title: token, limit: 2, page: 1 });
      expect(paged.total).toBe(3);
      expect(paged.items).toHaveLength(2);
      expect(paged.items[0]?.dateTime.getTime()).toBeGreaterThanOrEqual(
        paged.items[1]?.dateTime.getTime() ?? 0,
      );

      const pageTwo = await listEventsWithBookingStats(httpDb, { title: token, limit: 2, page: 2 });
      expect(pageTwo.items).toHaveLength(1);

      const byPartner = await listEventsWithBookingStats(httpDb, {
        title: token,
        partner: "Alpha",
      });
      expect(byPartner.items.every((row) => row.partnerName.includes("Alpha"))).toBe(true);
      expect(byPartner.items.some((row) => row.eventId === otherPartnerEvent.id)).toBe(false);

      const mixedStats = byTitle.items.find((row) => row.eventId === mixedEvent.id);
      expect(mixedStats?.confirmedCount).toBe(2);
      expect(mixedStats?.usedCount).toBe(0);
      expect(mixedStats?.cancelledCount).toBe(0);
      expect(mixedStats?.waitingCount).toBe(0);
      expect(mixedStats?.refundableCredits).toBe(2);
      expect(mixedStats?.compConfirmedCount).toBe(1);
      expect(mixedStats?.remainingCapacity).toBe(8);
      expect(mixedStats?.totalCapacity).toBe(10);

      const waitStats = byTitle.items.find((row) => row.eventId === waitlistOnly.id);
      expect(waitStats?.confirmedCount).toBe(0);
      expect(waitStats?.waitingCount).toBe(1);
      expect(waitStats?.refundableCredits).toBe(0);
      expect(waitStats?.compConfirmedCount).toBe(0);

      const one = await listEventsWithBookingStats(httpDb, { eventId: mixedEvent.id });
      expect(one.total).toBe(1);
      expect(one.items[0]?.eventId).toBe(mixedEvent.id);
    } finally {
      for (const event of events) {
        await httpDb.delete(waitlistEntries).where(eq(waitlistEntries.eventId, event.id));
        const bookingIds = (
          await httpDb
            .select({ id: bookings.id })
            .from(bookings)
            .where(eq(bookings.eventId, event.id))
        ).map((row) => row.id);
        await purgeBookingTicketsForBookings(httpDb, bookingIds);
        await httpDb.delete(bookings).where(eq(bookings.eventId, event.id));
        await deleteEvent(httpDb, event.id, { skipBucket: true });
      }
      for (const id of [...memberIds, adminId]) {
        await httpDb.delete(creditLedger).where(eq(creditLedger.userId, id));
        await httpDb.delete(subscriptions).where(eq(subscriptions.userId, id));
        await httpDb.delete(users).where(eq(users.id, id));
      }
      await deletePartner(httpDb, partnerA.id, { skipBucket: true });
      await deletePartner(httpDb, partnerB.id, { skipBucket: true });
      await txDb.pool.end();
    }
  }, 60_000);
});
