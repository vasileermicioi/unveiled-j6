import { describe, expect, test } from "bun:test";
import { createDb } from "@unveiled/db";
import { createSolidJpeg } from "@unveiled/images";
import { eq } from "drizzle-orm";

import { featuredEvents } from "../schema/featured-events";
import { CatalogValidationError } from "./errors";
import { createEvent, deleteEvent, getEventById } from "./events";
import {
  addFeaturedEvent,
  listFeaturedEvents,
  removeFeaturedEvent,
  searchEventsNotFeatured,
} from "./featured-events";
import { createPartner, deletePartner } from "./partners";

const databaseUrl = process.env.DATABASE_URL;

async function createTestImageBuffer(): Promise<Buffer> {
  return createSolidJpeg(800, 420, { r: 250, g: 255, b: 134 });
}

describe("featured events integration", () => {
  test("add, duplicate rejection, remove keeps event, upcoming filter", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const image = await createTestImageBuffer();
    const partner = await createPartner(db, {
      name: `Featured Partner ${suffix}`,
      address: "Featuredstraße 1, Berlin",
      contactEmail: `featured-${suffix}@example.com`,
      logoUpload: image,
      skipUpload: true,
    });

    const now = new Date("2026-07-09T14:00:00.000Z");

    const upcoming = await createEvent(db, {
      partnerId: partner.id,
      title: `Featured Upcoming ${suffix}`,
      description: "Description",
      address: "Featuredstraße 1, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date("2026-07-10T18:00:00.000Z"),
      creditPrice: 1,
      secretCode: `FUP${suffix.slice(0, 5)}`,
      imageUpload: image,
      skipUpload: true,
    });

    const past = await createEvent(db, {
      partnerId: partner.id,
      title: `Featured Past ${suffix}`,
      description: "Description",
      address: "Featuredstraße 1, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date("2026-07-08T18:00:00.000Z"),
      creditPrice: 1,
      secretCode: `FPA${suffix.slice(0, 5)}`,
      imageUpload: image,
      skipUpload: true,
    });

    const notFeatured = await createEvent(db, {
      partnerId: partner.id,
      title: `Not Featured ${suffix}`,
      description: "Description",
      address: "Featuredstraße 1, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date("2026-07-11T18:00:00.000Z"),
      creditPrice: 1,
      secretCode: `NF${suffix.slice(0, 6)}`,
      imageUpload: image,
      skipUpload: true,
    });

    try {
      const addedUpcoming = await addFeaturedEvent(db, upcoming.id);
      expect(addedUpcoming.id).toBe(upcoming.id);

      const addedPast = await addFeaturedEvent(db, past.id);
      expect(addedPast.sortOrder).toBeGreaterThan(addedUpcoming.sortOrder);

      let duplicateError: unknown;
      try {
        await addFeaturedEvent(db, upcoming.id);
      } catch (error) {
        duplicateError = error;
      }
      expect(duplicateError).toBeInstanceOf(CatalogValidationError);
      expect((duplicateError as CatalogValidationError).code).toBe("ALREADY_FEATURED");

      const allFeatured = await listFeaturedEvents(db);
      const allIds = allFeatured.map((row) => row.id);
      expect(allIds).toContain(upcoming.id);
      expect(allIds).toContain(past.id);
      expect(allIds.indexOf(upcoming.id)).toBeLessThan(allIds.indexOf(past.id));

      const upcomingOnly = await listFeaturedEvents(db, { upcomingOnly: true, now });
      const upcomingIds = upcomingOnly.map((row) => row.id);
      expect(upcomingIds).toContain(upcoming.id);
      expect(upcomingIds).not.toContain(past.id);

      const candidates = await searchEventsNotFeatured(db, { q: suffix });
      const candidateIds = candidates.map((row) => row.id);
      expect(candidateIds).toContain(notFeatured.id);
      expect(candidateIds).not.toContain(upcoming.id);
      expect(candidateIds).not.toContain(past.id);

      await removeFeaturedEvent(db, upcoming.id);
      const afterRemove = await db
        .select()
        .from(featuredEvents)
        .where(eq(featuredEvents.eventId, upcoming.id));
      expect(afterRemove).toHaveLength(0);

      const eventStillExists = await getEventById(db, upcoming.id);
      expect(eventStillExists).not.toBeNull();
      expect(eventStillExists?.id).toBe(upcoming.id);
    } finally {
      await removeFeaturedEvent(db, upcoming.id);
      await removeFeaturedEvent(db, past.id);
      await deleteEvent(db, upcoming.id, { skipBucket: true });
      await deleteEvent(db, past.id, { skipBucket: true });
      await deleteEvent(db, notFeatured.id, { skipBucket: true });
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });

  test("deleting an event cascades featured membership", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const image = await createTestImageBuffer();
    const partner = await createPartner(db, {
      name: `Featured Cascade ${suffix}`,
      address: "Cascadestraße 1, Berlin",
      contactEmail: `featured-cascade-${suffix}@example.com`,
      logoUpload: image,
      skipUpload: true,
    });

    const event = await createEvent(db, {
      partnerId: partner.id,
      title: `Cascade Featured ${suffix}`,
      description: "Description",
      address: "Cascadestraße 1, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date("2026-07-15T18:00:00.000Z"),
      creditPrice: 1,
      secretCode: `FC${suffix.slice(0, 6)}`,
      imageUpload: image,
      skipUpload: true,
    });

    try {
      await addFeaturedEvent(db, event.id);
      await deleteEvent(db, event.id, { skipBucket: true });

      const featuredRows = await db
        .select()
        .from(featuredEvents)
        .where(eq(featuredEvents.eventId, event.id));
      expect(featuredRows).toHaveLength(0);
    } finally {
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });
});
