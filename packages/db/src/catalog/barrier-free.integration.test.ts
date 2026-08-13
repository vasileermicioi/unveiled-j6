import { describe, expect, test } from "bun:test";
import { createDb } from "@unveiled/db";

import {
  addFeaturedPartner,
  listFeaturedPartners,
  removeFeaturedPartner,
} from "./featured-partners";
import {
  createPartner,
  deletePartner,
  getPartnerById,
  listPartners,
  updatePartner,
} from "./partners";
import { createTestImagePrebuilt } from "./test-image";
import { structuredLocationFromAddress } from "./test-location";

const databaseUrl = process.env.DATABASE_URL;

describe("partner barrier-free integration", () => {
  test("persist, omit, clear, and coerce false", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);

    const omitted = await createPartner(db, {
      name: `BF Omit ${suffix}`,
      ...structuredLocationFromAddress("Barriere Straße 1, Berlin"),
      contactEmail: `bf-omit-${suffix}@example.com`,
      logoPrebuilt: await createTestImagePrebuilt(),
      skipUpload: true,
    });

    try {
      expect(omitted.barrierFree).toBeNull();
      expect((await getPartnerById(db, omitted.id))?.barrierFree).toBeNull();

      const createdTrue = await createPartner(db, {
        name: `BF True ${suffix}`,
        ...structuredLocationFromAddress("Barriere Straße 2, Berlin"),
        contactEmail: `bf-true-${suffix}@example.com`,
        logoPrebuilt: await createTestImagePrebuilt(),
        skipUpload: true,
        barrierFree: true,
      });

      try {
        expect(createdTrue.barrierFree).toBe(true);
        expect((await getPartnerById(db, createdTrue.id))?.barrierFree).toBe(true);

        const listed = await listPartners(db, { q: `BF True ${suffix}`, limit: 10 });
        expect(listed).toHaveLength(1);
        expect(listed[0]?.barrierFree).toBe(true);

        const featured = await addFeaturedPartner(db, createdTrue.id);
        try {
          expect(featured.barrierFree).toBe(true);
          const featuredRows = await listFeaturedPartners(db, { limit: 100 });
          expect(featuredRows.find((row) => row.id === createdTrue.id)?.barrierFree).toBe(true);
        } finally {
          await removeFeaturedPartner(db, createdTrue.id);
        }

        const leftAlone = await updatePartner(db, createdTrue.id, {
          name: `BF True ${suffix} renamed`,
        });
        expect(leftAlone.barrierFree).toBe(true);

        const coercedFalse = await updatePartner(db, createdTrue.id, { barrierFree: false });
        expect(coercedFalse.barrierFree).toBeNull();

        const setAgain = await updatePartner(db, createdTrue.id, { barrierFree: true });
        expect(setAgain.barrierFree).toBe(true);

        const cleared = await updatePartner(db, createdTrue.id, { barrierFree: null });
        expect(cleared.barrierFree).toBeNull();
        expect((await getPartnerById(db, createdTrue.id))?.barrierFree).toBeNull();

        const createdFalse = await createPartner(db, {
          name: `BF False ${suffix}`,
          ...structuredLocationFromAddress("Barriere Straße 3, Berlin"),
          contactEmail: `bf-false-${suffix}@example.com`,
          logoPrebuilt: await createTestImagePrebuilt(),
          skipUpload: true,
          barrierFree: false,
        });
        try {
          expect(createdFalse.barrierFree).toBeNull();
        } finally {
          await deletePartner(db, createdFalse.id, { skipBucket: true });
        }
      } finally {
        await deletePartner(db, createdTrue.id, { skipBucket: true });
      }
    } finally {
      await deletePartner(db, omitted.id, { skipBucket: true });
    }
  });
});
