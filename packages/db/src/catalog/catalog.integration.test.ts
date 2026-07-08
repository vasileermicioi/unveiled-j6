import { describe, expect, test } from "bun:test";
import { createDb, events, images, partners } from "@unveiled/db";
import { eq } from "drizzle-orm";
import sharp from "sharp";

import {
  countEvents,
  createEvent,
  deleteEvent,
  listEvents,
  listUpcomingEvents,
  recalculateRemainingCapacity,
  updateEvent,
} from "./events";
import {
  countPartners,
  createPartner,
  deletePartner,
  listPartners,
  updatePartner,
} from "./partners";
import { runDemoSeed, shouldRunDemoSeed } from "./seed";

const databaseUrl = process.env.DATABASE_URL;

async function createTestImageBuffer(): Promise<Buffer> {
  return sharp({
    create: {
      width: 800,
      height: 420,
      channels: 3,
      background: { r: 250, g: 255, b: 134 },
    },
  })
    .jpeg()
    .toBuffer();
}

describe("catalog integration", () => {
  test("propagates partner rename to events", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const image = await createTestImageBuffer();
    const partner = await createPartner(db, {
      name: "Rename Test Venue",
      address: "Teststraße 1, Berlin",
      contactEmail: `rename-${crypto.randomUUID()}@example.com`,
      logoUpload: image,
      skipUpload: true,
    });

    const event = await createEvent(db, {
      partnerId: partner.id,
      title: "Rename Test Event",
      description: "Description",
      address: "Teststraße 1, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date(Date.now() + 86_400_000),
      creditPrice: 1,
      secretCode: "TESTCODE",
      imageUpload: image,
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

  test("updateEvent replaces image after relinking event FK", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const originalImage = await createTestImageBuffer();
    const partner = await createPartner(db, {
      name: "Image Replace Venue",
      address: "Teststraße 2, Berlin",
      contactEmail: `image-replace-${crypto.randomUUID()}@example.com`,
      logoUpload: originalImage,
      skipUpload: true,
    });

    const event = await createEvent(db, {
      partnerId: partner.id,
      title: "Image Replace Event",
      description: "Description",
      address: "Teststraße 2, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date(Date.now() + 86_400_000),
      creditPrice: 1,
      secretCode: "REPLACE1",
      imageUpload: originalImage,
      skipUpload: true,
    });

    const replacementImage = await sharp({
      create: {
        width: 800,
        height: 420,
        channels: 3,
        background: { r: 20, g: 20, b: 20 },
      },
    })
      .jpeg()
      .toBuffer();

    try {
      const previousImageId = event.imageId;
      const updated = await updateEvent(db, event.id, {
        imageUpload: replacementImage,
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
      address: "Seedstraße 1, Berlin",
      contactEmail: `seed-guard-${crypto.randomUUID()}@example.com`,
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
      address: "Olderstraße 1, Berlin",
      contactEmail: `older-${suffix}@example.com`,
      skipUpload: true,
    });
    const newer = await createPartner(db, {
      name: `Newer Partner ${suffix}`,
      address: "Newerstraße 1, Berlin",
      contactEmail: `newer-${suffix}@example.com`,
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
      address: "Searchstraße 1, Berlin",
      contactEmail: `unique-email-${suffix}@example.com`,
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
    const image = await createTestImageBuffer();
    const suffix = crypto.randomUUID().slice(0, 8);
    const partner = await createPartner(db, {
      name: `Event Search Partner ${suffix}`,
      address: "Eventstraße 1, Berlin",
      contactEmail: `event-search-${suffix}@example.com`,
      skipUpload: true,
    });

    const olderEvent = await createEvent(db, {
      partnerId: partner.id,
      title: `Older Event ${suffix}`,
      description: "Description",
      address: "Eventstraße 1, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date(Date.now() + 86_400_000),
      creditPrice: 1,
      secretCode: "OLDER01",
      imageUpload: image,
      skipUpload: true,
    });
    const newerEvent = await createEvent(db, {
      partnerId: partner.id,
      title: `Newer Event ${suffix}`,
      description: "Description",
      address: "Eventstraße 1, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date(Date.now() + 172_800_000),
      creditPrice: 1,
      secretCode: "NEWER01",
      imageUpload: image,
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
          address: `Pagestraße ${index}, Berlin`,
          contactEmail: `paged-${suffix}-${index}@example.com`,
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

  test("listUpcomingEvents returns future events ordered by date_time asc", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const image = await createTestImageBuffer();
    const partner = await createPartner(db, {
      name: "Upcoming Test Venue",
      address: "Teststraße 2, Berlin",
      contactEmail: `upcoming-${crypto.randomUUID()}@example.com`,
      skipUpload: true,
    });

    const laterDate = new Date(Date.now() + 172_800_000);
    const soonerDate = new Date(Date.now() + 86_400_000);
    const pastDate = new Date(Date.now() - 86_400_000);

    const laterEvent = await createEvent(db, {
      partnerId: partner.id,
      title: "Later Upcoming Event",
      description: "Description",
      address: "Teststraße 2, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: laterDate,
      creditPrice: 1,
      secretCode: "LATERCODE",
      imageUpload: image,
      skipUpload: true,
    });

    const soonerEvent = await createEvent(db, {
      partnerId: partner.id,
      title: "Sooner Upcoming Event",
      description: "Description",
      address: "Teststraße 2, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: soonerDate,
      creditPrice: 1,
      secretCode: "SOONCODE",
      imageUpload: image,
      skipUpload: true,
    });

    const pastEvent = await createEvent(db, {
      partnerId: partner.id,
      title: "Past Event",
      description: "Description",
      address: "Teststraße 2, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: pastDate,
      creditPrice: 1,
      secretCode: "PASTCODE",
      imageUpload: image,
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
