import { describe, expect, test } from "bun:test";

import { deriveDateTimeFields } from "./datetime";

describe("deriveDateTimeFields", () => {
  test("computes Berlin weekday and minutes for a timed event", () => {
    const dateTime = new Date("2026-01-15T18:30:00.000Z");
    const derived = deriveDateTimeFields(dateTime, "TIME_SLOT");

    expect(derived.weekday).toBeGreaterThanOrEqual(0);
    expect(derived.weekday).toBeLessThanOrEqual(6);
    expect(derived.startTimeMinutes).toBeGreaterThanOrEqual(0);
    expect(derived.startTimeMinutes).toBeLessThan(1440);
  });

  test("uses midnight for all-day events", () => {
    const dateTime = new Date("2026-06-01T12:00:00.000Z");
    const derived = deriveDateTimeFields(dateTime, "ALL_DAY");

    expect(derived.startTimeMinutes).toBe(0);
    expect(derived.weekday).toBeGreaterThanOrEqual(0);
    expect(derived.weekday).toBeLessThanOrEqual(6);
  });
});
