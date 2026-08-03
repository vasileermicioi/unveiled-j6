import { describe, expect, test } from "bun:test";

import { OPENING_HOURS_DAY_KEYS, type OpeningHoursWeek } from "@unveiled/db";

import {
  emptyOpeningHoursDaysForm,
  normalizeTimeInput,
  openingHoursFormToWriteInput,
  openingHoursWeekToFormDays,
  parseOpeningHoursFormFromBody,
} from "./partner-opening-hours-form";

function asString(value: string | File | (string | File)[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

function fullOpenWeek(): OpeningHoursWeek {
  const week = {} as OpeningHoursWeek;
  for (const day of OPENING_HOURS_DAY_KEYS) {
    week[day] = { open: "10:00", close: "18:00" };
  }
  return week;
}

describe("normalizeTimeInput", () => {
  test("zero-pads single-digit hours", () => {
    expect(normalizeTimeInput("9:30")).toBe("09:30");
  });

  test("strips seconds from browser time values", () => {
    expect(normalizeTimeInput("09:30:00")).toBe("09:30");
  });

  test("leaves already-normalized HH:MM unchanged", () => {
    expect(normalizeTimeInput("18:00")).toBe("18:00");
  });
});

describe("parseOpeningHoursFormFromBody", () => {
  test("treats missing toggle as disabled and ignores day fields", () => {
    const parsed = parseOpeningHoursFormFromBody(
      {
        open_mon: "10:00",
        close_mon: "18:00",
      },
      asString,
    );
    expect(parsed.hasOpeningHours).toBe(false);

    const write = openingHoursFormToWriteInput(parsed.hasOpeningHours, parsed.openingHoursDays);
    expect(write).toEqual({ hasOpeningHours: false, openingHours: null });
  });

  test("treats missing closed checkbox as not closed", () => {
    const parsed = parseOpeningHoursFormFromBody(
      {
        has_opening_hours: "on",
        open_mon: "10:00",
        close_mon: "18:00",
        closed_tue: "on",
      },
      asString,
    );
    expect(parsed.hasOpeningHours).toBe(true);
    expect(parsed.openingHoursDays.mon.closed).toBe(false);
    expect(parsed.openingHoursDays.tue.closed).toBe(true);
  });

  test("assembles full week with closed and open days", () => {
    const body: Record<string, string> = { has_opening_hours: "on" };
    for (const day of OPENING_HOURS_DAY_KEYS) {
      if (day === "sun") {
        body[`closed_${day}`] = "on";
      } else {
        body[`open_${day}`] = "10:00";
        body[`close_${day}`] = "18:00";
      }
    }

    const parsed = parseOpeningHoursFormFromBody(body, asString);
    const write = openingHoursFormToWriteInput(parsed.hasOpeningHours, parsed.openingHoursDays);

    expect(write.hasOpeningHours).toBe(true);
    expect(write.openingHours?.sun).toEqual({ closed: true });
    expect(write.openingHours?.mon).toEqual({ open: "10:00", close: "18:00" });
  });

  test("normalizes open/close times when assembling write input", () => {
    const days = emptyOpeningHoursDaysForm(false);
    for (const day of OPENING_HOURS_DAY_KEYS) {
      days[day] = { closed: false, open: "9:05", close: "17:30:00" };
    }
    const write = openingHoursFormToWriteInput(true, days);
    expect(write.openingHours?.mon).toEqual({ open: "09:05", close: "17:30" });
  });
});

describe("openingHoursWeekToFormDays", () => {
  test("maps stored week into form day rows", () => {
    const week = fullOpenWeek();
    week.sat = { closed: true };
    const days = openingHoursWeekToFormDays(week);
    expect(days.mon).toEqual({ closed: false, open: "10:00", close: "18:00" });
    expect(days.sat).toEqual({ closed: true, open: "", close: "" });
  });

  test("defaults all days closed when week is null", () => {
    const days = openingHoursWeekToFormDays(null);
    for (const day of OPENING_HOURS_DAY_KEYS) {
      expect(days[day]).toEqual({ closed: true, open: "", close: "" });
    }
  });
});
