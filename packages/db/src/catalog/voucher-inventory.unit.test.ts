import { describe, expect, test } from "bun:test";

import { CatalogValidationError } from "./errors";
import { assertVoucherInventoryPresent, normalizePromoCodes } from "./voucher-inventory";

describe("normalizePromoCodes", () => {
  test("trims and drops empty lines", () => {
    expect(normalizePromoCodes(["  A  ", "", "B", "  "])).toEqual(["A", "B"]);
  });

  test("rejects duplicates within upload", () => {
    expect(() => normalizePromoCodes(["A", "A"])).toThrow(CatalogValidationError);
    try {
      normalizePromoCodes(["CODE", " CODE "]);
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogValidationError);
      expect((error as CatalogValidationError).code).toBe("DUPLICATE_VOUCHER_CODE");
    }
  });

  test("keeps whole line including commas", () => {
    expect(normalizePromoCodes(["FOO,BAR", "BAZ"])).toEqual(["FOO,BAR", "BAZ"]);
  });
});

describe("assertVoucherInventoryPresent", () => {
  test("requires promo inventory on create", () => {
    expect(() =>
      assertVoucherInventoryPresent(
        "VOUCHER_PROMO",
        { promoCodes: [], pdfItems: [] },
        { mode: "create" },
      ),
    ).toThrow(CatalogValidationError);
  });

  test("requires pdf inventory on create", () => {
    expect(() =>
      assertVoucherInventoryPresent(
        "VOUCHER_PDF",
        { promoCodes: [], pdfItems: [] },
        { mode: "create" },
      ),
    ).toThrow(CatalogValidationError);
  });

  test("allows edit without new payload when stock exists", () => {
    expect(() =>
      assertVoucherInventoryPresent(
        "VOUCHER_PROMO",
        { promoCodes: [], pdfItems: [] },
        {
          mode: "edit",
          existingCounts: {
            promo: { available: 2, allocated: 1 },
            pdf: { available: 0, allocated: 0 },
          },
        },
      ),
    ).not.toThrow();
  });

  test("rejects edit when no stock and no payload", () => {
    expect(() =>
      assertVoucherInventoryPresent(
        "VOUCHER_PDF",
        { promoCodes: [], pdfItems: [] },
        {
          mode: "edit",
          existingCounts: {
            promo: { available: 0, allocated: 0 },
            pdf: { available: 0, allocated: 0 },
          },
        },
      ),
    ).toThrow(CatalogValidationError);
  });

  test("ignores SECRET_CODE", () => {
    expect(() =>
      assertVoucherInventoryPresent(
        "SECRET_CODE",
        { promoCodes: [], pdfItems: [] },
        { mode: "create" },
      ),
    ).not.toThrow();
  });
});
