import { describe, expect, test } from "bun:test";

import { galleryPhotoAlt, getEventDetailGalleryCopy } from "./event-detail-gallery-copy";

describe("getEventDetailGalleryCopy", () => {
  test("returns JSON-serializable props for islands", () => {
    for (const locale of ["en", "de"] as const) {
      const copy = getEventDetailGalleryCopy(locale);
      expect(() => JSON.stringify(copy)).not.toThrow();
      expect(JSON.parse(JSON.stringify(copy))).toEqual(copy);
      expect(galleryPhotoAlt(copy, 1)).toMatch(/1$/);
    }
  });
});
