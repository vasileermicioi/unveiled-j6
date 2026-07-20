import { describe, expect, test } from "bun:test";
import { createDb, users } from "@unveiled/db";
import { createSolidJpeg } from "@unveiled/images";
import { eq } from "drizzle-orm";

import { getBerlinCalendarDate } from "./datetime";
import {
  isEventSaved,
  listMemberFeedEvents,
  listMemberFeedMapEvents,
  listSavedEventIds,
  listSavedUpcomingEvents,
  MEMBER_FEED_MAP_MAX,
  saveEvent,
  unsaveEvent,
} from "./discovery";
import { createEvent, deleteEvent } from "./events";
import { createPartner, deletePartner } from "./partners";

const databaseUrl = process.env.DATABASE_URL;

async function createTestImageBuffer(): Promise<Buffer> {
  return createSolidJpeg(800, 420, { r: 250, g: 255, b: 134 });
}

async function insertTestUser(db: ReturnType<typeof createDb>, suffix: string) {
  const id = `discovery-test-${suffix}`;
  await db.insert(users).values({
    id,
    email: `${id}@example.com`,
    emailVerified: false,
    role: "USER",
    credits: 17,
  });
  return id;
}

describe("discovery integration", () => {
  test("defaults to all upcoming soonest-first and excludes past events", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const image = await createTestImageBuffer();
    const partner = await createPartner(db, {
      name: `Discovery Upcoming ${suffix}`,
      address: "Discoverystraße 1, Berlin",
      contactEmail: `discovery-upcoming-${suffix}@example.com`,
      logoUpload: image,
      skipUpload: true,
    });

    // Fixed "now": 2026-07-09 14:00 UTC = 16:00 CEST
    const now = new Date("2026-07-09T14:00:00.000Z");
    expect(getBerlinCalendarDate(now)).toBe("2026-07-09");

    const todayFuture = await createEvent(db, {
      partnerId: partner.id,
      title: `Today Future ${suffix}`,
      description: "Description",
      address: "Discoverystraße 1, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date("2026-07-09T18:00:00.000Z"),
      creditPrice: 1,
      secretCode: `TODAYF${suffix.slice(0, 4)}`,
      imageUpload: image,
      skipUpload: true,
    });

    const todayPast = await createEvent(db, {
      partnerId: partner.id,
      title: `Today Past ${suffix}`,
      description: "Description",
      address: "Discoverystraße 1, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date("2026-07-09T10:00:00.000Z"),
      creditPrice: 1,
      secretCode: `TODAYP${suffix.slice(0, 4)}`,
      imageUpload: image,
      skipUpload: true,
    });

    const tomorrow = await createEvent(db, {
      partnerId: partner.id,
      title: `Tomorrow ${suffix}`,
      description: "Description",
      address: "Discoverystraße 1, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date("2026-07-10T18:00:00.000Z"),
      creditPrice: 1,
      secretCode: `TOMOR${suffix.slice(0, 4)}`,
      imageUpload: image,
      skipUpload: true,
    });

    try {
      const feed = await listMemberFeedEvents(db, { now });
      const ids = feed.items.map((row) => row.id);
      expect(ids).toContain(todayFuture.id);
      expect(ids).toContain(tomorrow.id);
      expect(ids).not.toContain(todayPast.id);
      expect(ids.indexOf(todayFuture.id)).toBeLessThan(ids.indexOf(tomorrow.id));
      expect(feed.total).toBeGreaterThanOrEqual(2);
    } finally {
      await deleteEvent(db, todayFuture.id, { skipBucket: true });
      await deleteEvent(db, todayPast.id, { skipBucket: true });
      await deleteEvent(db, tomorrow.id, { skipBucket: true });
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });

  test("custom date range narrows upcoming and supports category/partner filters", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const image = await createTestImageBuffer();
    const partnerA = await createPartner(db, {
      name: `Discovery A ${suffix}`,
      address: "Filterstraße 1, Berlin",
      contactEmail: `discovery-a-${suffix}@example.com`,
      logoUpload: image,
      skipUpload: true,
    });
    const partnerB = await createPartner(db, {
      name: `Discovery B ${suffix}`,
      address: "Filterstraße 2, Berlin",
      contactEmail: `discovery-b-${suffix}@example.com`,
      logoUpload: image,
      skipUpload: true,
    });

    const now = new Date("2026-07-09T08:00:00.000Z");

    const categoryTheater = `Theater-${suffix}`;
    const categoryMusic = `Music-${suffix}`;

    const theaterA = await createEvent(db, {
      partnerId: partnerA.id,
      title: `Theater A ${suffix}`,
      description: "Description",
      address: "Filterstraße 1, Berlin",
      neighborhood: "Mitte",
      category: categoryTheater,
      eventType: "Performance",
      dateTime: new Date("2026-07-11T18:00:00.000Z"),
      creditPrice: 1,
      secretCode: `THA${suffix.slice(0, 5)}`,
      imageUpload: image,
      skipUpload: true,
    });

    const musicA = await createEvent(db, {
      partnerId: partnerA.id,
      title: `Music A ${suffix}`,
      description: "Description",
      address: "Filterstraße 1, Berlin",
      neighborhood: "Mitte",
      category: categoryMusic,
      eventType: "Concert",
      dateTime: new Date("2026-07-11T20:00:00.000Z"),
      creditPrice: 1,
      secretCode: `MUA${suffix.slice(0, 5)}`,
      imageUpload: image,
      skipUpload: true,
    });

    const theaterB = await createEvent(db, {
      partnerId: partnerB.id,
      title: `Theater B ${suffix}`,
      description: "Description",
      address: "Filterstraße 2, Berlin",
      neighborhood: "Kreuzberg",
      category: categoryTheater,
      eventType: "Performance",
      dateTime: new Date("2026-07-11T19:00:00.000Z"),
      creditPrice: 1,
      secretCode: `THB${suffix.slice(0, 5)}`,
      imageUpload: image,
      skipUpload: true,
    });

    try {
      const ranged = await listMemberFeedEvents(db, {
        from: "2026-07-11",
        to: "2026-07-11",
        now,
      });
      const rangedIds = new Set(ranged.items.map((row) => row.id));
      expect(rangedIds.has(theaterA.id)).toBe(true);
      expect(rangedIds.has(musicA.id)).toBe(true);
      expect(rangedIds.has(theaterB.id)).toBe(true);

      const byCategory = await listMemberFeedEvents(db, {
        from: "2026-07-11",
        to: "2026-07-11",
        category: categoryTheater,
        now,
      });
      expect(byCategory.items.map((row) => row.id).sort()).toEqual(
        [theaterA.id, theaterB.id].sort(),
      );
      expect(byCategory.total).toBe(2);

      const byCategories = await listMemberFeedEvents(db, {
        from: "2026-07-11",
        to: "2026-07-11",
        category: [categoryTheater, categoryMusic],
        now,
      });
      expect(byCategories.items.map((row) => row.id).sort()).toEqual(
        [theaterA.id, musicA.id, theaterB.id].sort(),
      );

      const byPartner = await listMemberFeedEvents(db, {
        from: "2026-07-11",
        to: "2026-07-11",
        partnerId: partnerA.id,
        now,
      });
      expect(byPartner.items.map((row) => row.id).sort()).toEqual([theaterA.id, musicA.id].sort());

      const byPartners = await listMemberFeedEvents(db, {
        from: "2026-07-11",
        to: "2026-07-11",
        partnerId: [partnerA.id, partnerB.id],
        now,
      });
      expect(byPartners.items.map((row) => row.id).sort()).toEqual(
        [theaterA.id, musicA.id, theaterB.id].sort(),
      );

      const empty = await listMemberFeedEvents(db, {
        from: "2026-07-11",
        to: "2026-07-11",
        category: `NoSuchCategory-${suffix}`,
        now,
      });
      expect(empty.items).toEqual([]);
      expect(empty.total).toBe(0);
    } finally {
      await deleteEvent(db, theaterA.id, { skipBucket: true });
      await deleteEvent(db, musicA.id, { skipBucket: true });
      await deleteEvent(db, theaterB.id, { skipBucket: true });
      await deletePartner(db, partnerA.id, { skipBucket: true });
      await deletePartner(db, partnerB.id, { skipBucket: true });
    }
  });

  test("listMemberFeedMapEvents returns full filtered set without page slice and includes events without coords", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const image = await createTestImageBuffer();
    const partner = await createPartner(db, {
      name: `Discovery Map ${suffix}`,
      address: "Mapstraße 1, Berlin",
      contactEmail: `discovery-map-${suffix}@example.com`,
      logoUpload: image,
      skipUpload: true,
    });

    const now = new Date("2026-07-09T08:00:00.000Z");

    const withCoords = await createEvent(db, {
      partnerId: partner.id,
      title: `Map Coords ${suffix}`,
      description: "Description",
      address: "Mapstraße 1, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date("2026-07-12T18:00:00.000Z"),
      creditPrice: 1,
      secretCode: `MPC${suffix.slice(0, 5)}`,
      imageUpload: image,
      skipUpload: true,
      lat: "52.520000",
      lng: "13.405000",
    });

    const withoutCoords = await createEvent(db, {
      partnerId: partner.id,
      title: `Map NoCoords ${suffix}`,
      description: "Description",
      address: "Mapstraße 2, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date("2026-07-12T19:00:00.000Z"),
      creditPrice: 1,
      secretCode: `MPN${suffix.slice(0, 5)}`,
      imageUpload: image,
      skipUpload: true,
    });

    const past = await createEvent(db, {
      partnerId: partner.id,
      title: `Map Past ${suffix}`,
      description: "Description",
      address: "Mapstraße 3, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date("2026-07-09T06:00:00.000Z"),
      creditPrice: 1,
      secretCode: `MPP${suffix.slice(0, 5)}`,
      imageUpload: image,
      skipUpload: true,
      lat: "52.510000",
      lng: "13.400000",
    });

    try {
      const mapResult = await listMemberFeedMapEvents(db, {
        from: "2026-07-12",
        to: "2026-07-12",
        now,
      });
      const ids = mapResult.items.map((row) => row.id);
      expect(ids).toContain(withCoords.id);
      expect(ids).toContain(withoutCoords.id);
      expect(ids).not.toContain(past.id);
      expect(mapResult.total).toBeGreaterThanOrEqual(2);
      expect(mapResult.items.length).toBeLessThanOrEqual(MEMBER_FEED_MAP_MAX);

      const byCategory = await listMemberFeedMapEvents(db, {
        from: "2026-07-12",
        to: "2026-07-12",
        category: "Theater",
        partnerId: partner.id,
        now,
      });
      expect(byCategory.items.map((row) => row.id).sort()).toEqual(
        [withCoords.id, withoutCoords.id].sort(),
      );
    } finally {
      await deleteEvent(db, withCoords.id, { skipBucket: true });
      await deleteEvent(db, withoutCoords.id, { skipBucket: true });
      await deleteEvent(db, past.id, { skipBucket: true });
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });

  test("save/unsave is idempotent and listSavedUpcomingEvents ignores today default", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const image = await createTestImageBuffer();
    const userId = await insertTestUser(db, suffix);
    const partner = await createPartner(db, {
      name: `Discovery Save ${suffix}`,
      address: "Savestraße 1, Berlin",
      contactEmail: `discovery-save-${suffix}@example.com`,
      logoUpload: image,
      skipUpload: true,
    });

    const now = new Date("2026-07-09T14:00:00.000Z");

    const todayEvent = await createEvent(db, {
      partnerId: partner.id,
      title: `Saved Today ${suffix}`,
      description: "Description",
      address: "Savestraße 1, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date("2026-07-09T18:00:00.000Z"),
      creditPrice: 1,
      secretCode: `SVT${suffix.slice(0, 5)}`,
      imageUpload: image,
      skipUpload: true,
    });

    const laterEvent = await createEvent(db, {
      partnerId: partner.id,
      title: `Saved Later ${suffix}`,
      description: "Description",
      address: "Savestraße 1, Berlin",
      neighborhood: "Mitte",
      category: "Music",
      eventType: "Concert",
      dateTime: new Date("2026-07-15T18:00:00.000Z"),
      creditPrice: 1,
      secretCode: `SVL${suffix.slice(0, 5)}`,
      imageUpload: image,
      skipUpload: true,
    });

    const pastEvent = await createEvent(db, {
      partnerId: partner.id,
      title: `Saved Past ${suffix}`,
      description: "Description",
      address: "Savestraße 1, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date("2026-07-09T10:00:00.000Z"),
      creditPrice: 1,
      secretCode: `SVP${suffix.slice(0, 5)}`,
      imageUpload: image,
      skipUpload: true,
    });

    try {
      await saveEvent(db, userId, todayEvent.id);
      await saveEvent(db, userId, todayEvent.id);
      await saveEvent(db, userId, laterEvent.id);
      await saveEvent(db, userId, pastEvent.id);

      expect(await isEventSaved(db, userId, todayEvent.id)).toBe(true);
      expect((await listSavedEventIds(db, userId)).sort()).toEqual(
        [todayEvent.id, laterEvent.id, pastEvent.id].sort(),
      );

      const upcoming = await listSavedUpcomingEvents(db, userId, now);
      expect(upcoming.map((row) => row.id)).toEqual([todayEvent.id, laterEvent.id]);

      await unsaveEvent(db, userId, todayEvent.id);
      await unsaveEvent(db, userId, todayEvent.id);
      expect(await isEventSaved(db, userId, todayEvent.id)).toBe(false);
      expect((await listSavedEventIds(db, userId)).sort()).toEqual(
        [laterEvent.id, pastEvent.id].sort(),
      );
    } finally {
      await deleteEvent(db, todayEvent.id, { skipBucket: true });
      await deleteEvent(db, laterEvent.id, { skipBucket: true });
      await deleteEvent(db, pastEvent.id, { skipBucket: true });
      await deletePartner(db, partner.id, { skipBucket: true });
      await db.delete(users).where(eq(users.id, userId));
    }
  });
});
