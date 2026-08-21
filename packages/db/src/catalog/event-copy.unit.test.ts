import { describe, expect, test } from "bun:test";

import { CatalogValidationError } from "./errors";
import {
  eventTitleMatchesQuery,
  resolveEventCopy,
  resolveEventCopyFields,
  resolveUpdatedEventCopyFields,
} from "./event-copy";

describe("resolveEventCopyFields", () => {
  test("sets canonical title and description from German", () => {
    expect(
      resolveEventCopyFields({
        titleDe: "Konzert",
        titleEn: "Concert",
        descriptionDe: "Auf Deutsch",
        descriptionEn: "In English",
      }),
    ).toEqual({
      titleDe: "Konzert",
      titleEn: "Concert",
      descriptionDe: "Auf Deutsch",
      descriptionEn: "In English",
      title: "Konzert",
      description: "Auf Deutsch",
    });
  });

  test("trims locale fields", () => {
    expect(
      resolveEventCopyFields({
        titleDe: "  Konzert  ",
        titleEn: " Concert ",
        descriptionDe: " DE ",
        descriptionEn: " EN ",
      }),
    ).toEqual({
      titleDe: "Konzert",
      titleEn: "Concert",
      descriptionDe: "DE",
      descriptionEn: "EN",
      title: "Konzert",
      description: "DE",
    });
  });

  test("rejects empty or whitespace titleEn", () => {
    expect(() =>
      resolveEventCopyFields({
        titleDe: "Konzert",
        titleEn: "",
        descriptionDe: "DE",
        descriptionEn: "EN",
      }),
    ).toThrow(CatalogValidationError);

    try {
      resolveEventCopyFields({
        titleDe: "Konzert",
        titleEn: "   ",
        descriptionDe: "DE",
        descriptionEn: "EN",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogValidationError);
      expect((error as CatalogValidationError).code).toBe("REQUIRED_FIELD");
      expect((error as CatalogValidationError).message).toBe("titleEn is required");
    }
  });

  test("rejects empty or whitespace descriptionEn", () => {
    expect(() =>
      resolveEventCopyFields({
        titleDe: "Konzert",
        titleEn: "Concert",
        descriptionDe: "DE",
        descriptionEn: "  ",
      }),
    ).toThrow(CatalogValidationError);

    try {
      resolveEventCopyFields({
        titleDe: "Konzert",
        titleEn: "Concert",
        descriptionDe: "DE",
        descriptionEn: "",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogValidationError);
      expect((error as CatalogValidationError).code).toBe("REQUIRED_FIELD");
      expect((error as CatalogValidationError).message).toBe("descriptionEn is required");
    }
  });

  test("shims a single title and description into both locales", () => {
    expect(
      resolveEventCopyFields({
        title: "Jazz Night",
        description: "Live set",
      }),
    ).toEqual({
      titleDe: "Jazz Night",
      titleEn: "Jazz Night",
      descriptionDe: "Live set",
      descriptionEn: "Live set",
      title: "Jazz Night",
      description: "Live set",
    });
  });
});

describe("resolveUpdatedEventCopyFields", () => {
  const existing = resolveEventCopyFields({
    titleDe: "Konzert",
    titleEn: "Concert",
    descriptionDe: "Auf Deutsch",
    descriptionEn: "In English",
  });

  test("keeps stored copy when neither locale nor legacy fields are passed", () => {
    expect(resolveUpdatedEventCopyFields({}, existing)).toEqual(existing);
  });

  test("legacy title overwrite shims both locales", () => {
    expect(
      resolveUpdatedEventCopyFields({ title: "Jazz Night", description: "Live set" }, existing),
    ).toEqual({
      titleDe: "Jazz Night",
      titleEn: "Jazz Night",
      descriptionDe: "Live set",
      descriptionEn: "Live set",
      title: "Jazz Night",
      description: "Live set",
    });
  });
});

describe("resolveEventCopy", () => {
  test("prefers the requested locale", () => {
    expect(
      resolveEventCopy(
        {
          title: "Konzert",
          description: "Auf Deutsch",
          titleDe: "Konzert",
          titleEn: "Concert",
          descriptionDe: "Auf Deutsch",
          descriptionEn: "In English",
        },
        "en",
      ),
    ).toEqual({ title: "Concert", description: "In English" });
  });

  test("falls back to the other locale then canonical", () => {
    expect(
      resolveEventCopy(
        {
          title: "Konzert",
          description: "Auf Deutsch",
          titleDe: "Konzert",
          titleEn: "",
          descriptionDe: "Auf Deutsch",
          descriptionEn: "",
        },
        "en",
      ),
    ).toEqual({ title: "Konzert", description: "Auf Deutsch" });

    expect(
      resolveEventCopy(
        {
          title: "Canonical",
          description: "Canonical body",
          titleDe: "",
          titleEn: "",
          descriptionDe: "",
          descriptionEn: "",
        },
        "en",
      ),
    ).toEqual({ title: "Canonical", description: "Canonical body" });
  });
});

describe("eventTitleMatchesQuery", () => {
  test("matches EN-only and DE-only substrings case-insensitively", () => {
    expect(eventTitleMatchesQuery("Konzert", "Concert", "Concert")).toBe(true);
    expect(eventTitleMatchesQuery("Konzert", "Concert", "konzert")).toBe(true);
    expect(eventTitleMatchesQuery("Jazz Night", "Jazz Night", "ballet")).toBe(false);
    expect(eventTitleMatchesQuery("Konzert", "Concert", "  CONCERT  ")).toBe(true);
    expect(eventTitleMatchesQuery("Konzert", "Concert", "")).toBe(false);
  });
});
