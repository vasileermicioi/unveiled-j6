import { describe, expect, test } from "bun:test";

import { composeDisplayAddress, parseLegacyAddress } from "./address";

describe("composeDisplayAddress", () => {
  test("composes street house zip Berlin without line2", () => {
    expect(
      composeDisplayAddress({
        street: "Oranienstraße",
        houseNumber: "25",
        zipCode: "10999",
        city: "berlin",
      }),
    ).toBe("Oranienstraße 25, 10999 Berlin");
  });

  test("includes optional address line2", () => {
    expect(
      composeDisplayAddress({
        street: "Torstraße",
        houseNumber: "1",
        addressLine2: "Hinterhaus",
        zipCode: "10119",
        city: "berlin",
      }),
    ).toBe("Torstraße 1, Hinterhaus, 10119 Berlin");
  });

  test("trims whitespace and ignores blank line2", () => {
    expect(
      composeDisplayAddress({
        street: "  Hauptstraße ",
        houseNumber: " 12a ",
        addressLine2: "  ",
        zipCode: "10115",
      }),
    ).toBe("Hauptstraße 12a, 10115 Berlin");
  });
});

describe("parseLegacyAddress", () => {
  test("parses German street house and PLZ", () => {
    expect(parseLegacyAddress("Oranienstraße 25, 10999 Berlin")).toEqual({
      street: "Oranienstraße",
      houseNumber: "25",
      addressLine2: null,
      zipCode: "10999",
    });
  });

  test("parses line2 before city suffix", () => {
    expect(parseLegacyAddress("Torstraße 1, Hinterhaus, 10119 Berlin")).toEqual({
      street: "Torstraße",
      houseNumber: "1",
      addressLine2: "Hinterhaus",
      zipCode: "10119",
    });
  });

  test("falls back to full street and house 1 when unparseable", () => {
    expect(parseLegacyAddress("Somewhere in Kreuzberg")).toEqual({
      street: "Somewhere in Kreuzberg",
      houseNumber: "1",
      addressLine2: null,
      zipCode: null,
    });
  });
});
