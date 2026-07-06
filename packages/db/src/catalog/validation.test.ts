import { describe, expect, test } from "bun:test";
import { CatalogValidationError } from "./errors";
import {
  applyEventDefaults,
  validateEmail,
  validateImageSourceExclusive,
  validateRedemptionConfig,
  validateUniqueSeriesSlots,
} from "./validation";

describe("validateEmail", () => {
  test("accepts a valid email", () => {
    expect(validateEmail("partner@example.com")).toBe("partner@example.com");
  });

  test("rejects invalid email", () => {
    expect(() => validateEmail("not-an-email")).toThrow(CatalogValidationError);
  });
});

describe("validateImageSourceExclusive", () => {
  test("rejects missing required image", () => {
    expect(() => validateImageSourceExclusive(undefined, undefined, { required: true })).toThrow(
      CatalogValidationError,
    );
  });

  test("rejects both upload and URL", () => {
    expect(() =>
      validateImageSourceExclusive(Buffer.from("x"), "https://example.com/image.jpg"),
    ).toThrow(CatalogValidationError);
  });
});

describe("validateRedemptionConfig", () => {
  test("requires secret code for manual secret-code tickets", () => {
    expect(() =>
      validateRedemptionConfig({
        ticketType: "SECRET_CODE",
        secretCodeMode: "MANUAL",
        secretCode: "",
      }),
    ).toThrow(CatalogValidationError);
  });

  test("requires promo and website for voucher tickets", () => {
    expect(() =>
      validateRedemptionConfig({
        ticketType: "VOUCHER",
        promoCode: "SAVE10",
        eventWebsiteUrl: "",
      }),
    ).toThrow(CatalogValidationError);
  });
});

describe("validateUniqueSeriesSlots", () => {
  test("rejects duplicate slots", () => {
    const slot = new Date("2026-08-01T18:00:00.000Z");
    expect(() => validateUniqueSeriesSlots([slot, slot])).toThrow(CatalogValidationError);
  });

  test("rejects empty slot list", () => {
    expect(() => validateUniqueSeriesSlots([])).toThrow(CatalogValidationError);
  });
});

describe("applyEventDefaults", () => {
  test("applies documented defaults", () => {
    expect(applyEventDefaults({})).toEqual({
      totalCapacity: 10,
      ticketType: "SECRET_CODE",
      secretCodeMode: "MANUAL",
      timingMode: "TIME_SLOT",
    });
  });
});
