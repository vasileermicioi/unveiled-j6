import { describe, expect, test } from "bun:test";
import { createDb } from "@unveiled/db";
import { eq } from "drizzle-orm";
import { featuredPartners } from "../schema/featured-partners";
import { CatalogValidationError } from "./errors";
import {
  addFeaturedPartner,
  listFeaturedPartners,
  removeFeaturedPartner,
  removeFeaturedPartners,
  reorderFeaturedPartners,
  searchPartnersNotFeatured,
} from "./featured-partners";
import { createPartner, deletePartner, getPartnerById } from "./partners";
import { createTestImagePrebuilt } from "./test-image";

const databaseUrl = process.env.DATABASE_URL;

async function createTestImage() {
  return createTestImagePrebuilt();
}

describe("featured partners integration", () => {
  test("list order, add append, duplicate reject, remove keeps partner, search excludes featured", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);

    const first = await createPartner(db, {
      name: `Featured Partner A ${suffix}`,
      address: "Featuredstraße 1, Berlin",
      contactEmail: `featured-a-${suffix}@example.com`,
      logoPrebuilt: await createTestImage(),
      skipUpload: true,
    });

    const second = await createPartner(db, {
      name: `Featured Partner B ${suffix}`,
      address: "Featuredstraße 2, Berlin",
      contactEmail: `featured-b-${suffix}@example.com`,
      logoPrebuilt: await createTestImage(),
      skipUpload: true,
    });

    const notFeatured = await createPartner(db, {
      name: `Not Featured Partner ${suffix}`,
      address: "Featuredstraße 3, Berlin",
      contactEmail: `not-featured-${suffix}@example.com`,
      logoPrebuilt: await createTestImage(),
      skipUpload: true,
    });

    try {
      const addedFirst = await addFeaturedPartner(db, first.id);
      expect(addedFirst.id).toBe(first.id);

      const addedSecond = await addFeaturedPartner(db, second.id);
      expect(addedSecond.sortOrder).toBeGreaterThan(addedFirst.sortOrder);

      let duplicateError: unknown;
      try {
        await addFeaturedPartner(db, first.id);
      } catch (error) {
        duplicateError = error;
      }
      expect(duplicateError).toBeInstanceOf(CatalogValidationError);
      expect((duplicateError as CatalogValidationError).code).toBe("ALREADY_FEATURED");

      const allFeatured = await listFeaturedPartners(db);
      const allIds = allFeatured.map((row) => row.id);
      expect(allIds).toContain(first.id);
      expect(allIds).toContain(second.id);
      expect(allIds.indexOf(first.id)).toBeLessThan(allIds.indexOf(second.id));

      const limited = await listFeaturedPartners(db, { limit: 1 });
      expect(limited).toHaveLength(1);

      const candidates = await searchPartnersNotFeatured(db, { q: suffix });
      const candidateIds = candidates.map((row) => row.id);
      expect(candidateIds).toContain(notFeatured.id);
      expect(candidateIds).not.toContain(first.id);
      expect(candidateIds).not.toContain(second.id);

      await removeFeaturedPartner(db, first.id);
      const afterRemove = await db
        .select()
        .from(featuredPartners)
        .where(eq(featuredPartners.partnerId, first.id));
      expect(afterRemove).toHaveLength(0);

      const partnerStillExists = await getPartnerById(db, first.id);
      expect(partnerStillExists).not.toBeNull();
      expect(partnerStillExists?.id).toBe(first.id);
    } finally {
      await removeFeaturedPartner(db, first.id);
      await removeFeaturedPartner(db, second.id);
      await deletePartner(db, first.id, { skipBucket: true });
      await deletePartner(db, second.id, { skipBucket: true });
      await deletePartner(db, notFeatured.id, { skipBucket: true });
    }
  });

  test("reorder permutes sort_order; invalid set rejected; bulk remove keeps venues", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);

    const first = await createPartner(db, {
      name: `Reorder Partner A ${suffix}`,
      address: "Reorderstraße 1, Berlin",
      contactEmail: `reorder-a-${suffix}@example.com`,
      logoPrebuilt: await createTestImage(),
      skipUpload: true,
    });
    const second = await createPartner(db, {
      name: `Reorder Partner B ${suffix}`,
      address: "Reorderstraße 2, Berlin",
      contactEmail: `reorder-b-${suffix}@example.com`,
      logoPrebuilt: await createTestImage(),
      skipUpload: true,
    });
    const third = await createPartner(db, {
      name: `Reorder Partner C ${suffix}`,
      address: "Reorderstraße 3, Berlin",
      contactEmail: `reorder-c-${suffix}@example.com`,
      logoPrebuilt: await createTestImage(),
      skipUpload: true,
    });

    try {
      await addFeaturedPartner(db, first.id);
      await addFeaturedPartner(db, second.id);
      await addFeaturedPartner(db, third.id);

      // Shared DBs may already have other featured partners — preserve them in the permutation.
      const existingOthers = (await listFeaturedPartners(db))
        .map((row) => row.id)
        .filter((id) => id !== first.id && id !== second.id && id !== third.id);
      const nextOrder = [third.id, first.id, second.id, ...existingOthers];
      const reordered = await reorderFeaturedPartners(db, nextOrder);
      expect(reordered.map((row) => row.id).slice(0, 3)).toEqual([third.id, first.id, second.id]);
      expect(reordered.slice(0, 3).map((row) => row.sortOrder)).toEqual([0, 1, 2]);

      let invalidError: unknown;
      try {
        await reorderFeaturedPartners(db, [first.id, second.id]);
      } catch (error) {
        invalidError = error;
      }
      expect(invalidError).toBeInstanceOf(CatalogValidationError);
      expect((invalidError as CatalogValidationError).code).toBe(
        "FEATURED_PARTNERS_REORDER_INVALID",
      );

      await removeFeaturedPartners(db, [first.id, third.id]);
      const remainingIds = (await listFeaturedPartners(db)).map((row) => row.id);
      expect(remainingIds).toContain(second.id);
      expect(remainingIds).not.toContain(first.id);
      expect(remainingIds).not.toContain(third.id);

      expect(await getPartnerById(db, first.id)).not.toBeNull();
      expect(await getPartnerById(db, third.id)).not.toBeNull();
    } finally {
      await removeFeaturedPartners(db, [first.id, second.id, third.id]);
      await deletePartner(db, first.id, { skipBucket: true });
      await deletePartner(db, second.id, { skipBucket: true });
      await deletePartner(db, third.id, { skipBucket: true });
    }
  });

  test("deleting a partner cascades featured membership", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const image = await createTestImage();
    const partner = await createPartner(db, {
      name: `Featured Cascade Partner ${suffix}`,
      address: "Cascadestraße 1, Berlin",
      contactEmail: `featured-cascade-${suffix}@example.com`,
      logoPrebuilt: image,
      skipUpload: true,
    });

    try {
      await addFeaturedPartner(db, partner.id);
      await deletePartner(db, partner.id, { skipBucket: true });

      const featuredRows = await db
        .select()
        .from(featuredPartners)
        .where(eq(featuredPartners.partnerId, partner.id));
      expect(featuredRows).toHaveLength(0);
    } finally {
      await removeFeaturedPartner(db, partner.id);
      try {
        await deletePartner(db, partner.id, { skipBucket: true });
      } catch {
        // Partner already deleted in the happy path.
      }
    }
  });
});
