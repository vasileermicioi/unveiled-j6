import { describe, expect, test } from "bun:test";

import {
  expandSeriesSlotsFromBuilder,
  parseBerlinDateTime,
  parseBuilderTimes,
  parseEventFormBody,
  parseIsoSlotDates,
  parseSeriesSlots,
} from "./admin-event-form";

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

async function asFile(_value: string | File | (string | File)[] | undefined): Promise<undefined> {
  return undefined;
}

describe("admin-event-form helpers", () => {
  test("parseBerlinDateTime converts Berlin local time to UTC", () => {
    const date = parseBerlinDateTime("2026-07-15", "19:30", "TIME_SLOT");
    expect(formatBerlin(date)).toMatch(/15\.07\.26/);
    expect(formatBerlinTime(date)).toBe("19:30");
  });

  test("parseBerlinDateTime uses midnight for ALL_DAY", () => {
    const date = parseBerlinDateTime("2026-07-15", null, "ALL_DAY");
    expect(formatBerlinTime(date)).toBe("00:00");
  });

  test("parseEventFormBody extracts event fields", async () => {
    const values = await parseEventFormBody(
      {
        partner_id: "partner-1",
        title: "Jazz Night",
        description: "Live set",
        address: "Main St 1",
        neighborhood: "Mitte",
        category: "Music",
        event_type: "Concert",
        tags: "jazz, live",
        event_date: "2026-08-01",
        event_time: "20:00",
        timing_mode: "TIME_SLOT",
        credit_price: "2",
        total_capacity: "15",
        ticket_type: "SECRET_CODE",
        secret_code_mode: "MANUAL",
        secret_code: "JAZZ123",
      },
      asString,
      asFile,
    );

    expect(values.partnerId).toBe("partner-1");
    expect(values.title).toBe("Jazz Night");
    expect(values.tags).toEqual(["jazz", "live"]);
    expect(values.creditPrice).toBe(2);
    expect(values.totalCapacity).toBe(15);
    expect(values.secretCode).toBe("JAZZ123");
    expect(values.imageUpload).toBeNull();
  });

  test("parseEventFormBody accepts multi-select arrays and map zoom", async () => {
    const values = await parseEventFormBody(
      {
        partner_id: "partner-1",
        title: "Jazz Night",
        description: "Live set",
        address: "Main St 1",
        neighborhood: "Mitte",
        category: "Music",
        event_type: "Concert",
        event_date: "2026-08-01",
        event_time: "20:00",
        timing_mode: "TIME_SLOT",
        credit_price: "2",
        total_capacity: "15",
        ticket_type: "SECRET_CODE",
        secret_code_mode: "MANUAL",
        secret_code: "JAZZ123",
        languages: ["DE", "EN"],
        target_age_groups: ["18-25", "26-35"],
        lat: "52.520008",
        lng: "13.404954",
        map_zoom: "14",
      },
      asString,
      asFile,
    );

    expect(values.languages).toEqual(["DE", "EN"]);
    expect(values.targetAgeGroups).toEqual(["18-25", "26-35"]);
    expect(values.lat).toBe("52.520008");
    expect(values.lng).toBe("13.404954");
    expect(values.mapZoom).toBe(14);
  });

  test("parseSeriesSlots expands builder weekdays", () => {
    const slots = parseSeriesSlots(
      {
        slot_mode: "builder",
        builder_start: "2026-07-06",
        builder_end: "2026-07-12",
        builder_weekdays: ["1", "3"],
        builder_time_0: "19:30",
        timing_mode: "TIME_SLOT",
      },
      asString,
    );

    expect(slots.length).toBe(2);
  });

  test("parseBuilderTimes prefers builder_time fields over legacy comma input", () => {
    expect(
      parseBuilderTimes(
        {
          builder_time_0: "19:30",
          builder_time_1: "21:00",
          builder_times: "18:00",
        },
        asString,
      ),
    ).toEqual(["19:30", "21:00"]);
  });

  test("parseIsoSlotDates parses ISO strings", () => {
    const slots = parseIsoSlotDates(["2026-07-06T17:30:00.000Z", "2026-07-08T17:30:00.000Z"]);
    expect(slots).toHaveLength(2);
  });

  test("expandSeriesSlotsFromBuilder respects excluded dates", () => {
    const slots = expandSeriesSlotsFromBuilder({
      startDate: "2026-07-06",
      endDate: "2026-07-08",
      weekdays: [1],
      times: ["19:30"],
      excludedDates: ["2026-07-06"],
      timingMode: "TIME_SLOT",
    });

    expect(slots).toHaveLength(0);
  });
});

function formatBerlin(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    dateStyle: "short",
  }).format(date);
}

function formatBerlinTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${pick("hour")}:${pick("minute")}`;
}
