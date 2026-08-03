import { describe, expect, test } from "bun:test";
import { createDb } from "@unveiled/db";

import { CatalogValidationError } from "./errors";
import type { OpeningHoursWeek } from "./opening-hours";
import { createPartner, deletePartner, getPartnerById, updatePartner } from "./partners";
import { createTestImagePrebuilt } from "./test-image";
import { structuredLocationFromAddress } from "./test-location";

const databaseUrl = process.env.DATABASE_URL;

function fullWeek(overrides?: Partial<OpeningHoursWeek>): OpeningHoursWeek {
  const base: OpeningHoursWeek = {
    mon: { open: "09:00", close: "17:00" },
    tue: { open: "09:00", close: "17:00" },
    wed: { open: "09:00", close: "17:00" },
    thu: { open: "09:00", close: "17:00" },
    fri: { open: "09:00", close: "17:00" },
    sat: { closed: true },
    sun: { closed: true },
  };
  return { ...base, ...overrides };
}

describe("partner opening hours integration", () => {
  test("persist valid schedule, clear on disable, reject invalid without partial write", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const week = fullWeek();

    const partner = await createPartner(db, {
      name: `Hours Partner ${suffix}`,
      ...structuredLocationFromAddress("Stundenstraße 1, Berlin"),
      contactEmail: `hours-${suffix}@example.com`,
      logoPrebuilt: await createTestImagePrebuilt(),
      skipUpload: true,
      hasOpeningHours: true,
      openingHours: week,
    });

    try {
      expect(partner.hasOpeningHours).toBe(true);
      expect(partner.openingHours).toEqual(week);

      const fetched = await getPartnerById(db, partner.id);
      expect(fetched?.hasOpeningHours).toBe(true);
      expect(fetched?.openingHours).toEqual(week);

      const defaulted = await createPartner(db, {
        name: `No Hours Partner ${suffix}`,
        ...structuredLocationFromAddress("Stundenstraße 2, Berlin"),
        contactEmail: `no-hours-${suffix}@example.com`,
        logoPrebuilt: await createTestImagePrebuilt(),
        skipUpload: true,
      });
      try {
        expect(defaulted.hasOpeningHours).toBe(false);
        expect(defaulted.openingHours).toBeNull();
      } finally {
        await deletePartner(db, defaulted.id, { skipBucket: true });
      }

      let invalidError: unknown;
      try {
        await updatePartner(db, partner.id, {
          hasOpeningHours: true,
          openingHours: fullWeek({ mon: { open: "18:00", close: "10:00" } }),
        });
      } catch (error) {
        invalidError = error;
      }
      expect(invalidError).toBeInstanceOf(CatalogValidationError);
      expect((invalidError as CatalogValidationError).code).toBe("INVALID_OPENING_HOURS");

      const afterInvalid = await getPartnerById(db, partner.id);
      expect(afterInvalid?.hasOpeningHours).toBe(true);
      expect(afterInvalid?.openingHours).toEqual(week);

      const cleared = await updatePartner(db, partner.id, {
        hasOpeningHours: false,
        openingHours: week,
      });
      expect(cleared.hasOpeningHours).toBe(false);
      expect(cleared.openingHours).toBeNull();

      const afterClear = await getPartnerById(db, partner.id);
      expect(afterClear?.hasOpeningHours).toBe(false);
      expect(afterClear?.openingHours).toBeNull();
    } finally {
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });
});
