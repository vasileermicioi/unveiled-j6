import { describe, expect, test } from "bun:test";

import {
  berlinInclusiveDateRange,
  berlinTodayRange,
  creditPriceForOccurrence,
  deriveDateTimeFields,
  fillOccurrenceCapacities,
  futureOccurrences,
  getBerlinCalendarDate,
  isOccurrenceUpcoming,
  occurrenceHorizon,
  primaryDateTimeFromList,
  sortUniqueDateTimes,
  tryFillOccurrenceCreditsFromPrice,
  tryNormalizeEventDateTimes,
  tryNormalizeEventOccurrences,
  tryNormalizePairedDateTimesAndCapacities,
  tryNormalizePairedDateTimesAndCredits,
  tryNormalizePairedDateTimesCreditsAndCapacities,
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

describe("occurrence credit normalize helpers", () => {
  const now = new Date("2026-07-09T12:00:00.000Z");
  const past = new Date("2026-07-08T18:00:00.000Z");
  const future = new Date("2026-07-11T18:00:00.000Z");

  test("tryNormalizeEventOccurrences sorts and keeps paired credits", () => {
    const result = tryNormalizeEventOccurrences(
      [
        { startsAt: future, creditPrice: 3 },
        { startsAt: past, creditPrice: 1 },
      ],
      now,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.dateTimes.map((d) => d.toISOString())).toEqual([
      past.toISOString(),
      future.toISOString(),
    ]);
    expect(result.value.occurrenceCreditPrices).toEqual([1, 3]);
    expect(result.value.dateTime.toISOString()).toBe(future.toISOString());
    expect(result.value.creditPrice).toBe(3);
  });

  test("primary credit follows next upcoming (past=1, future=3)", () => {
    const result = tryNormalizeEventOccurrences(
      [
        { startsAt: past, creditPrice: 1 },
        { startsAt: future, creditPrice: 3 },
      ],
      now,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.dateTime.toISOString()).toBe(future.toISOString());
    expect(result.value.creditPrice).toBe(3);
  });

  test("tryNormalizeEventOccurrences rejects duplicate instants", () => {
    const result = tryNormalizeEventOccurrences(
      [
        { startsAt: future, creditPrice: 1 },
        { startsAt: new Date(future.getTime()), creditPrice: 2 },
      ],
      now,
    );
    expect(result).toEqual({ ok: false, code: "DUPLICATE_INSTANT" });
  });

  test("tryNormalizePairedDateTimesAndCredits rejects length mismatch", () => {
    const result = tryNormalizePairedDateTimesAndCredits([past, future], [1], now);
    expect(result).toEqual({ ok: false, code: "LENGTH_MISMATCH" });
  });

  test("tryNormalizeEventOccurrences rejects negative credits", () => {
    const result = tryNormalizeEventOccurrences([{ startsAt: future, creditPrice: -1 }], now);
    expect(result).toEqual({ ok: false, code: "NEGATIVE_CREDIT" });
  });

  test("tryFillOccurrenceCreditsFromPrice unique-merges duplicates and fills", () => {
    const result = tryFillOccurrenceCreditsFromPrice([future, past, future], 2, now);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.dateTimes.map((d) => d.toISOString())).toEqual([
      past.toISOString(),
      future.toISOString(),
    ]);
    expect(result.value.occurrenceCreditPrices).toEqual([2, 2]);
    expect(result.value.creditPrice).toBe(2);
  });

  test("tryFillOccurrenceCreditsFromPrice rejects empty dateTimes", () => {
    expect(tryFillOccurrenceCreditsFromPrice([], 1, now)).toEqual({
      ok: false,
      code: "EMPTY",
    });
  });
});

describe("occurrence capacity normalize helpers", () => {
  const now = new Date("2026-07-09T12:00:00.000Z");
  const past = new Date("2026-07-08T18:00:00.000Z");
  const future = new Date("2026-07-11T18:00:00.000Z");

  test("tryNormalizeEventOccurrences sorts and keeps paired capacities", () => {
    const result = tryNormalizeEventOccurrences(
      [
        { startsAt: future, creditPrice: 3, capacity: 6 },
        { startsAt: past, creditPrice: 1, capacity: 4 },
      ],
      now,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.dateTimes.map((d) => d.toISOString())).toEqual([
      past.toISOString(),
      future.toISOString(),
    ]);
    expect(result.value.occurrenceCapacities).toEqual([4, 6]);
  });

  test("tryNormalizeEventOccurrences rejects negative capacities", () => {
    const result = tryNormalizeEventOccurrences(
      [{ startsAt: future, creditPrice: 1, capacity: -1 }],
      now,
    );
    expect(result).toEqual({ ok: false, code: "NEGATIVE_CAPACITY" });
  });

  test("tryNormalizeEventOccurrences rejects mixed capacity presence", () => {
    const result = tryNormalizeEventOccurrences(
      [
        { startsAt: past, creditPrice: 1, capacity: 4 },
        { startsAt: future, creditPrice: 1 },
      ],
      now,
    );
    expect(result).toEqual({ ok: false, code: "CAPACITY_LENGTH_MISMATCH" });
  });

  test("tryNormalizePairedDateTimesCreditsAndCapacities rejects capacity length mismatch", () => {
    const result = tryNormalizePairedDateTimesCreditsAndCapacities(
      [past, future],
      [1, 1],
      [4],
      now,
    );
    expect(result).toEqual({ ok: false, code: "CAPACITY_LENGTH_MISMATCH" });
  });

  test("tryNormalizePairedDateTimesAndCapacities pairs capacities without unique-merge", () => {
    const result = tryNormalizePairedDateTimesAndCapacities([future, past], 2, [6, 4], now);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.occurrenceCreditPrices).toEqual([2, 2]);
    expect(result.value.occurrenceCapacities).toEqual([4, 6]);
  });

  test("legacy credit fill omits occurrenceCapacities for SHARED fill", () => {
    const result = tryFillOccurrenceCreditsFromPrice([past, future], 2, now);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.occurrenceCapacities).toBeUndefined();
  });

  test("fillOccurrenceCapacities repeats totalCapacity for every datetime", () => {
    expect(fillOccurrenceCapacities([past, future], 12)).toEqual([12, 12]);
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

describe("occurrence credit lookup", () => {
  const morning = new Date("2026-09-01T08:00:00.000Z");
  const evening = new Date("2026-09-01T17:00:00.000Z");
  const dateTimes = [morning, evening];
  const credits = [1, 3];

  test("creditPriceForOccurrence matches cheaper morning vs expensive evening", () => {
    expect(creditPriceForOccurrence(dateTimes, credits, morning)).toBe(1);
    expect(creditPriceForOccurrence(dateTimes, credits, evening)).toBe(3);
    expect(creditPriceForOccurrence(dateTimes, credits, new Date(evening.getTime()))).toBe(3);
  });

  test("creditPriceForOccurrence returns null for unknown instant", () => {
    expect(
      creditPriceForOccurrence(dateTimes, credits, new Date("2026-09-01T12:00:00.000Z")),
    ).toBeNull();
  });

  test("futureOccurrences excludes past instants and sorts ascending", () => {
    const past = new Date("2026-08-01T18:00:00.000Z");
    const soon = new Date("2026-09-10T08:00:00.000Z");
    const later = new Date("2026-09-10T17:00:00.000Z");
    const now = new Date("2026-09-05T12:00:00.000Z");
    const result = futureOccurrences([later, past, soon], [4, 1, 2], now);
    expect(result.map((row) => row.startsAt.toISOString())).toEqual([
      soon.toISOString(),
      later.toISOString(),
    ]);
    expect(result.map((row) => row.creditPrice)).toEqual([2, 4]);
  });

  test("all-day occurrences stay upcoming through the Berlin calendar day", () => {
    const now = new Date("2026-07-09T14:00:00.000Z");
    const todayStart = berlinTodayRange(now).start;
    const yesterday = berlinInclusiveDateRange("2026-07-08", "2026-07-08").start;

    expect(occurrenceHorizon(now, "ALL_DAY").getTime()).toBe(todayStart.getTime());
    expect(isOccurrenceUpcoming(todayStart, now, "ALL_DAY")).toBe(true);
    expect(isOccurrenceUpcoming(yesterday, now, "ALL_DAY")).toBe(false);
    expect(isOccurrenceUpcoming(todayStart, now, "TIME_SLOT")).toBe(false);

    const upcoming = futureOccurrences([yesterday, todayStart], [1, 2], now, "ALL_DAY");
    expect(upcoming.map((row) => row.startsAt.toISOString())).toEqual([todayStart.toISOString()]);
    expect(primaryDateTimeFromList([yesterday, todayStart], now, "ALL_DAY").toISOString()).toBe(
      todayStart.toISOString(),
    );
  });
});
