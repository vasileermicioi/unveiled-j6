import { describe, expect, test } from "bun:test";
import { createDb, events, images } from "@unveiled/db";
import { eq } from "drizzle-orm";
import sharp from "sharp";

import { createEvent, deleteEvent, recalculateRemainingCapacity, updateEvent } from "./events";
import { createPartner, deletePartner, updatePartner } from "./partners";
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
});
