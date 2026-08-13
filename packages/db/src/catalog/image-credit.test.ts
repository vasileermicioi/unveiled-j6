import { describe, expect, test } from "bun:test";

import { CatalogValidationError } from "./errors";
import { IMAGE_CREDIT_MAX_LENGTH, normalizeImageCredit } from "./images";

describe("normalizeImageCredit", () => {
  test("omitted, null, and whitespace store null", () => {
    expect(normalizeImageCredit()).toBeNull();
    expect(normalizeImageCredit(undefined)).toBeNull();
    expect(normalizeImageCredit(null)).toBeNull();
    expect(normalizeImageCredit("")).toBeNull();
    expect(normalizeImageCredit("   ")).toBeNull();
  });

  test("trims surrounding whitespace", () => {
    expect(normalizeImageCredit("  Photo: Ada  ")).toBe("Photo: Ada");
  });

  test("accepts 200 characters after trim", () => {
    const credit = "a".repeat(IMAGE_CREDIT_MAX_LENGTH);
    expect(normalizeImageCredit(`  ${credit}  `)).toBe(credit);
  });

  test("rejects more than 200 characters after trim", () => {
    const credit = "a".repeat(IMAGE_CREDIT_MAX_LENGTH + 1);
    try {
      normalizeImageCredit(credit);
      throw new Error("expected CatalogValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogValidationError);
      expect((error as CatalogValidationError).code).toBe("IMAGE_CREDIT_TOO_LONG");
    }
  });
});
