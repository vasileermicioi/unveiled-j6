import { describe, expect, test } from "bun:test";
import { createDb, events, images, partners } from "@unveiled/db";
import { eq } from "drizzle-orm";
import { CatalogValidationError } from "./errors";
import {
  countEvents,
  createEvent,
  deleteEvent,
  listEvents,
  listUpcomingEvents,
  recalculateRemainingCapacity,
  updateEvent,
} from "./events";
import { deleteImageRecord, persistPrebuiltImage } from "./images";
import {
  countPartners,
  createPartner,
  deletePartner,
  listPartners,
  updatePartner,
} from "./partners";
import { runDemoSeed, shouldRunDemoSeed } from "./seed";
import { createTestImagePrebuilt } from "./test-image";
import { structuredLocationFromAddress } from "./test-location";

const databaseUrl = process.env.DATABASE_URL;

async function createTestImage() {
  return createTestImagePrebuilt();
}

describe("catalog integration", () => {
  test("propagates partner rename to events", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const logo = await createTestImage();
    const image = await createTestImage();
    const partner = await createPartner(db, {
      name: "Rename Test Venue",
      ...structuredLocationFromAddress("Teststraße 1, Berlin"),
      contactEmail: `rename-${crypto.randomUUID()}@example.com`,
      logoPrebuilt: logo,
      skipUpload: true,
    });

    const event = await createEvent(db, {
      partnerId: partner.id,
      title: "Rename Test Event",
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date(Date.now() + 86_400_000),
      creditPrice: 1,
      secretCode: "TESTCODE",
      imagePrebuilt: image,
      skipUpload: true,
    });

    try {
      await updatePartner(db, partner.id, { name: "Renamed Venue" });
      const updatedEvent = await db.query.events.findFirst({
        where: eq(events.id, event.id),
      });
      expect(updatedEvent?.partnerName).toBe("Renamed Venue");
    } finally {
      await deleteEvent(db, event.id, { skipBucket: true });
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });

  test("createEvent keeps staged image on redemption failure and accepts stagedImageId retry", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const logo = await createTestImage();
    const partner = await createPartner(db, {
      name: "Staged Image Venue",
      ...structuredLocationFromAddress("Teststraße 3, Berlin"),
      contactEmail: `staged-image-${crypto.randomUUID()}@example.com`,
      logoPrebuilt: logo,
      skipUpload: true,
    });

    const stagedPrebuilt = createTestImagePrebuilt();
    const stagedImageId = await persistPrebuiltImage(db, stagedPrebuilt, { skipUpload: true });
    let createdEventId: string | undefined;

    try {
      await expect(
        createEvent(db, {
          partnerId: partner.id,
          title: "Staged Image Event",
          description: "Description",
          ...structuredLocationFromAddress("Teststraße 3, Berlin"),
          country: "DE",
          city: "berlin",
          zipCode: "10115",
          category: "Theater",
          eventType: "Performance",
          dateTime: new Date(Date.now() + 86_400_000),
          creditPrice: 1,
          ticketType: "SECRET_CODE",
          secretCode: "",
          stagedImageId,
          skipUpload: true,
        }),
      ).rejects.toBeInstanceOf(CatalogValidationError);

      const stillThere = await db.query.images.findFirst({
        where: eq(images.id, stagedImageId),
      });
      expect(stillThere).toBeDefined();

      const created = await createEvent(db, {
        partnerId: partner.id,
        title: "Staged Image Event",
        description: "Description",
        ...structuredLocationFromAddress("Teststraße 3, Berlin"),
        country: "DE",
        city: "berlin",
        zipCode: "10115",
        category: "Theater",
        eventType: "Performance",
        dateTime: new Date(Date.now() + 86_400_000),
        creditPrice: 1,
        secretCode: "STAGED1",
        stagedImageId,
        skipUpload: true,
      });
      createdEventId = created.id;
      expect(created.imageId).toBe(stagedImageId);
    } finally {
      if (createdEventId) {
        await deleteEvent(db, createdEventId, { skipBucket: true });
      } else {
        await deleteImageRecord(db, stagedImageId, { skipBucket: true });
      }
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });

  test("createEvent does not delete persisted prebuilt image when insert validation fails", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const logo = await createTestImage();
    const partner = await createPartner(db, {
      name: "Retain Prebuilt Venue",
      ...structuredLocationFromAddress("Teststraße 4, Berlin"),
      contactEmail: `retain-prebuilt-${crypto.randomUUID()}@example.com`,
      logoPrebuilt: logo,
      skipUpload: true,
    });

    const imagePrebuilt = createTestImagePrebuilt();
    const expectedImageId = imagePrebuilt.imageId;

    try {
      await expect(
        createEvent(db, {
          partnerId: partner.id,
          title: "Retain Prebuilt Event",
          description: "Description",
          ...structuredLocationFromAddress("Teststraße 4, Berlin"),
          country: "DE",
          city: "berlin",
          zipCode: "10115",
          category: "Theater",
          eventType: "Performance",
          dateTime: new Date(Date.now() + 86_400_000),
          creditPrice: 1,
          ticketType: "SECRET_CODE",
          secretCode: "",
          imagePrebuilt,
          skipUpload: true,
        }),
      ).rejects.toBeInstanceOf(CatalogValidationError);

      const stillThere = await db.query.images.findFirst({
        where: eq(images.id, expectedImageId),
      });
      expect(stillThere).toBeDefined();
    } finally {
      await deleteImageRecord(db, expectedImageId, { skipBucket: true }).catch(() => undefined);
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });

  test("updateEvent replaces image after relinking event FK", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const logo = await createTestImage();
    const originalImage = await createTestImage();
    const partner = await createPartner(db, {
      name: "Image Replace Venue",
      ...structuredLocationFromAddress("Teststraße 2, Berlin"),
      contactEmail: `image-replace-${crypto.randomUUID()}@example.com`,
      logoPrebuilt: logo,
      skipUpload: true,
    });

    const event = await createEvent(db, {
      partnerId: partner.id,
      title: "Image Replace Event",
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 2, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date(Date.now() + 86_400_000),
      creditPrice: 1,
      secretCode: "REPLACE1",
      imagePrebuilt: originalImage,
      skipUpload: true,
    });

    const replacementImage = createTestImagePrebuilt();

    try {
      const previousImageId = event.imageId;
      const updated = await updateEvent(db, event.id, {
        imagePrebuilt: replacementImage,
        skipUpload: true,
      });

      expect(updated.imageId).not.toBe(previousImageId);

      const oldImage = await db.query.images.findFirst({
        where: eq(images.id, previousImageId),
      });
      expect(oldImage).toBeUndefined();
    } finally {
      await deleteEvent(db, event.id, { skipBucket: true });
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });

  test("recalculates remaining capacity when total capacity changes", () => {
    expect(recalculateRemainingCapacity(10, 7, 12)).toBe(9);
    expect(recalculateRemainingCapacity(10, 7, 5)).toBe(2);
    expect(recalculateRemainingCapacity(10, 7, 2)).toBe(0);
  });

  test("demo seed skips when catalog data already exists", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const partner = await createPartner(db, {
      name: "Seed Guard Venue",
      ...structuredLocationFromAddress("Seedstraße 1, Berlin"),
      contactEmail: `seed-guard-${crypto.randomUUID()}@example.com`,
      logoPrebuilt: await createTestImage(),
      skipUpload: true,
    });

    try {
      expect(await shouldRunDemoSeed(db)).toBe(false);
      expect(await runDemoSeed(db)).toBe("skipped");
    } finally {
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });

  test("listPartners orders by created_at desc then id desc", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const older = await createPartner(db, {
      name: `Older Partner ${suffix}`,
      ...structuredLocationFromAddress("Olderstraße 1, Berlin"),
      contactEmail: `older-${suffix}@example.com`,
      logoPrebuilt: await createTestImage(),
      skipUpload: true,
    });
    const newer = await createPartner(db, {
      name: `Newer Partner ${suffix}`,
      ...structuredLocationFromAddress("Newerstraße 1, Berlin"),
      contactEmail: `newer-${suffix}@example.com`,
      logoPrebuilt: await createTestImage(),
      skipUpload: true,
    });

    try {
      await db
        .update(partners)
        .set({ createdAt: new Date("2024-01-01T12:00:00.000Z") })
        .where(eq(partners.id, older.id));
      await db
        .update(partners)
        .set({ createdAt: new Date("2024-06-01T12:00:00.000Z") })
        .where(eq(partners.id, newer.id));

      const rows = await listPartners(db, { q: suffix, limit: 10 });
      expect(rows.map((row) => row.id)).toEqual([newer.id, older.id]);
      expect(rows.every((row) => row.eventCount === 0 && row.activeEventCount === 0)).toBe(true);
    } finally {
      await deletePartner(db, older.id, { skipBucket: true });
      await deletePartner(db, newer.id, { skipBucket: true });
    }
  });

  test("partner search matches name only", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const partner = await createPartner(db, {
      name: `Searchable Venue ${suffix}`,
      ...structuredLocationFromAddress("Searchstraße 1, Berlin"),
      contactEmail: `unique-email-${suffix}@example.com`,
      logoPrebuilt: await createTestImage(),
      skipUpload: true,
    });

    try {
      expect(await countPartners(db, { q: suffix })).toBe(1);
      expect(await countPartners(db, { q: `unique-email-${suffix}` })).toBe(0);

      const byName = await listPartners(db, { q: `Searchable Venue ${suffix}` });
      expect(byName).toHaveLength(1);
      expect(byName[0]?.id).toBe(partner.id);
    } finally {
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });

  test("listEvents orders by created_at desc and searches title or partner name", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const image = await createTestImage();
    const suffix = crypto.randomUUID().slice(0, 8);
    const partner = await createPartner(db, {
      name: `Event Search Partner ${suffix}`,
      ...structuredLocationFromAddress("Eventstraße 1, Berlin"),
      contactEmail: `event-search-${suffix}@example.com`,
      logoPrebuilt: await createTestImage(),
      skipUpload: true,
    });

    const olderEvent = await createEvent(db, {
      partnerId: partner.id,
      title: `Older Event ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Eventstraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date(Date.now() + 86_400_000),
      creditPrice: 1,
      secretCode: "OLDER01",
      imagePrebuilt: image,
      skipUpload: true,
    });
    const newerEvent = await createEvent(db, {
      partnerId: partner.id,
      title: `Newer Event ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Eventstraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date(Date.now() + 172_800_000),
      creditPrice: 1,
      secretCode: "NEWER01",
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });

    try {
      await db
        .update(events)
        .set({ createdAt: new Date("2024-01-01T12:00:00.000Z") })
        .where(eq(events.id, olderEvent.id));
      await db
        .update(events)
        .set({ createdAt: new Date("2024-06-01T12:00:00.000Z") })
        .where(eq(events.id, newerEvent.id));

      const ordered = await listEvents(db, { q: suffix, limit: 10 });
      expect(ordered.map((row) => row.id)).toEqual([newerEvent.id, olderEvent.id]);

      const byTitleAsc = await listEvents(db, {
        q: suffix,
        sort: "title",
        limit: 10,
      });
      expect(byTitleAsc.map((row) => row.id)).toEqual([newerEvent.id, olderEvent.id]);

      const byTitleDesc = await listEvents(db, {
        q: suffix,
        sort: "title",
        desc: true,
        limit: 10,
      });
      expect(byTitleDesc.map((row) => row.id)).toEqual([olderEvent.id, newerEvent.id]);

      const byDateAsc = await listEvents(db, {
        q: suffix,
        sort: "date",
        limit: 10,
      });
      expect(byDateAsc.map((row) => row.id)).toEqual([olderEvent.id, newerEvent.id]);

      expect(await countEvents(db, { q: `Newer Event ${suffix}` })).toBe(1);
      expect(await countEvents(db, { q: `Event Search Partner ${suffix}` })).toBe(2);
    } finally {
      await deleteEvent(db, newerEvent.id, { skipBucket: true });
      await deleteEvent(db, olderEvent.id, { skipBucket: true });
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });

  test("list and count align for partner pagination", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const created = await Promise.all(
      [1, 2, 3].map((index) =>
        createPartner(db, {
          name: `Paged Partner ${suffix}-${index}`,
          ...structuredLocationFromAddress(`Pagestraße ${index}, Berlin`),
          contactEmail: `paged-${suffix}-${index}@example.com`,
          logoPrebuilt: createTestImagePrebuilt(),
          skipUpload: true,
        }),
      ),
    );

    try {
      const total = await countPartners(db, { q: suffix });
      expect(total).toBe(3);

      const pageOne = await listPartners(db, { q: suffix, limit: 2, offset: 0 });
      const pageTwo = await listPartners(db, { q: suffix, limit: 2, offset: 2 });

      expect(pageOne).toHaveLength(2);
      expect(pageTwo).toHaveLength(1);
      expect(new Set([...pageOne, ...pageTwo].map((row) => row.id)).size).toBe(3);
    } finally {
      for (const partner of created) {
        await deletePartner(db, partner.id, { skipBucket: true });
      }
    }
  });

  test("listPartners sorts by name, created, and event count", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const alpha = await createPartner(db, {
      name: `Alpha Sort ${suffix}`,
      ...structuredLocationFromAddress("Alphastraße 1, Berlin"),
      contactEmail: `alpha-sort-${suffix}@example.com`,
      logoPrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });
    const bravo = await createPartner(db, {
      name: `Bravo Sort ${suffix}`,
      ...structuredLocationFromAddress("Bravostraße 1, Berlin"),
      contactEmail: `bravo-sort-${suffix}@example.com`,
      logoPrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });
    const charlie = await createPartner(db, {
      name: `Charlie Sort ${suffix}`,
      ...structuredLocationFromAddress("Charliestraße 1, Berlin"),
      contactEmail: `charlie-sort-${suffix}@example.com`,
      logoPrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });

    const image = createTestImagePrebuilt();
    const eventBase = {
      description: "Sort coverage",
      ...structuredLocationFromAddress("Sortstraße 1, Berlin"),
      country: "DE" as const,
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date(Date.now() + 86_400_000),
      creditPrice: 1,
      imagePrebuilt: image,
      skipUpload: true,
    };

    const bravoEvent = await createEvent(db, {
      ...eventBase,
      partnerId: bravo.id,
      title: `Bravo One ${suffix}`,
      secretCode: `BRV1${suffix}`.slice(0, 12),
    });
    const charlieEventA = await createEvent(db, {
      ...eventBase,
      partnerId: charlie.id,
      title: `Charlie One ${suffix}`,
      secretCode: `CHA1${suffix}`.slice(0, 12),
      imagePrebuilt: createTestImagePrebuilt(),
    });
    const charlieEventB = await createEvent(db, {
      ...eventBase,
      partnerId: charlie.id,
      title: `Charlie Two ${suffix}`,
      secretCode: `CHA2${suffix}`.slice(0, 12),
      imagePrebuilt: createTestImagePrebuilt(),
    });

    try {
      await db
        .update(partners)
        .set({ createdAt: new Date("2024-01-01T12:00:00.000Z") })
        .where(eq(partners.id, alpha.id));
      await db
        .update(partners)
        .set({ createdAt: new Date("2024-03-01T12:00:00.000Z") })
        .where(eq(partners.id, bravo.id));
      await db
        .update(partners)
        .set({ createdAt: new Date("2024-06-01T12:00:00.000Z") })
        .where(eq(partners.id, charlie.id));

      const byNameAsc = await listPartners(db, { q: suffix, sort: "name", limit: 10 });
      expect(byNameAsc.map((row) => row.id)).toEqual([alpha.id, bravo.id, charlie.id]);

      const byNameDesc = await listPartners(db, {
        q: suffix,
        sort: "name",
        desc: true,
        limit: 10,
      });
      expect(byNameDesc.map((row) => row.id)).toEqual([charlie.id, bravo.id, alpha.id]);

      const byCreatedAsc = await listPartners(db, { q: suffix, sort: "created", limit: 10 });
      expect(byCreatedAsc.map((row) => row.id)).toEqual([alpha.id, bravo.id, charlie.id]);

      const byCreatedDesc = await listPartners(db, {
        q: suffix,
        sort: "created",
        desc: true,
        limit: 10,
      });
      expect(byCreatedDesc.map((row) => row.id)).toEqual([charlie.id, bravo.id, alpha.id]);

      const byEventsAsc = await listPartners(db, { q: suffix, sort: "events", limit: 10 });
      expect(byEventsAsc.map((row) => row.id)).toEqual([alpha.id, bravo.id, charlie.id]);
      expect(byEventsAsc.map((row) => row.activeEventCount)).toEqual([0, 1, 2]);

      const byEventsDesc = await listPartners(db, {
        q: suffix,
        sort: "events",
        desc: true,
        limit: 10,
      });
      expect(byEventsDesc.map((row) => row.id)).toEqual([charlie.id, bravo.id, alpha.id]);
      expect(byEventsDesc.map((row) => row.activeEventCount)).toEqual([2, 1, 0]);
    } finally {
      await deleteEvent(db, charlieEventB.id, { skipBucket: true });
      await deleteEvent(db, charlieEventA.id, { skipBucket: true });
      await deleteEvent(db, bravoEvent.id, { skipBucket: true });
      await deletePartner(db, alpha.id, { skipBucket: true });
      await deletePartner(db, bravo.id, { skipBucket: true });
      await deletePartner(db, charlie.id, { skipBucket: true });
    }
  });

  test("listPartners returns total and active event counts", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const now = new Date("2026-08-03T12:00:00.000Z");
    const partner = await createPartner(db, {
      name: `Active Counts ${suffix}`,
      ...structuredLocationFromAddress("Countstraße 1, Berlin"),
      contactEmail: `active-counts-${suffix}@example.com`,
      logoPrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });
    const emptyPartner = await createPartner(db, {
      name: `Empty Counts ${suffix}`,
      ...structuredLocationFromAddress("Emptystraße 1, Berlin"),
      contactEmail: `empty-counts-${suffix}@example.com`,
      logoPrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });

    const eventBase = {
      partnerId: partner.id,
      description: "Active count coverage",
      ...structuredLocationFromAddress("Countstraße 1, Berlin"),
      country: "DE" as const,
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      creditPrice: 1,
      skipUpload: true,
    };

    const past = await createEvent(db, {
      ...eventBase,
      title: `Past ${suffix}`,
      dateTime: new Date("2026-08-01T12:00:00.000Z"),
      secretCode: `PAST${suffix}`.slice(0, 12),
      imagePrebuilt: createTestImagePrebuilt(),
      totalCapacity: 5,
    });
    const soldOut = await createEvent(db, {
      ...eventBase,
      title: `Sold Out ${suffix}`,
      dateTime: new Date("2026-08-10T12:00:00.000Z"),
      secretCode: `SOLD${suffix}`.slice(0, 12),
      imagePrebuilt: createTestImagePrebuilt(),
      totalCapacity: 5,
    });
    const active = await createEvent(db, {
      ...eventBase,
      title: `Active ${suffix}`,
      dateTime: new Date("2026-08-10T18:00:00.000Z"),
      secretCode: `ACTV${suffix}`.slice(0, 12),
      imagePrebuilt: createTestImagePrebuilt(),
      totalCapacity: 5,
    });

    try {
      await db.update(events).set({ remainingCapacity: 0 }).where(eq(events.id, soldOut.id));

      const rows = await listPartners(db, { q: suffix, sort: "name", now, limit: 10 });
      expect(rows).toHaveLength(2);

      const withEvents = rows.find((row) => row.id === partner.id);
      const withoutEvents = rows.find((row) => row.id === emptyPartner.id);
      expect(withEvents?.eventCount).toBe(3);
      expect(withEvents?.activeEventCount).toBe(1);
      expect(withoutEvents?.eventCount).toBe(0);
      expect(withoutEvents?.activeEventCount).toBe(0);

      expect(await countPartners(db, { q: suffix })).toBe(2);
    } finally {
      await deleteEvent(db, active.id, { skipBucket: true });
      await deleteEvent(db, soldOut.id, { skipBucket: true });
      await deleteEvent(db, past.id, { skipBucket: true });
      await deletePartner(db, partner.id, { skipBucket: true });
      await deletePartner(db, emptyPartner.id, { skipBucket: true });
    }
  });

  test("listUpcomingEvents returns future events ordered by date_time asc", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const image = await createTestImage();
    const partner = await createPartner(db, {
      name: "Upcoming Test Venue",
      ...structuredLocationFromAddress("Teststraße 2, Berlin"),
      contactEmail: `upcoming-${crypto.randomUUID()}@example.com`,
      logoPrebuilt: await createTestImage(),
      skipUpload: true,
    });

    const laterDate = new Date(Date.now() + 172_800_000);
    const soonerDate = new Date(Date.now() + 86_400_000);
    const pastDate = new Date(Date.now() - 86_400_000);

    const laterEvent = await createEvent(db, {
      partnerId: partner.id,
      title: "Later Upcoming Event",
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 2, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTime: laterDate,
      creditPrice: 1,
      secretCode: "LATERCODE",
      imagePrebuilt: image,
      skipUpload: true,
    });

    const soonerEvent = await createEvent(db, {
      partnerId: partner.id,
      title: "Sooner Upcoming Event",
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 2, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTime: soonerDate,
      creditPrice: 1,
      secretCode: "SOONCODE",
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });

    const pastEvent = await createEvent(db, {
      partnerId: partner.id,
      title: "Past Event",
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 2, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTime: pastDate,
      creditPrice: 1,
      secretCode: "PASTCODE",
      imagePrebuilt: await createTestImage(),
      skipUpload: true,
    });

    try {
      const upcoming = await listUpcomingEvents(db, { limit: 10, now: new Date() });
      const ids = upcoming.map((row) => row.id);

      expect(ids).toContain(soonerEvent.id);
      expect(ids).toContain(laterEvent.id);
      expect(ids).not.toContain(pastEvent.id);

      const soonerIndex = ids.indexOf(soonerEvent.id);
      const laterIndex = ids.indexOf(laterEvent.id);
      expect(soonerIndex).toBeGreaterThanOrEqual(0);
      expect(laterIndex).toBeGreaterThanOrEqual(0);
      expect(soonerIndex).toBeLessThan(laterIndex);
    } finally {
      await deleteEvent(db, laterEvent.id, { skipBucket: true });
      await deleteEvent(db, soonerEvent.id, { skipBucket: true });
      await deleteEvent(db, pastEvent.id, { skipBucket: true });
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });
});
