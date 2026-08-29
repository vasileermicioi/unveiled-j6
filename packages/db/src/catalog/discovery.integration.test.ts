import { describe, expect, test } from "bun:test";
import { createDb, users } from "@unveiled/db";
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
import { deleteEvent } from "./events";
import { createPartner, deletePartner } from "./partners";
import { createTestImagePrebuilt } from "./test-image";
import { structuredLocationFromAddress } from "./test-location";
import { createPublishedEvent } from "./test-published-event";

const databaseUrl = process.env.DATABASE_URL;

async function createTestImage() {
  return createTestImagePrebuilt();
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
    const partnerImage = await createTestImage();
    const partner = await createPartner(db, {
      name: `Discovery Upcoming ${suffix}`,
      ...structuredLocationFromAddress("Discoverystraße 1, Berlin"),
      contactEmail: `discovery-upcoming-${suffix}@example.com`,
      logoPrebuilt: partnerImage,
      skipUpload: true,
    });

    // Fixed "now": 2026-07-09 14:00 UTC = 16:00 CEST
    const now = new Date("2026-07-09T14:00:00.000Z");
    expect(getBerlinCalendarDate(now)).toBe("2026-07-09");

    const todayFuture = await createPublishedEvent(db, {
      partnerId: partner.id,
      title: `Today Future ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Discoverystraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date("2026-07-09T18:00:00.000Z")],
      creditPrice: 1,
      secretCode: `TODAYF${suffix.slice(0, 4)}`,
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });

    const todayPast = await createPublishedEvent(db, {
      partnerId: partner.id,
      title: `Today Past ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Discoverystraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date("2026-07-09T10:00:00.000Z")],
      creditPrice: 1,
      secretCode: `TODAYP${suffix.slice(0, 4)}`,
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });

    const tomorrow = await createPublishedEvent(db, {
      partnerId: partner.id,
      title: `Tomorrow ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Discoverystraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date("2026-07-10T18:00:00.000Z")],
      creditPrice: 1,
      secretCode: `TOMOR${suffix.slice(0, 4)}`,
      imagePrebuilt: await createTestImage(),
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

  test("period filter clamps past from to Berlin today and excludes past events", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const partnerImage = await createTestImage();
    const partner = await createPartner(db, {
      name: `Discovery Past Range ${suffix}`,
      ...structuredLocationFromAddress("Paststraße 1, Berlin"),
      contactEmail: `discovery-past-range-${suffix}@example.com`,
      logoPrebuilt: partnerImage,
      skipUpload: true,
    });

    const now = new Date("2026-07-09T14:00:00.000Z");
    const past = await createPublishedEvent(db, {
      partnerId: partner.id,
      title: `Past In Range ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Paststraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date("2026-07-07T18:00:00.000Z")],
      creditPrice: 1,
      secretCode: `PAST${suffix.slice(0, 4)}`,
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });
    const todayFuture = await createPublishedEvent(db, {
      partnerId: partner.id,
      title: `Today Future Clamp ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Paststraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date("2026-07-09T18:00:00.000Z")],
      creditPrice: 1,
      secretCode: `TFCL${suffix.slice(0, 4)}`,
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });
    const todayPast = await createPublishedEvent(db, {
      partnerId: partner.id,
      title: `Today Past Clamp ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Paststraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date("2026-07-09T10:00:00.000Z")],
      creditPrice: 1,
      secretCode: `TPCL${suffix.slice(0, 4)}`,
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });
    const future = await createPublishedEvent(db, {
      partnerId: partner.id,
      title: `Future Outside Range ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Paststraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date("2026-07-12T18:00:00.000Z")],
      creditPrice: 1,
      secretCode: `FUTR${suffix.slice(0, 4)}`,
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });

    try {
      const defaultFeed = await listMemberFeedEvents(db, { now });
      expect(defaultFeed.items.map((row) => row.id)).not.toContain(past.id);

      // Past-only range: after clamp from→today > to→past day → empty
      const pastOnly = await listMemberFeedEvents(db, {
        now,
        from: "2026-07-07",
        to: "2026-07-07",
      });
      expect(pastOnly.items.map((row) => row.id)).not.toContain(past.id);
      expect(pastOnly.total).toBe(0);

      // from before today clamped to today; still excludes already-started showtimes
      const clamped = await listMemberFeedEvents(db, {
        now,
        from: "2026-07-07",
        to: "2026-07-09",
      });
      const clampedIds = new Set(clamped.items.map((row) => row.id));
      expect(clampedIds.has(past.id)).toBe(false);
      expect(clampedIds.has(todayPast.id)).toBe(false);
      expect(clampedIds.has(todayFuture.id)).toBe(true);
      expect(clampedIds.has(future.id)).toBe(false);
    } finally {
      await deleteEvent(db, past.id, { skipBucket: true });
      await deleteEvent(db, todayFuture.id, { skipBucket: true });
      await deleteEvent(db, todayPast.id, { skipBucket: true });
      await deleteEvent(db, future.id, { skipBucket: true });
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });

  test("title filter matches case-insensitive substring", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const partner = await createPartner(db, {
      name: `Discovery Title ${suffix}`,
      ...structuredLocationFromAddress("Titlestraße 1, Berlin"),
      contactEmail: `discovery-title-${suffix}@example.com`,
      logoPrebuilt: await createTestImage(),
      skipUpload: true,
    });

    const now = new Date("2026-07-09T08:00:00.000Z");
    const match = await createPublishedEvent(db, {
      partnerId: partner.id,
      title: `Neon Jazz Night ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Titlestraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "live_music_venue",
      eventType: "concert",
      dateTimes: [new Date("2026-07-11T18:00:00.000Z")],
      creditPrice: 1,
      secretCode: `TITL${suffix.slice(0, 4)}`,
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });
    const other = await createPublishedEvent(db, {
      partnerId: partner.id,
      title: `Silent Reading ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Titlestraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date("2026-07-11T19:00:00.000Z")],
      creditPrice: 1,
      secretCode: `OTHR${suffix.slice(0, 4)}`,
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });

    try {
      const byTitle = await listMemberFeedEvents(db, {
        now,
        title: "jazz",
        partnerId: partner.id,
      });
      expect(byTitle.items.map((row) => row.id)).toEqual([match.id]);
      expect(byTitle.total).toBe(1);

      const mapByTitle = await listMemberFeedMapEvents(db, {
        now,
        title: "  JAZZ  ",
        partnerId: partner.id,
      });
      expect(mapByTitle.items.map((row) => row.id)).toEqual([match.id]);

      const noMatch = await listMemberFeedEvents(db, {
        now,
        title: "ballet",
        partnerId: partner.id,
      });
      expect(noMatch.items).toEqual([]);
      expect(noMatch.total).toBe(0);
      expect(other.id).toBeTruthy();
    } finally {
      await deleteEvent(db, match.id, { skipBucket: true });
      await deleteEvent(db, other.id, { skipBucket: true });
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
    const partnerA = await createPartner(db, {
      name: `Discovery A ${suffix}`,
      ...structuredLocationFromAddress("Filterstraße 1, Berlin"),
      contactEmail: `discovery-a-${suffix}@example.com`,
      logoPrebuilt: await createTestImage(),
      skipUpload: true,
    });
    const partnerB = await createPartner(db, {
      name: `Discovery B ${suffix}`,
      ...structuredLocationFromAddress("Filterstraße 2, Berlin"),
      contactEmail: `discovery-b-${suffix}@example.com`,
      logoPrebuilt: await createTestImage(),
      skipUpload: true,
    });

    const now = new Date("2026-07-09T08:00:00.000Z");

    const categoryTheater = "theater";
    const categoryMusic = "live_music_venue";
    const testPartnerIds = [partnerA.id, partnerB.id];

    const theaterA = await createPublishedEvent(db, {
      partnerId: partnerA.id,
      title: `Theater A ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Filterstraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: categoryTheater,
      eventType: "theater_play",
      dateTimes: [new Date("2026-07-11T18:00:00.000Z")],
      creditPrice: 1,
      secretCode: `THA${suffix.slice(0, 5)}`,
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });

    const musicA = await createPublishedEvent(db, {
      partnerId: partnerA.id,
      title: `Music A ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Filterstraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: categoryMusic,
      eventType: "concert",
      dateTimes: [new Date("2026-07-11T20:00:00.000Z")],
      creditPrice: 1,
      secretCode: `MUA${suffix.slice(0, 5)}`,
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });

    const theaterB = await createPublishedEvent(db, {
      partnerId: partnerB.id,
      title: `Theater B ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Filterstraße 2, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10961",
      category: categoryTheater,
      eventType: "theater_play",
      dateTimes: [new Date("2026-07-11T19:00:00.000Z")],
      creditPrice: 1,
      secretCode: `THB${suffix.slice(0, 5)}`,
      imagePrebuilt: await createTestImage(),
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
        partnerId: testPartnerIds,
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
        partnerId: testPartnerIds,
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
    const partnerImage = await createTestImage();
    const partner = await createPartner(db, {
      name: `Discovery Map ${suffix}`,
      ...structuredLocationFromAddress("Mapstraße 1, Berlin"),
      contactEmail: `discovery-map-${suffix}@example.com`,
      logoPrebuilt: partnerImage,
      skipUpload: true,
    });

    const now = new Date("2026-07-09T08:00:00.000Z");

    const withCoords = await createPublishedEvent(db, {
      partnerId: partner.id,
      title: `Map Coords ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Mapstraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date("2026-07-12T18:00:00.000Z")],
      creditPrice: 1,
      secretCode: `MPC${suffix.slice(0, 5)}`,
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
      lat: "52.520000",
      lng: "13.405000",
    });

    const withoutCoords = await createPublishedEvent(db, {
      partnerId: partner.id,
      title: `Map NoCoords ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Mapstraße 2, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date("2026-07-12T19:00:00.000Z")],
      creditPrice: 1,
      secretCode: `MPN${suffix.slice(0, 5)}`,
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });

    const past = await createPublishedEvent(db, {
      partnerId: partner.id,
      title: `Map Past ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Mapstraße 3, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date("2026-07-09T06:00:00.000Z")],
      creditPrice: 1,
      secretCode: `MPP${suffix.slice(0, 5)}`,
      imagePrebuilt: await createTestImage(),
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
        category: "theater",
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
    const partnerImage = await createTestImage();
    const userId = await insertTestUser(db, suffix);
    const partner = await createPartner(db, {
      name: `Discovery Save ${suffix}`,
      ...structuredLocationFromAddress("Savestraße 1, Berlin"),
      contactEmail: `discovery-save-${suffix}@example.com`,
      logoPrebuilt: partnerImage,
      skipUpload: true,
    });

    const now = new Date("2026-07-09T14:00:00.000Z");

    const todayEvent = await createPublishedEvent(db, {
      partnerId: partner.id,
      title: `Saved Today ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Savestraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date("2026-07-09T18:00:00.000Z")],
      creditPrice: 1,
      secretCode: `SVT${suffix.slice(0, 5)}`,
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });

    const laterEvent = await createPublishedEvent(db, {
      partnerId: partner.id,
      title: `Saved Later ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Savestraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "live_music_venue",
      eventType: "concert",
      dateTimes: [new Date("2026-07-15T18:00:00.000Z")],
      creditPrice: 1,
      secretCode: `SVL${suffix.slice(0, 5)}`,
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });

    const pastEvent = await createPublishedEvent(db, {
      partnerId: partner.id,
      title: `Saved Past ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Savestraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date("2026-07-09T10:00:00.000Z")],
      creditPrice: 1,
      secretCode: `SVP${suffix.slice(0, 5)}`,
      imagePrebuilt: await createTestImage(),
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

  test("multi-datetime: upcoming via later slot; range matches any occurrence", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const now = new Date("2026-07-09T14:00:00.000Z");
    const partnerImage = await createTestImage();
    const partner = await createPartner(db, {
      name: `Discovery MultiDT ${suffix}`,
      ...structuredLocationFromAddress("MultiFeed Straße 1, Berlin"),
      contactEmail: `discovery-mdt-${suffix}@example.com`,
      logoPrebuilt: partnerImage,
      skipUpload: true,
    });

    const multi = await createPublishedEvent(db, {
      partnerId: partner.id,
      title: `Multi Slot ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("MultiFeed Straße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date("2026-07-08T18:00:00.000Z"), new Date("2026-07-15T18:00:00.000Z")],
      now,
      creditPrice: 1,
      secretCode: `MF${suffix.slice(0, 6)}`,
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });

    const allPast = await createPublishedEvent(db, {
      partnerId: partner.id,
      title: `All Past Multi ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("MultiFeed Straße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date("2026-07-07T18:00:00.000Z"), new Date("2026-07-08T10:00:00.000Z")],
      now,
      creditPrice: 1,
      secretCode: `MP${suffix.slice(0, 6)}`,
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });

    try {
      expect(multi.dateTime.toISOString()).toBe("2026-07-15T18:00:00.000Z");

      const feed = await listMemberFeedEvents(db, { now, title: suffix });
      const ids = feed.items.map((row) => row.id);
      expect(ids).toContain(multi.id);
      expect(ids).not.toContain(allPast.id);

      const ranged = await listMemberFeedEvents(db, {
        now,
        from: "2026-07-15",
        to: "2026-07-15",
        title: suffix,
      });
      expect(ranged.items.map((row) => row.id)).toContain(multi.id);

      const earlyRange = await listMemberFeedEvents(db, {
        now,
        from: "2026-07-08",
        to: "2026-07-08",
        title: suffix,
      });
      // Past occurrence on 08th is in range, but no upcoming occurrence within the clamped window
      // (effectiveStart = now on 09th). Event stays out unless a future slot falls in-range.
      expect(earlyRange.items.map((row) => row.id)).not.toContain(multi.id);
    } finally {
      await deleteEvent(db, multi.id, { skipBucket: true });
      await deleteEvent(db, allPast.id, { skipBucket: true });
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });
});
