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

  test("formats Mon→Sun with EN labels", () => {
    const lines = formatPartnerOpeningHoursLines(true, fullWeek(), "en");
    expect(lines).not.toBeNull();
    expect(lines?.map((line) => line.dayKey)).toEqual([
      "mon",
      "tue",
      "wed",
      "thu",
      "fri",
      "sat",
      "sun",
    ]);
    expect(lines?.[0]).toEqual({
      dayKey: "mon",
      dayLabel: "Monday",
      hoursLabel: "10:00 – 18:00",
    });
    expect(lines?.[1]).toEqual({
      dayKey: "tue",
      dayLabel: "Tuesday",
      hoursLabel: "Closed",
    });
  });

  test("formats closed label in DE", () => {
    const lines = formatPartnerOpeningHoursLines(true, fullWeek(), "de");
    expect(lines?.[1]?.hoursLabel).toBe("Geschlossen");
    expect(lines?.[0]?.dayLabel).toBe("Montag");
  });
});
