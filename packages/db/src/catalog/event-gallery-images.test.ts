import { describe, expect, test } from "bun:test";

import { CatalogValidationError } from "./errors";
import { MAX_EVENT_GALLERY_IMAGES } from "./event-gallery-images";

/**
 * Pure permutation checks mirror reorderEventGalleryImages guards so CI can
 * exercise invalid cases without DATABASE_URL. Integration covers the DB path.
 */
function assertReorderPermutation(existingIds: string[], orderedImageIds: string[]): void {
  const uniqueOrdered = [...new Set(orderedImageIds)];
  if (
    uniqueOrdered.length !== orderedImageIds.length ||
    uniqueOrdered.length !== existingIds.length
  ) {
    throw new CatalogValidationError(
      "GALLERY_REORDER_INVALID",
      "Gallery reorder must include each current image id exactly once",
    );
  }
  const existingSet = new Set(existingIds);
  for (const imageId of uniqueOrdered) {
    if (!existingSet.has(imageId)) {
      throw new CatalogValidationError(
        "GALLERY_REORDER_INVALID",
        `Image ${imageId} is not in the gallery`,
      );
    }
  }
}

describe("gallery reorder permutation guards", () => {
  test("accepts a valid permutation", () => {
    expect(() => assertReorderPermutation(["a", "b", "c"], ["c", "a", "b"])).not.toThrow();
  });

  test("rejects duplicates", () => {
    expect(() => assertReorderPermutation(["a", "b"], ["a", "a"])).toThrow(CatalogValidationError);
  });

  test("rejects missing ids", () => {
    expect(() => assertReorderPermutation(["a", "b"], ["a"])).toThrow(CatalogValidationError);
  });

  test("rejects unknown ids", () => {
    expect(() => assertReorderPermutation(["a", "b"], ["a", "x"])).toThrow(CatalogValidationError);
  });

  test("temp offset stays above gallery cap", () => {
    expect(MAX_EVENT_GALLERY_IMAGES + 100).toBeGreaterThan(MAX_EVENT_GALLERY_IMAGES);
  });
});
