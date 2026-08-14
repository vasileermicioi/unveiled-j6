import { describe, expect, test } from "bun:test";

import { CatalogValidationError } from "./errors";
import { BANK_DETAILS_MAX_LENGTH, normalizeBankDetails } from "./partners";

describe("normalizeBankDetails", () => {
  test("omitted, null, and whitespace store null", () => {
    expect(normalizeBankDetails()).toBeNull();
    expect(normalizeBankDetails(undefined)).toBeNull();
    expect(normalizeBankDetails(null)).toBeNull();
    expect(normalizeBankDetails("")).toBeNull();
    expect(normalizeBankDetails("   ")).toBeNull();
  });

  test("trims surrounding whitespace and keeps inner newlines", () => {
    expect(normalizeBankDetails("  IBAN DE89\nKontoinhaber Ada  ")).toBe(
      "IBAN DE89\nKontoinhaber Ada",
    );
  });

  test("accepts max length after trim", () => {
    const details = "a".repeat(BANK_DETAILS_MAX_LENGTH);
    expect(normalizeBankDetails(`  ${details}  `)).toBe(details);
  });

  test("rejects more than max length after trim", () => {
    const details = "a".repeat(BANK_DETAILS_MAX_LENGTH + 1);
    try {
      normalizeBankDetails(details);
      throw new Error("expected CatalogValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogValidationError);
      expect((error as CatalogValidationError).code).toBe("BANK_DETAILS_TOO_LONG");
    }
  });
});
