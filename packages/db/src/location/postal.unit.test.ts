import { describe, expect, test } from "bun:test";
import {
  DEFAULT_LOCATION_CITY,
  DEFAULT_LOCATION_COUNTRY,
  PostalValidationError,
  validatePostalCode,
} from "./postal";

describe("validatePostalCode", () => {
  test("accepts valid Berlin PLZ under DE/berlin", () => {
    expect(validatePostalCode({ country: "DE", city: "berlin", zipCode: "10115" })).toEqual({
      country: "DE",
      city: "berlin",
      zipCode: "10115",
    });
  });

  test("defaults omitted country/city to DE/berlin", () => {
    expect(validatePostalCode({ zipCode: "10969" })).toEqual({
      country: DEFAULT_LOCATION_COUNTRY,
      city: DEFAULT_LOCATION_CITY,
      zipCode: "10969",
    });
  });

  test("normalizes country/city casing", () => {
    expect(validatePostalCode({ country: "de", city: "Berlin", zipCode: "12047" })).toEqual({
      country: "DE",
      city: "berlin",
      zipCode: "12047",
    });
  });

  test("rejects missing zip", () => {
    expect(() => validatePostalCode({ country: "DE", city: "berlin", zipCode: "  " })).toThrow(
      PostalValidationError,
    );
    try {
      validatePostalCode({ zipCode: null });
    } catch (error) {
      expect(error).toBeInstanceOf(PostalValidationError);
      expect((error as PostalValidationError).code).toBe("MISSING_POSTAL_CODE");
    }
  });

  test("rejects malformed zip", () => {
    try {
      validatePostalCode({ zipCode: "1011" });
    } catch (error) {
      expect(error).toBeInstanceOf(PostalValidationError);
      expect((error as PostalValidationError).code).toBe("INVALID_POSTAL_CODE");
    }
  });

  test("rejects non-Berlin well-formed PLZ", () => {
    try {
      validatePostalCode({ country: "DE", city: "berlin", zipCode: "80331" });
    } catch (error) {
      expect(error).toBeInstanceOf(PostalValidationError);
      expect((error as PostalValidationError).code).toBe("INVALID_POSTAL_CODE");
    }
  });

  test("rejects unsupported city", () => {
    try {
      validatePostalCode({ country: "DE", city: "munich", zipCode: "10115" });
    } catch (error) {
      expect(error).toBeInstanceOf(PostalValidationError);
      expect((error as PostalValidationError).code).toBe("UNSUPPORTED_LOCATION");
    }
  });

  test("rejects unsupported country", () => {
    try {
      validatePostalCode({ country: "US", city: "berlin", zipCode: "10115" });
    } catch (error) {
      expect(error).toBeInstanceOf(PostalValidationError);
      expect((error as PostalValidationError).code).toBe("UNSUPPORTED_LOCATION");
    }
  });
});
