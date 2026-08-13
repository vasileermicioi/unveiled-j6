import { describe, expect, test } from "bun:test";
import { createDb } from "@unveiled/db";

import { CatalogValidationError } from "./errors";
import { addEventGalleryImages, listEventGalleryImages } from "./event-gallery-images";
import { createEvent, deleteEvent } from "./events";
import {
  deleteImageRecord,
  getImageCredit,
  IMAGE_CREDIT_MAX_LENGTH,
  persistPrebuiltImage,
  replaceEventImage,
  updateImageCredit,
} from "./images";
import { createPartner, deletePartner } from "./partners";
import { createTestImagePrebuilt } from "./test-image";
import { structuredLocationFromAddress } from "./test-location";

const databaseUrl = process.env.DATABASE_URL;

describe("image credit integration", () => {
  test("persist, update, reject over-length, and replace does not inherit", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const ids: string[] = [];

    try {
      const creditedId = await persistPrebuiltImage(db, createTestImagePrebuilt(), {
        skipUpload: true,
        credit: "Photo: Ada",
      });
      ids.push(creditedId);
      expect(await getImageCredit(db, creditedId)).toBe("Photo: Ada");

      const omittedId = await persistPrebuiltImage(db, createTestImagePrebuilt(), {
        skipUpload: true,
      });
      ids.push(omittedId);
      expect(await getImageCredit(db, omittedId)).toBeNull();

      const blankId = await persistPrebuiltImage(db, createTestImagePrebuilt(), {
        skipUpload: true,
        credit: "   ",
      });
      ids.push(blankId);
      expect(await getImageCredit(db, blankId)).toBeNull();

      const trimmedId = await persistPrebuiltImage(db, createTestImagePrebuilt(), {
        skipUpload: true,
        credit: "  Photo: Ada  ",
      });
      ids.push(trimmedId);
      expect(await getImageCredit(db, trimmedId)).toBe("Photo: Ada");

      expect(await updateImageCredit(db, creditedId, "Logo: Venue")).toBe("Logo: Venue");
      expect(await getImageCredit(db, creditedId)).toBe("Logo: Venue");
      expect(await updateImageCredit(db, creditedId, null)).toBeNull();
      expect(await getImageCredit(db, creditedId)).toBeNull();
      expect(await updateImageCredit(db, creditedId, "Photo: Ada")).toBe("Photo: Ada");

      let tooLongError: unknown;
      try {
        await persistPrebuiltImage(db, createTestImagePrebuilt(), {
          skipUpload: true,
          credit: "a".repeat(IMAGE_CREDIT_MAX_LENGTH + 1),
        });
      } catch (error) {
        tooLongError = error;
      }
      expect(tooLongError).toBeInstanceOf(CatalogValidationError);
      expect((tooLongError as CatalogValidationError).code).toBe("IMAGE_CREDIT_TOO_LONG");

      const missingId = crypto.randomUUID();
      try {
        await getImageCredit(db, missingId);
        throw new Error("expected IMAGE_NOT_FOUND");
      } catch (error) {
        expect(error).toBeInstanceOf(CatalogValidationError);
        expect((error as CatalogValidationError).code).toBe("IMAGE_NOT_FOUND");
      }

      const replacement = createTestImagePrebuilt();
      const newId = await replaceEventImage(db, creditedId, null, null, {
        skipUpload: true,
        prebuilt: replacement,
      });
      ids.push(newId);
      expect(newId).not.toBe(creditedId);
      expect(await getImageCredit(db, newId)).toBeNull();
      expect(await getImageCredit(db, creditedId)).toBe("Photo: Ada");
    } finally {
      for (const id of ids) {
        await deleteImageRecord(db, id, { skipBucket: true }).catch(() => undefined);
      }
    }
  });

  test("gallery list includes credit", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const partner = await createPartner(db, {
      name: `Credit Gallery Partner ${suffix}`,
      ...structuredLocationFromAddress("Creditstraße 1, Berlin"),
      contactEmail: `credit-gallery-${suffix}@example.com`,
      logoPrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });

    const event = await createEvent(db, {
      partnerId: partner.id,
      title: `Credit Gallery Event ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Creditstraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTimes: [new Date("2026-07-20T18:00:00.000Z")],
      creditPrice: 1,
      secretCode: `C${suffix.slice(0, 7)}`,
      imagePrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });

    const creditedGalleryId = await persistPrebuiltImage(db, createTestImagePrebuilt(), {
      skipUpload: true,
      credit: "Photo: Ada",
    });
    const blankGalleryId = await persistPrebuiltImage(db, createTestImagePrebuilt(), {
      skipUpload: true,
    });

    try {
      await addEventGalleryImages(db, event.id, [creditedGalleryId, blankGalleryId]);
      const listed = await listEventGalleryImages(db, event.id);
      expect(listed.find((row) => row.imageId === creditedGalleryId)?.credit).toBe("Photo: Ada");
      expect(listed.find((row) => row.imageId === blankGalleryId)?.credit).toBeNull();
    } finally {
      await deleteEvent(db, event.id, { skipBucket: true });
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });
});
