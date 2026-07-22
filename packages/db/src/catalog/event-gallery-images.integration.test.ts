import { describe, expect, test } from "bun:test";
import { createDb } from "@unveiled/db";
import { eq } from "drizzle-orm";
import { eventGalleryImages } from "../schema/event-gallery-images";
import { images } from "../schema/images";
import { CatalogValidationError } from "./errors";
import {
  addEventGalleryImages,
  listEventGalleryImages,
  MAX_EVENT_GALLERY_IMAGES,
  removeEventGalleryImages,
  reorderEventGalleryImages,
} from "./event-gallery-images";
import { createEvent, deleteEvent, getEventById } from "./events";
import { persistPrebuiltImage } from "./images";
import { createPartner, deletePartner } from "./partners";
import { createTestImagePrebuilt } from "./test-image";

const databaseUrl = process.env.DATABASE_URL;

async function persistGalleryImage(db: ReturnType<typeof createDb>) {
  return persistPrebuiltImage(db, createTestImagePrebuilt(), { skipUpload: true });
}

describe("event gallery images integration", () => {
  test("add order, hero unchanged, cap rejection, remove cleans images", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const partner = await createPartner(db, {
      name: `Gallery Partner ${suffix}`,
      address: "Gallerystraße 1, Berlin",
      contactEmail: `gallery-${suffix}@example.com`,
      logoPrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });

    const event = await createEvent(db, {
      partnerId: partner.id,
      title: `Gallery Event ${suffix}`,
      description: "Description",
      address: "Gallerystraße 1, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date("2026-07-20T18:00:00.000Z"),
      creditPrice: 1,
      secretCode: `G${suffix.slice(0, 7)}`,
      imagePrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });

    const heroImageId = event.imageId;
    const galleryIdA = await persistGalleryImage(db);
    const galleryIdB = await persistGalleryImage(db);
    let overflowId: string | undefined;

    try {
      const listed = await addEventGalleryImages(db, event.id, [galleryIdA, galleryIdB]);
      expect(listed.map((row) => row.imageId)).toEqual([galleryIdA, galleryIdB]);
      expect(listed[0]?.sortOrder).toBeLessThan(listed[1]?.sortOrder ?? Number.POSITIVE_INFINITY);

      const afterAdd = await getEventById(db, event.id);
      expect(afterAdd?.imageId).toBe(heroImageId);

      const ordered = await listEventGalleryImages(db, event.id);
      expect(ordered.map((row) => row.imageId)).toEqual([galleryIdA, galleryIdB]);

      const fillerIds: string[] = [];
      for (let i = 0; i < MAX_EVENT_GALLERY_IMAGES - 2; i += 1) {
        fillerIds.push(await persistGalleryImage(db));
      }
      await addEventGalleryImages(db, event.id, fillerIds);

      overflowId = await persistGalleryImage(db);
      let capError: unknown;
      try {
        await addEventGalleryImages(db, event.id, [overflowId]);
      } catch (error) {
        capError = error;
      }
      expect(capError).toBeInstanceOf(CatalogValidationError);
      expect((capError as CatalogValidationError).code).toBe("GALLERY_LIMIT_EXCEEDED");

      await removeEventGalleryImages(db, event.id, [galleryIdA, galleryIdB], { skipBucket: true });

      const afterRemove = await listEventGalleryImages(db, event.id);
      expect(afterRemove.map((row) => row.imageId)).not.toContain(galleryIdA);
      expect(afterRemove.map((row) => row.imageId)).not.toContain(galleryIdB);

      const removedImageA = await db.select().from(images).where(eq(images.id, galleryIdA));
      const removedImageB = await db.select().from(images).where(eq(images.id, galleryIdB));
      expect(removedImageA).toHaveLength(0);
      expect(removedImageB).toHaveLength(0);

      const heroStill = await getEventById(db, event.id);
      expect(heroStill?.imageId).toBe(heroImageId);
      const heroRow = await db.select().from(images).where(eq(images.id, heroImageId));
      expect(heroRow).toHaveLength(1);
    } finally {
      await deleteEvent(db, event.id, { skipBucket: true });
      await deletePartner(db, partner.id, { skipBucket: true });
      if (overflowId) {
        await db.delete(images).where(eq(images.id, overflowId));
      }
    }
  });

  test("reorder persists sort_order and rejects invalid permutations", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const partner = await createPartner(db, {
      name: `Gallery Reorder ${suffix}`,
      address: "Reorderstraße 1, Berlin",
      contactEmail: `gallery-reorder-${suffix}@example.com`,
      logoPrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });

    const event = await createEvent(db, {
      partnerId: partner.id,
      title: `Reorder Gallery ${suffix}`,
      description: "Description",
      address: "Reorderstraße 1, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date("2026-07-22T18:00:00.000Z"),
      creditPrice: 1,
      secretCode: `GR${suffix.slice(0, 6)}`,
      imagePrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });

    const galleryIdA = await persistGalleryImage(db);
    const galleryIdB = await persistGalleryImage(db);
    const galleryIdC = await persistGalleryImage(db);

    try {
      await addEventGalleryImages(db, event.id, [galleryIdA, galleryIdB, galleryIdC]);

      const reordered = await reorderEventGalleryImages(db, event.id, [
        galleryIdC,
        galleryIdA,
        galleryIdB,
      ]);
      expect(reordered.map((row) => row.imageId)).toEqual([galleryIdC, galleryIdA, galleryIdB]);
      expect(reordered.map((row) => row.sortOrder)).toEqual([0, 1, 2]);

      let invalidError: unknown;
      try {
        await reorderEventGalleryImages(db, event.id, [galleryIdA, galleryIdB]);
      } catch (error) {
        invalidError = error;
      }
      expect(invalidError).toBeInstanceOf(CatalogValidationError);
      expect((invalidError as CatalogValidationError).code).toBe("GALLERY_REORDER_INVALID");
    } finally {
      await deleteEvent(db, event.id, { skipBucket: true });
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });

  test("deleting an event cleans gallery joins and image rows", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const partner = await createPartner(db, {
      name: `Gallery Cascade ${suffix}`,
      address: "Cascadestraße 2, Berlin",
      contactEmail: `gallery-cascade-${suffix}@example.com`,
      logoPrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });

    const event = await createEvent(db, {
      partnerId: partner.id,
      title: `Cascade Gallery ${suffix}`,
      description: "Description",
      address: "Cascadestraße 2, Berlin",
      neighborhood: "Mitte",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date("2026-07-21T18:00:00.000Z"),
      creditPrice: 1,
      secretCode: `GC${suffix.slice(0, 6)}`,
      imagePrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });

    const galleryId = await persistGalleryImage(db);
    await addEventGalleryImages(db, event.id, [galleryId]);

    try {
      await deleteEvent(db, event.id, { skipBucket: true });

      const joinRows = await db
        .select()
        .from(eventGalleryImages)
        .where(eq(eventGalleryImages.eventId, event.id));
      expect(joinRows).toHaveLength(0);

      const galleryImageRows = await db.select().from(images).where(eq(images.id, galleryId));
      expect(galleryImageRows).toHaveLength(0);
    } finally {
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });
});
