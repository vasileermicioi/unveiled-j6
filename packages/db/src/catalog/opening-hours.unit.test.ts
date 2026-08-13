import { describe, expect, test } from "bun:test";

import {
  assertOpeningHoursForWrite,
  berlinYmdToOpeningHoursDayKey,
  distinctOpenTimes,
  isClosedOnBerlinYmd,
  OPENING_HOURS_DAY_KEYS,
  type OpeningHoursWeek,
  parseOpeningHours,
} from "./opening-hours";

function fullWeek(overrides?: Partial<OpeningHoursWeek>): OpeningHoursWeek {
  const base: OpeningHoursWeek = {
    mon: { open: "10:00", close: "18:00" },
    tue: { open: "10:00", close: "18:00" },
    wed: { open: "10:00", close: "18:00" },
    thu: { open: "10:00", close: "18:00" },
    fri: { open: "10:00", close: "22:00" },
    sat: { closed: true },
    sun: { closed: true },
  };
  return { ...base, ...overrides };
}

describe("parseOpeningHours", () => {
  test("accepts a full week with open and closed days", () => {
    const week = fullWeek();
    expect(parseOpeningHours(week)).toEqual(week);
  });

  test("rejects missing day key", () => {
    const { sun: _sun, ...partial } = fullWeek();
    expect(() => parseOpeningHours(partial)).toThrow(/missing day key: sun/);
  });

  test("rejects unknown day key", () => {
    expect(() => parseOpeningHours({ ...fullWeek(), holiday: { closed: true } })).toThrow(
      /unknown day key/,
    );
  });

  test("rejects inverted or equal open/close", () => {
    expect(() => parseOpeningHours(fullWeek({ mon: { open: "18:00", close: "10:00" } }))).toThrow(
      /strictly before close/,
    );
    expect(() => parseOpeningHours(fullWeek({ tue: { open: "12:00", close: "12:00" } }))).toThrow(
      /strictly before close/,
    );
  });

  test("rejects bad HH:MM format", () => {
    expect(() => parseOpeningHours(fullWeek({ wed: { open: "9:00", close: "18:00" } }))).toThrow(
      /HH:MM/,
    );
    expect(() => parseOpeningHours(fullWeek({ thu: { open: "10:0", close: "18:00" } }))).toThrow(
      /HH:MM/,
    );
    expect(() => parseOpeningHours(fullWeek({ fri: { open: "25:00", close: "26:00" } }))).toThrow(
      /HH:MM/,
    );
  });

  test("rejects closed day that also has open/close", () => {
    expect(() =>
      parseOpeningHours(
        fullWeek({
          sat: { closed: true, open: "10:00", close: "12:00" } as OpeningHoursWeek["sat"],
        }),
      ),
    ).toThrow(/must not include open\/close/);
  });

  test("covers all seven day keys in the constant", () => {
    expect(OPENING_HOURS_DAY_KEYS).toEqual(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
  });
});

describe("assertOpeningHoursForWrite", () => {
  test("clears hours when disabled even if a schedule is provided", () => {
    expect(assertOpeningHoursForWrite(false, fullWeek())).toBeNull();
    expect(assertOpeningHoursForWrite(false, null)).toBeNull();
  });

  test("requires a full week when enabled", () => {
    expect(assertOpeningHoursForWrite(true, fullWeek())).toEqual(fullWeek());
    expect(() => assertOpeningHoursForWrite(true, null)).toThrow(/required when/);
    expect(() => assertOpeningHoursForWrite(true, undefined)).toThrow(/required when/);
  });
});

describe("distinctOpenTimes", () => {
  test("returns sorted unique open times from non-closed days", () => {
    const week = fullWeek({
      sat: { open: "12:00", close: "16:00" },
    });
    expect(distinctOpenTimes(week)).toEqual(["10:00", "12:00"]);
  });
});

describe("isClosedOnBerlinYmd", () => {
  test("maps 2026-09-06 as Sunday and skips it when closed", () => {
    expect(berlinYmdToOpeningHoursDayKey("2026-09-06")).toBe("sun");
    expect(isClosedOnBerlinYmd(fullWeek(), "2026-09-06")).toBe(true);
  });

  test("does not skip an open weekday", () => {
    expect(berlinYmdToOpeningHoursDayKey("2026-09-07")).toBe("mon");
    expect(isClosedOnBerlinYmd(fullWeek(), "2026-09-07")).toBe(false);
  });
});
