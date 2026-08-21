import { describe, expect, test } from "bun:test";
import { CatalogValidationError } from "@unveiled/db";
import type { EventFormValues } from "./admin-event-form";
import {
  assertCapacityMatchesInventory,
  datetimeCapacityTotal,
  resolveVoucherDerivedCapacity,
  voucherInventoryDisplayCount,
} from "./admin-voucher-inventory";

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

function voucherForm(overrides: Partial<EventFormValues> = {}): EventFormValues {
  return {
    partnerId: "partner-1",
    titleDe: "Jazz Night",
    titleEn: "Jazz Night",
    descriptionDe: "Live set",
    descriptionEn: "Live set",
    street: "Main St",
    houseNumber: "1",
    addressLine2: null,
    zipCode: "10115",
    category: "Music",
    eventType: "Concert",
    tags: [],
    dateTimeRows: [{ date: "2026-08-01", time: "20:00", credits: "2", capacity: "10" }],
    timingMode: "TIME_SLOT",
    creditPrice: 2,
    totalCapacity: 10,
    capacityMode: "SHARED",
    ticketType: "VOUCHER_PROMO",
    secretCode: null,
    eventWebsiteUrl: "https://example.com",
    promoCodes: ["A", "B", "C", "D", "E", "F", "G"],
    voucherPdfs: [],
    replaceUnusedInventory: false,
    languageIndependent: false,
    languages: null,
    hasSubtitles: false,
    subtitleLanguages: null,
    lat: null,
    lng: null,
    imageUpload: null,
    imageUrl: null,
    imagePrebuilt: null,
    stagedImageId: null,
    imageCredit: "",
    ...overrides,
  };
}

describe("assertCapacityMatchesInventory", () => {
  test("throws when inventory count disagrees with SHARED capacity", () => {
    expect(() => assertCapacityMatchesInventory(voucherForm())).toThrow(CatalogValidationError);
    try {
      assertCapacityMatchesInventory(voucherForm());
    } catch (error) {
      expect((error as CatalogValidationError).code).toBe("CAPACITY_INVENTORY_MISMATCH");
    }
  });

  test("does not throw when inventory equals capacity", () => {
    expect(() =>
      assertCapacityMatchesInventory(
        voucherForm({ promoCodes: Array.from({ length: 10 }, (_, index) => `C${index}`) }),
      ),
    ).not.toThrow();
  });

  test("SECRET_CODE is a no-op", () => {
    expect(() =>
      assertCapacityMatchesInventory(voucherForm({ ticketType: "SECRET_CODE", promoCodes: ["A"] })),
    ).not.toThrow();
  });

  test("empty voucher defers to inventory-present (no mismatch)", () => {
    expect(() => assertCapacityMatchesInventory(voucherForm({ promoCodes: [] }))).not.toThrow();
  });

  test("datetimeCapacityTotal sums PER_OCCURRENCE rows", () => {
    expect(
      datetimeCapacityTotal(
        voucherForm({
          capacityMode: "PER_OCCURRENCE",
          dateTimeRows: [
            { date: "2026-08-01", time: "20:00", credits: "1", capacity: "4" },
            { date: "2026-08-08", time: "21:00", credits: "1", capacity: "6" },
          ],
        }),
      ),
    ).toBe(10);
  });

  test("voucherInventoryDisplayCount matches derive rules", () => {
    expect(voucherInventoryDisplayCount("SECRET_CODE", 3, false, null)).toBeNull();
    expect(voucherInventoryDisplayCount("VOUCHER_PROMO", 3, false, null)).toBe(3);
    expect(
      voucherInventoryDisplayCount("VOUCHER_PROMO", 2, false, {
        promo: { available: 5, allocated: 2 },
        pdf: { available: 0, allocated: 0 },
      }),
    ).toBe(9);
  });
});
