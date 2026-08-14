import { describe, expect, test } from "bun:test";

import { CatalogValidationError } from "./errors";
import {
  applyEventDefaults,
  validateEmail,
  validateImageSourceExclusive,
  validateRedemptionConfig,
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

  test("rejects raw upload without prebuilt", () => {
    expect(() => validateImageSourceExclusive(Buffer.from("x"), null)).toThrow(
      CatalogValidationError,
    );
  });

  test("rejects URL alone without prebuilt", () => {
    expect(() => validateImageSourceExclusive(null, "https://example.com/image.jpg")).toThrow(
      CatalogValidationError,
    );
  });

  test("accepts prebuilt alone", () => {
    const prebuilt = {
      imageId: "11111111-1111-1111-1111-111111111111",
      variants: {} as never,
    };
    expect(validateImageSourceExclusive(null, null, { prebuilt })).toEqual({
      type: "prebuilt",
      input: prebuilt,
      sourceUrl: null,
    });
  });

  test("accepts prebuilt with URL as sourceUrl metadata", () => {
    const prebuilt = {
      imageId: "11111111-1111-1111-1111-111111111111",
      variants: {} as never,
    };
    expect(
      validateImageSourceExclusive(null, "https://example.com/image.jpg", { prebuilt }),
    ).toEqual({
      type: "prebuilt",
      input: prebuilt,
      sourceUrl: "https://example.com/image.jpg",
    });
  });

  test("rejects prebuilt with raw upload buffer", () => {
    const prebuilt = {
      imageId: "11111111-1111-1111-1111-111111111111",
      variants: {} as never,
    };
    expect(() => validateImageSourceExclusive(Buffer.from("x"), null, { prebuilt })).toThrow(
      CatalogValidationError,
    );
  });
});

describe("validateRedemptionConfig", () => {
  test("requires secret code for secret-code tickets", () => {
    expect(() =>
      validateRedemptionConfig({
        ticketType: "SECRET_CODE",
        secretCode: "",
      }),
    ).toThrow(CatalogValidationError);
  });

  test("requires website for voucher promo tickets", () => {
    expect(() =>
      validateRedemptionConfig({
        ticketType: "VOUCHER_PROMO",
        eventWebsiteUrl: "",
      }),
    ).toThrow(CatalogValidationError);
  });

  test("accepts voucher promo with website only (inventory checked separately)", () => {
    expect(() =>
      validateRedemptionConfig({
        ticketType: "VOUCHER_PROMO",
        eventWebsiteUrl: "https://example.com/event",
      }),
    ).not.toThrow();
  });

  test("accepts voucher pdf without event-level fields (inventory checked separately)", () => {
    expect(() =>
      validateRedemptionConfig({
        ticketType: "VOUCHER_PDF",
      }),
    ).not.toThrow();
  });
});

describe("applyEventDefaults", () => {
  test("applies documented defaults", () => {
    expect(applyEventDefaults({})).toEqual({
      totalCapacity: 10,
      ticketType: "SECRET_CODE",
      timingMode: "TIME_SLOT",
      capacityMode: "SHARED",
    });
  });
});
