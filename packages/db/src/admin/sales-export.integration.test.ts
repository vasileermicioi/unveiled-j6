import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { berlinInclusiveDateRange } from "../catalog/datetime";
import { createTestImagePrebuilt } from "../catalog/test-image";
import { structuredLocationFromAddress } from "../catalog/test-location";

import {
  bookings,
  createDb,
  createEvent,
  createPartner,
  deleteEvent,
  deletePartner,
  formatSalesByEventCsv,
  listSalesByEvent,
  users,
} from "../index";

const databaseUrl = process.env.DATABASE_URL;

describe("listSalesByEvent (integration)", () => {
  test("aggregates CONFIRMED/USED in period, excludes CANCELLED/WAITLIST, includes zero-sales events", async () => {
    if (!databaseUrl) {
      console.warn("Skipping sales-export integration test (DATABASE_URL unset)");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const userId = `sales-user-${suffix}`;
    const partnerImage = await createTestImagePrebuilt();
    const eventImageA = await createTestImagePrebuilt();
    const eventImageB = await createTestImagePrebuilt();

    const partner = await createPartner(db, {
      name: `Sales Export Venue ${suffix.slice(0, 8)}`,
      ...structuredLocationFromAddress("Teststraße 22, Berlin"),
      contactEmail: `sales-${suffix}@example.com`,
      logoPrebuilt: partnerImage,
      skipUpload: true,
    });

    const eventA = await createEvent(db, {
      partnerId: partner.id,
      title: `Sales Event A ${suffix.slice(0, 8)}`,
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 22, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTimes: [new Date("2026-09-01T18:00:00.000Z")],
      creditPrice: 2,
      totalCapacity: 20,
      secretCode: "SALESA",
      imagePrebuilt: eventImageA,
      skipUpload: true,
    });

    const eventB = await createEvent(db, {
      partnerId: partner.id,
      title: `Sales Event B ${suffix.slice(0, 8)}`,
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 22, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTimes: [new Date("2026-09-02T18:00:00.000Z")],
      creditPrice: 2,
      totalCapacity: 20,
      secretCode: "SALESB",
      imagePrebuilt: eventImageB,
      skipUpload: true,
    });

    const inPeriod = new Date("2026-07-15T12:00:00.000Z");
    const outsidePeriod = new Date("2026-06-01T12:00:00.000Z");
    const period = { from: "2026-07-01", to: "2026-07-31" };
    const range = berlinInclusiveDateRange(period.from, period.to);
    expect(inPeriod.getTime()).toBeGreaterThanOrEqual(range.start.getTime());
    expect(inPeriod.getTime()).toBeLessThan(range.end.getTime());

    try {
      await db.insert(users).values({
        id: userId,
        email: `${userId}@example.com`,
        emailVerified: true,
        credits: 50,
        role: "USER",
      });

      await db.insert(bookings).values([
        {
          userId,
          eventId: eventA.id,
          partnerId: partner.id,
          dateTime: eventA.dateTime,
          ticketsCount: 2,
          totalCredits: 4,
          status: "CONFIRMED",
          idempotencyKey: `sales-confirmed-${suffix}`,
          createdAt: inPeriod,
          updatedAt: inPeriod,
        },
        {
          userId,
          eventId: eventA.id,
          partnerId: partner.id,
          dateTime: eventA.dateTime,
          ticketsCount: 1,
          totalCredits: 2,
          status: "USED",
          idempotencyKey: `sales-used-${suffix}`,
          createdAt: inPeriod,
          updatedAt: inPeriod,
        },
        {
          userId,
          eventId: eventA.id,
          partnerId: partner.id,
          dateTime: eventA.dateTime,
          ticketsCount: 5,
          totalCredits: 10,
          status: "CANCELLED",
          idempotencyKey: `sales-cancelled-${suffix}`,
          createdAt: inPeriod,
          updatedAt: inPeriod,
        },
        {
          userId,
          eventId: eventA.id,
          partnerId: partner.id,
          dateTime: eventA.dateTime,
          ticketsCount: 4,
          totalCredits: 8,
          status: "WAITLIST",
          idempotencyKey: `sales-waitlist-${suffix}`,
          createdAt: inPeriod,
          updatedAt: inPeriod,
        },
        {
          userId,
          eventId: eventA.id,
          partnerId: partner.id,
          dateTime: eventA.dateTime,
          ticketsCount: 3,
          totalCredits: 6,
          status: "CONFIRMED",
          idempotencyKey: `sales-outside-${suffix}`,
          createdAt: outsidePeriod,
          updatedAt: outsidePeriod,
        },
      ]);

      const rows = await listSalesByEvent(db, period);
      const rowA = rows.find((row) => row.eventId === eventA.id);
      const rowB = rows.find((row) => row.eventId === eventB.id);

      expect(rowA).toBeDefined();
      expect(rowB).toBeDefined();
      expect(rowA?.ticketsSold).toBe(3);
      expect(rowB?.ticketsSold).toBe(0);
      expect(rowA?.partnerName).toBe(partner.name);
      expect(rowA?.title).toBe(eventA.title);

      const byTitle = await listSalesByEvent(db, {
        ...period,
        title: `Event A ${suffix.slice(0, 8)}`,
      });
      expect(byTitle.map((row) => row.eventId)).toEqual([eventA.id]);

      const byPartner = await listSalesByEvent(db, {
        ...period,
        partner: `Venue ${suffix.slice(0, 8)}`,
      });
      expect(byPartner.map((row) => row.eventId).sort()).toEqual([eventA.id, eventB.id].sort());

      const byBoth = await listSalesByEvent(db, {
        ...period,
        title: "Event B",
        partner: partner.name.slice(0, 12),
      });
      expect(byBoth.map((row) => row.eventId)).toEqual([eventB.id]);

      // Highest tickets first
      const indexA = rows.findIndex((row) => row.eventId === eventA.id);
      const indexB = rows.findIndex((row) => row.eventId === eventB.id);
      expect(indexA).toBeLessThan(indexB);

      const csv = formatSalesByEventCsv(byTitle);
      expect(csv).toContain(eventA.id);
      expect(csv).not.toContain(eventB.id);
      expect(csv).toContain(",3\n");
    } finally {
      await db.delete(bookings).where(eq(bookings.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
      await deleteEvent(db, eventA.id);
      await deleteEvent(db, eventB.id);
      await deletePartner(db, partner.id);
    }
  });
});
