import { describe, expect, test } from "bun:test";

import {
  firstFormString,
  formatOccurrenceLabel,
  formatSlotUnitPrice,
  occurrenceIsBooked,
  parseDateTimeParam,
  resolveSelectedOccurrence,
  withDateTimeQuery,
} from "./checkout-slot";

const morning = {
  startsAtIso: "2030-09-01T08:00:00.000Z",
  creditPrice: 1,
  maxQty: 1,
};
const evening = {
  startsAtIso: "2030-09-01T17:00:00.000Z",
  creditPrice: 3,
  maxQty: 1,
};

describe("checkout-slot helpers", () => {
  test("withDateTimeQuery includes dateTime and omits qty", () => {
    const href = withDateTimeQuery("/en/events/abc/book", evening.startsAtIso);
    const parsed = new URL(href, "https://unveiled.local");
    expect(parsed.pathname).toBe("/en/events/abc/book");
    expect(parsed.searchParams.get("qty")).toBeNull();
    expect(parsed.searchParams.get("dateTime")).toBe(evening.startsAtIso);
  });

  test("withDateTimeQuery omits search when no datetime", () => {
    expect(withDateTimeQuery("/en/events/abc/book")).toBe("/en/events/abc/book");
  });

  test("resolveSelectedOccurrence defaults to soonest then honors ISO match", () => {
    expect(resolveSelectedOccurrence([morning, evening])?.startsAtIso).toBe(morning.startsAtIso);
    expect(resolveSelectedOccurrence([morning, evening], evening.startsAtIso)?.creditPrice).toBe(3);
  });

  test("parseDateTimeParam rejects invalid values", () => {
    expect(parseDateTimeParam(undefined)).toBeNull();
    expect(parseDateTimeParam("not-a-date")).toBeNull();
    expect(parseDateTimeParam(morning.startsAtIso)?.toISOString()).toBe(morning.startsAtIso);
  });

  test("formatOccurrenceLabel uses Europe/Berlin", () => {
    const label = formatOccurrenceLabel(evening.startsAtIso, "en");
    expect(label.length).toBeGreaterThan(0);
    expect(label).not.toContain("T17:00");
  });

  test("formatOccurrenceLabel omits clock time when includeTime is false", () => {
    const midnight = "2026-09-01T22:00:00.000Z";
    const withTime = formatOccurrenceLabel(midnight, "en");
    const dateOnly = formatOccurrenceLabel(midnight, "en", { includeTime: false });
    expect(withTime).toMatch(/\d/);
    expect(dateOnly).not.toMatch(/\d{1,2}:\d{2}/);
    expect(dateOnly).toContain("2026");
  });

  test("formatSlotUnitPrice is serializable copy", () => {
    expect(formatSlotUnitPrice(1, "de")).toBe("1 Credit pro Ticket");
    expect(formatSlotUnitPrice(4, "en")).toBe("4 credits per ticket");
  });

  test("occurrenceIsBooked matches exact ISO strings only", () => {
    expect(occurrenceIsBooked(morning.startsAtIso, [morning.startsAtIso])).toBe(true);
    expect(occurrenceIsBooked(evening.startsAtIso, [morning.startsAtIso])).toBe(false);
    expect(occurrenceIsBooked(undefined, [morning.startsAtIso])).toBe(false);
    expect(occurrenceIsBooked(morning.startsAtIso, [])).toBe(false);
  });

  test("firstFormString reads duplicate POST fields", () => {
    expect(firstFormString("2030-09-01T17:00:00.000Z")).toBe("2030-09-01T17:00:00.000Z");
    expect(firstFormString(["2030-09-01T17:00:00.000Z", "other"])).toBe("2030-09-01T17:00:00.000Z");
    expect(firstFormString(undefined)).toBeUndefined();
  });
});
