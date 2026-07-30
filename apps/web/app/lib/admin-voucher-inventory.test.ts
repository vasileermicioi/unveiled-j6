import { describe, expect, test } from "bun:test";

import { resolveVoucherDerivedCapacity } from "./admin-voucher-inventory";

describe("resolveVoucherDerivedCapacity", () => {
  test("returns null for SECRET_CODE", () => {
    expect(
      resolveVoucherDerivedCapacity(
        "SECRET_CODE",
        { promoCodes: ["A"], pdfItems: [], replaceUnused: false },
        null,
      ),
    ).toBeNull();
  });

  test("create promo capacity equals code count", () => {
    expect(
      resolveVoucherDerivedCapacity(
        "VOUCHER_PROMO",
        { promoCodes: ["A", "B", "C"], pdfItems: [], replaceUnused: false },
        null,
      ),
    ).toBe(3);
  });

  test("create pdf capacity equals file count", () => {
    expect(
      resolveVoucherDerivedCapacity(
        "VOUCHER_PDF",
        {
          promoCodes: [],
          pdfItems: [{ objectKey: "a.pdf" }, { objectKey: "b.pdf" }, { objectKey: "c.pdf" }],
          replaceUnused: false,
        },
        null,
      ),
    ).toBe(3);
  });

  test("edit append adds to existing inventory total", () => {
    expect(
      resolveVoucherDerivedCapacity(
        "VOUCHER_PROMO",
        { promoCodes: ["X", "Y"], pdfItems: [], replaceUnused: false },
        { promo: { available: 5, allocated: 2 }, pdf: { available: 0, allocated: 0 } },
      ),
    ).toBe(9);
  });

  test("edit replace unused keeps allocated and swaps available", () => {
    expect(
      resolveVoucherDerivedCapacity(
        "VOUCHER_PDF",
        {
          promoCodes: [],
          pdfItems: [{ objectKey: "n1.pdf" }, { objectKey: "n2.pdf" }, { objectKey: "n3.pdf" }],
          replaceUnused: true,
        },
        { promo: { available: 0, allocated: 0 }, pdf: { available: 5, allocated: 2 } },
      ),
    ).toBe(5);
  });

  test("edit with empty payload syncs from existing inventory", () => {
    expect(
      resolveVoucherDerivedCapacity(
        "VOUCHER_PROMO",
        { promoCodes: [], pdfItems: [], replaceUnused: false },
        { promo: { available: 4, allocated: 3 }, pdf: { available: 0, allocated: 0 } },
      ),
    ).toBe(7);
  });
});
