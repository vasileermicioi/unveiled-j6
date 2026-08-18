import { describe, expect, test } from "bun:test";
import type { OpeningHoursWeek } from "@unveiled/db";

import { formatPartnerOpeningHoursLines } from "./partner-opening-hours-display";

function fullWeek(overrides?: Partial<OpeningHoursWeek>): OpeningHoursWeek {
  const base: OpeningHoursWeek = {
    mon: { open: "10:00", close: "18:00" },
    tue: { closed: true },
    wed: { open: "12:00", close: "20:00" },
    thu: { closed: true },
    fri: { open: "10:00", close: "22:00" },
    sat: { open: "11:00", close: "16:00" },
    sun: { closed: true },
  };
  return { ...base, ...overrides };
}

function allClosedWeek(): OpeningHoursWeek {
  return {
    mon: { closed: true },
    tue: { closed: true },
    wed: { closed: true },
    thu: { closed: true },
    fri: { closed: true },
    sat: { closed: true },
    sun: { closed: true },
  };
}

describe("formatPartnerOpeningHoursLines", () => {
  test("returns null when hours disabled", () => {
    expect(formatPartnerOpeningHoursLines(false, fullWeek(), "en")).toBeNull();
  });

  test("returns null when hours null", () => {
    expect(formatPartnerOpeningHoursLines(true, null, "en")).toBeNull();
  });

  test("returns null for malformed week", () => {
    expect(
      formatPartnerOpeningHoursLines(
        true,
        { mon: { open: "10:00", close: "18:00" } } as OpeningHoursWeek,
        "en",
      ),
    ).toBeNull();
  });

  test("returns null when every weekday is closed", () => {
    expect(formatPartnerOpeningHoursLines(true, allClosedWeek(), "en")).toBeNull();
  });

  test("formats open days only with EN labels in Mon→Sun order", () => {
    const lines = formatPartnerOpeningHoursLines(true, fullWeek(), "en");
    expect(lines).not.toBeNull();
    expect(lines?.map((line) => line.dayKey)).toEqual(["mon", "wed", "fri", "sat"]);
    expect(lines?.[0]).toEqual({
      dayKey: "mon",
      dayLabel: "Monday",
      hoursLabel: "10:00 – 18:00",
    });
    expect(lines?.some((line) => line.hoursLabel === "Closed")).toBe(false);
  });

  test("formats open days only with DE labels", () => {
    const lines = formatPartnerOpeningHoursLines(true, fullWeek(), "de");
    expect(lines?.map((line) => line.dayKey)).toEqual(["mon", "wed", "fri", "sat"]);
    expect(lines?.[0]).toEqual({
      dayKey: "mon",
      dayLabel: "Montag",
      hoursLabel: "10:00 – 18:00",
    });
    expect(lines?.some((line) => line.hoursLabel === "Geschlossen")).toBe(false);
  });
});
