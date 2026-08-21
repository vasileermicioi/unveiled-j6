import { describe, expect, test } from "bun:test";

import { CatalogValidationError } from "./errors";
import {
  assertEventCategory,
  assertEventType,
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABELS,
  EVENT_TYPE_LABELS,
  EVENT_TYPES,
  getEventCategoryLabel,
  getEventTypeLabel,
  LEGACY_EVENT_CATEGORY_MAP,
  LEGACY_EVENT_TYPE_MAP,
  mapLegacyEventCategory,
  mapLegacyEventType,
} from "./event-taxonomy";

describe("event taxonomy", () => {
  test("allowlists have locked lengths, snake_case keys, and no Other", () => {
    expect(EVENT_CATEGORIES).toHaveLength(27);
    expect(EVENT_TYPES).toHaveLength(32);
    expect(EVENT_CATEGORIES).not.toContain("Other");
    expect(EVENT_TYPES).not.toContain("Other");
    for (const key of [...EVENT_CATEGORIES, ...EVENT_TYPES]) {
      expect(key).toMatch(/^[a-z]+(_[a-z]+)*$/);
    }
  });

  test("every key has a non-empty DE and EN label", () => {
    for (const key of EVENT_CATEGORIES) {
      expect(EVENT_CATEGORY_LABELS.de[key].length).toBeGreaterThan(0);
      expect(EVENT_CATEGORY_LABELS.en[key].length).toBeGreaterThan(0);
    }
    for (const key of EVENT_TYPES) {
      expect(EVENT_TYPE_LABELS.de[key].length).toBeGreaterThan(0);
      expect(EVENT_TYPE_LABELS.en[key].length).toBeGreaterThan(0);
    }
  });

  test("parent DE/EN samples", () => {
    expect(getEventCategoryLabel("de", "cinema")).toBe("Kino");
    expect(getEventCategoryLabel("en", "cinema")).toBe("Cinema");
    expect(getEventTypeLabel("en", "theater_play")).toBe("Theater performance / play");
    expect(getEventTypeLabel("de", "theater_play")).toBe("Theateraufführung / Schauspiel");
    expect(getEventCategoryLabel("en", "not_a_key")).toBe("not_a_key");
  });

  test("maps every locked legacy category pair", () => {
    const expected: Record<string, string> = {
      Theater: "theater",
      Kino: "cinema",
      Museum: "museum",
      Ausstellung: "exhibition_hall",
      Konzert: "live_music_venue",
      "Talk/Lesung": "literature_house",
      Comedy: "comedy_club",
      "Tanz/Performance": "dance_venue",
      Other: "cultural_center",
      Music: "live_music_venue",
      music: "live_music_venue",
      Art: "kunsthalle",
      Film: "cinema",
      Talk: "literature_house",
    };
    expect(LEGACY_EVENT_CATEGORY_MAP).toEqual(expected);
    for (const [from, to] of Object.entries(expected)) {
      expect(mapLegacyEventCategory(from)).toBe(to);
    }
    expect(mapLegacyEventCategory("unknown")).toBeUndefined();
  });

  test("maps every locked legacy event type pair", () => {
    const expected: Record<string, string> = {
      Performance: "theater_play",
      Concert: "concert",
      Tour: "guided_tour",
      Talk: "talk_lecture",
      Workshop: "workshop",
      Screening: "film_screening",
      Reading: "reading",
      Other: "special_event",
    };
    expect(LEGACY_EVENT_TYPE_MAP).toEqual(expected);
    for (const [from, to] of Object.entries(expected)) {
      expect(mapLegacyEventType(from)).toBe(to);
    }
    expect(mapLegacyEventType("unknown")).toBeUndefined();
  });

  test("assertEventCategory accepts allowlisted keys and rejects unknown or empty", () => {
    expect(assertEventCategory("theater")).toBe("theater");
    expect(assertEventCategory("  cinema  ")).toBe("cinema");
    try {
      assertEventCategory("Music");
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogValidationError);
      expect((error as CatalogValidationError).code).toBe("INVALID_EVENT_CATEGORY");
    }
    try {
      assertEventCategory("");
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogValidationError);
      expect((error as CatalogValidationError).code).toBe("REQUIRED_FIELD");
    }
  });

  test("assertEventType accepts allowlisted keys and rejects unknown or empty", () => {
    expect(assertEventType("theater_play")).toBe("theater_play");
    try {
      assertEventType("Performance");
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogValidationError);
      expect((error as CatalogValidationError).code).toBe("INVALID_EVENT_TYPE");
    }
    try {
      assertEventType("   ");
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogValidationError);
      expect((error as CatalogValidationError).code).toBe("REQUIRED_FIELD");
    }
  });
});
