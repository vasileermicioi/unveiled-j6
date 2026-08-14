import { describe, expect, test } from "bun:test";

import { imageAltWithCredit, imageCreditTitle, normalizeImageCredit } from "./image-credit";

describe("normalizeImageCredit", () => {
  test("returns trimmed credit and omits blank", () => {
    expect(normalizeImageCredit("  Photo: Ada  ")).toBe("Photo: Ada");
    expect(normalizeImageCredit("")).toBeNull();
    expect(normalizeImageCredit("   ")).toBeNull();
    expect(normalizeImageCredit(null)).toBeNull();
    expect(normalizeImageCredit(undefined)).toBeNull();
  });
});

describe("imageCreditTitle", () => {
  test("is undefined when credit is empty", () => {
    expect(imageCreditTitle("Photo: Ada")).toBe("Photo: Ada");
    expect(imageCreditTitle("")).toBeUndefined();
    expect(imageCreditTitle(null)).toBeUndefined();
  });
});

describe("imageAltWithCredit", () => {
  test("appends credit in parentheses", () => {
    expect(imageAltWithCredit("Drama 77", "From Berlin Opera website")).toBe(
      "Drama 77 (From Berlin Opera website)",
    );
    expect(imageAltWithCredit("Photo 1", "  Photo: Ada  ")).toBe("Photo 1 (Photo: Ada)");
  });

  test("keeps base alt when credit is empty", () => {
    expect(imageAltWithCredit("Theater am Frankfurter Tor", "")).toBe("Theater am Frankfurter Tor");
    expect(imageAltWithCredit("Theater am Frankfurter Tor", null)).toBe(
      "Theater am Frankfurter Tor",
    );
  });

  test("uses credit alone when base alt is blank", () => {
    expect(imageAltWithCredit("", "Logo: Venue")).toBe("Logo: Venue");
    expect(imageAltWithCredit("   ", "Logo: Venue")).toBe("Logo: Venue");
    expect(imageAltWithCredit("", "")).toBe("");
  });
});
