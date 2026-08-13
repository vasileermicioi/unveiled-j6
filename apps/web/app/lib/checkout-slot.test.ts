import { describe, expect, test } from "bun:test";

import {
  clampQty,
  firstFormString,
  formatOccurrenceLabel,
  formatSlotUnitPrice,
  parseDateTimeParam,
  resolveSelectedOccurrence,
  withQtyAndDateTimeQuery,
} from "./checkout-slot";

const morning = {
  startsAtIso: "2030-09-01T08:00:00.000Z",
  creditPrice: 1,
  maxQty: 6,
};
const evening = {
  startsAtIso: "2030-09-01T17:00:00.000Z",
  creditPrice: 3,
  maxQty: 2,
};

describe("checkout-slot helpers", () => {
  test("withQtyAndDateTimeQuery includes qty and dateTime", () => {
    const href = withQtyAndDateTimeQuery("/en/events/abc/book", 2, evening.startsAtIso);
    const parsed = new URL(href, "https://unveiled.local");
    expect(parsed.pathname).toBe("/en/events/abc/book");
    expect(parsed.searchParams.get("qty")).toBe("2");
    expect(parsed.searchParams.get("dateTime")).toBe(evening.startsAtIso);
  });

  test("clampQty drops when switching from price 1 max 6 to price 3 max 2", () => {
    expect(clampQty(5, evening.maxQty)).toBe(2);
    expect(clampQty(1, evening.maxQty)).toBe(1);
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

  test("formatSlotUnitPrice is serializable copy", () => {
    expect(formatSlotUnitPrice(1, "de")).toBe("1 Credit pro Ticket");
    expect(formatSlotUnitPrice(4, "en")).toBe("4 credits per ticket");
  });

  test("firstFormString reads duplicate POST fields", () => {
    expect(firstFormString("2030-09-01T17:00:00.000Z")).toBe("2030-09-01T17:00:00.000Z");
    expect(firstFormString(["2030-09-01T17:00:00.000Z", "other"])).toBe("2030-09-01T17:00:00.000Z");
    expect(firstFormString(undefined)).toBeUndefined();
  });
});
