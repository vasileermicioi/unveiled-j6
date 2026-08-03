import { describe, expect, test } from "bun:test";

import {
  berlinInclusiveDateRange,
  berlinTodayRange,
  deriveDateTimeFields,
  getBerlinCalendarDate,
  primaryDateTimeFromList,
  sortUniqueDateTimes,
  tryNormalizeEventDateTimes,
} from "./datetime";

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

describe("multi-datetime normalize helpers", () => {
  const now = new Date("2026-07-09T12:00:00.000Z");

  test("sortUniqueDateTimes sorts and dedupes by epoch ms", () => {
    const a = new Date("2026-07-11T18:00:00.000Z");
    const b = new Date("2026-07-10T18:00:00.000Z");
    const dup = new Date(a.getTime());
    expect(sortUniqueDateTimes([a, b, dup]).map((d) => d.toISOString())).toEqual([
      "2026-07-10T18:00:00.000Z",
      "2026-07-11T18:00:00.000Z",
    ]);
  });

  test("primaryDateTimeFromList picks next upcoming", () => {
    const past = new Date("2026-07-08T18:00:00.000Z");
    const next = new Date("2026-07-10T18:00:00.000Z");
    const later = new Date("2026-07-12T18:00:00.000Z");
    expect(primaryDateTimeFromList([later, past, next], now).toISOString()).toBe(
      "2026-07-10T18:00:00.000Z",
    );
  });

  test("primaryDateTimeFromList falls back to earliest when all past", () => {
    const earlier = new Date("2026-07-01T18:00:00.000Z");
    const laterPast = new Date("2026-07-08T18:00:00.000Z");
    expect(primaryDateTimeFromList([laterPast, earlier], now).toISOString()).toBe(
      "2026-07-01T18:00:00.000Z",
    );
  });

  test("tryNormalizeEventDateTimes returns null for empty input", () => {
    expect(tryNormalizeEventDateTimes([], now)).toBeNull();
  });

  test("tryNormalizeEventDateTimes normalizes and derives primary", () => {
    const past = new Date("2026-07-08T18:00:00.000Z");
    const future = new Date("2026-07-11T18:00:00.000Z");
    const normalized = tryNormalizeEventDateTimes([future, past, future], now);
    expect(normalized?.dateTimes.map((d) => d.toISOString())).toEqual([
      "2026-07-08T18:00:00.000Z",
      "2026-07-11T18:00:00.000Z",
    ]);
    expect(normalized?.dateTime.toISOString()).toBe("2026-07-11T18:00:00.000Z");
  });
});

describe("berlin day ranges", () => {
  test("berlinTodayRange uses the Europe/Berlin calendar day of now", () => {
    // 2026-03-15 15:00 UTC = 16:00 CET
    const now = new Date("2026-03-15T15:00:00.000Z");
    const range = berlinTodayRange(now);

    expect(getBerlinCalendarDate(range.start)).toBe("2026-03-15");
    expect(getBerlinCalendarDate(new Date(range.end.getTime() - 1))).toBe("2026-03-15");
    expect(getBerlinCalendarDate(range.end)).toBe("2026-03-16");
    expect(range.start.getTime()).toBeLessThan(now.getTime());
    expect(range.end.getTime()).toBeGreaterThan(now.getTime());
  });

  test("berlinInclusiveDateRange is inclusive full days with exclusive end", () => {
    const range = berlinInclusiveDateRange("2026-07-10", "2026-07-12");

    expect(getBerlinCalendarDate(range.start)).toBe("2026-07-10");
    expect(getBerlinCalendarDate(new Date(range.end.getTime() - 1))).toBe("2026-07-12");
    expect(getBerlinCalendarDate(range.end)).toBe("2026-07-13");
  });

  test("berlinInclusiveDateRange accepts Date inputs via Berlin calendar date", () => {
    const from = new Date("2026-01-01T23:30:00.000Z"); // 2026-01-02 00:30 CET
    const to = new Date("2026-01-02T10:00:00.000Z");
    const range = berlinInclusiveDateRange(from, to);

    expect(getBerlinCalendarDate(range.start)).toBe("2026-01-02");
    expect(getBerlinCalendarDate(range.end)).toBe("2026-01-03");
  });

  test("berlinInclusiveDateRange swaps inverted bounds", () => {
    const range = berlinInclusiveDateRange("2026-08-05", "2026-08-03");

    expect(getBerlinCalendarDate(range.start)).toBe("2026-08-03");
    expect(getBerlinCalendarDate(range.end)).toBe("2026-08-06");
  });

  test("handles CET to CEST spring-forward day", () => {
    // 2026-03-29 is the EU DST spring-forward Sunday
    const range = berlinInclusiveDateRange("2026-03-29", "2026-03-29");

    expect(getBerlinCalendarDate(range.start)).toBe("2026-03-29");
    expect(getBerlinCalendarDate(range.end)).toBe("2026-03-30");
    // Day is 23 hours in Berlin; exclusive end must still be next midnight
    expect(range.end.getTime() - range.start.getTime()).toBe(23 * 3_600_000);
  });
});
