import { describe, expect, test } from "bun:test";
import { createDb } from "@unveiled/db";
import { eq, inArray } from "drizzle-orm";
import { eventGalleryImages } from "../schema/event-gallery-images";
import { eventVoucherCodes } from "../schema/event-voucher-codes";
import { events } from "../schema/events";
import { featuredEvents } from "../schema/featured-events";
import { CatalogValidationError } from "./errors";
import { addEventGalleryImages, listEventGalleryImageIds } from "./event-gallery-images";
import { cloneEvent, createEvent } from "./events";
import { addFeaturedEvent } from "./featured-events";
import { deleteImageRecord, persistPrebuiltImage } from "./images";
import { createPartner, deletePartner } from "./partners";
import { createTestImagePrebuilt } from "./test-image";
import { appendPromoCodes, getVoucherInventoryCounts } from "./voucher-inventory";

const databaseUrl = process.env.DATABASE_URL;

/**
 * deleteEvent is unsafe for shared primary/gallery image ids (clone reuse).
 * Clean events + voucher rows first, then delete distinct image ids.
 */
async function cleanupClonedEvents(
  db: ReturnType<typeof createDb>,
  eventIds: string[],
  imageIds: string[],
) {
  const ids = [...new Set(eventIds.filter(Boolean))];
  if (ids.length === 0) {
    return;
  }

  await db.delete(eventVoucherCodes).where(inArray(eventVoucherCodes.eventId, ids));
  await db.delete(featuredEvents).where(inArray(featuredEvents.eventId, ids));
  await db.delete(eventGalleryImages).where(inArray(eventGalleryImages.eventId, ids));
  await db.delete(events).where(inArray(events.id, ids));

  for (const imageId of [...new Set(imageIds.filter(Boolean))]) {
    await deleteImageRecord(db, imageId, { skipBucket: true });
  }
}

describe("cloneEvent integration", () => {
  test("clones metadata with new dateTime, resets capacity, copies gallery, skips featured", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const partner = await createPartner(db, {
      name: `Clone Partner ${suffix}`,
      address: "Clonestraße 1, Berlin",
      contactEmail: `clone-${suffix}@example.com`,
      logoPrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });

    const source = await createEvent(db, {
      partnerId: partner.id,
      title: `Clone Source ${suffix}`,
      description: "Source description",
      address: "Clonestraße 1, Berlin",
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date("2026-08-10T18:00:00.000Z"),
      creditPrice: 2,
      totalCapacity: 8,
      secretCode: `SRC${suffix.slice(0, 5)}`,
      imagePrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });

    await db.update(events).set({ remainingCapacity: 3 }).where(eq(events.id, source.id));

    const galleryId = await persistPrebuiltImage(db, createTestImagePrebuilt(), {
      skipUpload: true,
    });
    await addEventGalleryImages(db, source.id, [galleryId]);
    await addFeaturedEvent(db, source.id);

    const cloneDate = new Date("2026-09-01T19:30:00.000Z");
    let clonedId: string | undefined;

    try {
      const cloned = await cloneEvent(db, source.id, { dateTime: cloneDate });
      clonedId = cloned.id;

      expect(cloned.id).not.toBe(source.id);
      expect(cloned.title).toBe(source.title);
      expect(cloned.partnerId).toBe(source.partnerId);
      expect(cloned.partnerName).toBe(source.partnerName);
      expect(cloned.imageId).toBe(source.imageId);
      expect(cloned.secretCode).toBe(source.secretCode);
      expect(cloned.dateTime.getTime()).toBe(cloneDate.getTime());
      expect(cloned.totalCapacity).toBe(8);
      expect(cloned.remainingCapacity).toBe(8);

      const galleryIds = await listEventGalleryImageIds(db, cloned.id);
      expect(galleryIds).toEqual([galleryId]);

      const featuredRows = await db
        .select()
        .from(featuredEvents)
        .where(eq(featuredEvents.eventId, cloned.id));
      expect(featuredRows).toHaveLength(0);
    } finally {
      await cleanupClonedEvents(db, [clonedId ?? "", source.id], [source.imageId, galleryId]);
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });

  test("rejects missing source and voucher clone without inventory", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const partner = await createPartner(db, {
      name: `Clone Voucher Partner ${suffix}`,
      address: "Clonestraße 2, Berlin",
      contactEmail: `clone-v-${suffix}@example.com`,
      logoPrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });

    const voucherSource = await createEvent(db, {
      partnerId: partner.id,
      title: `Clone Voucher Source ${suffix}`,
      description: "Voucher source",
      address: "Clonestraße 2, Berlin",
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date("2026-08-11T18:00:00.000Z"),
      creditPrice: 1,
      totalCapacity: 5,
      ticketType: "VOUCHER_PROMO",
      eventWebsiteUrl: "https://example.com/redeem",
      imagePrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });

    await appendPromoCodes(db, voucherSource.id, [`SRC-${suffix}`]);

    let clonedId: string | undefined;
    let clonedImageId: string | undefined;

    try {
      await expect(
        cloneEvent(db, crypto.randomUUID(), { dateTime: new Date("2026-09-02T18:00:00.000Z") }),
      ).rejects.toMatchObject({ code: "EVENT_NOT_FOUND" });

      await expect(
        cloneEvent(db, voucherSource.id, { dateTime: new Date("2026-09-02T18:00:00.000Z") }),
      ).rejects.toBeInstanceOf(CatalogValidationError);

      await expect(
        cloneEvent(db, voucherSource.id, {
          dateTime: new Date("2026-09-02T18:00:00.000Z"),
          voucherInventory: { promoCodes: [], pdfItems: [] },
        }),
      ).rejects.toMatchObject({ code: "EMPTY_VOUCHER_INVENTORY" });

      const cloned = await cloneEvent(db, voucherSource.id, {
        dateTime: new Date("2026-09-02T18:00:00.000Z"),
        voucherInventory: {
          promoCodes: [`CLONE-${suffix}`],
          pdfItems: [],
        },
      });
      clonedId = cloned.id;
      clonedImageId = cloned.imageId;

      const sourceCounts = await getVoucherInventoryCounts(db, voucherSource.id);
      const cloneCounts = await getVoucherInventoryCounts(db, cloned.id);
      expect(sourceCounts.promo.available).toBe(1);
      expect(cloneCounts.promo.available).toBe(1);
    } finally {
      await cleanupClonedEvents(
        db,
        [clonedId ?? "", voucherSource.id],
        [voucherSource.imageId, clonedImageId ?? ""],
      );
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });
});

describe("series create API removed", () => {
  test("createEventSeries and validateUniqueSeriesSlots are not exported", async () => {
    const catalog = await import("@unveiled/db");
    expect("createEventSeries" in catalog).toBe(false);
    expect("validateUniqueSeriesSlots" in catalog).toBe(false);
    expect(typeof catalog.cloneEvent).toBe("function");
  });
});
