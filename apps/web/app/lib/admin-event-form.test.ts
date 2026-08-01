import { describe, expect, test } from "bun:test";

import { VARIANT_FILENAMES } from "@unveiled/images";

import {
  expandSeriesSlotsFromBuilder,
  parseBerlinDateTime,
  parseBuilderTimes,
  parseEventFormBody,
  parseIsoSlotDates,
  parsePromoCodesJson,
  parseSeriesSlots,
  parseVoucherPdfsJson,
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

function asFile(value: string | File | (string | File)[] | undefined): File | Blob | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    const first = value[0];
    return first instanceof File || first instanceof Blob ? first : undefined;
  }
  return value instanceof File || value instanceof Blob ? value : undefined;
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
        zip_code: "10115",
        country: "DE",
        city: "berlin",
        category: "Music",
        event_type: "Concert",
        tags: "jazz, live",
        event_date: "2026-08-01",
        event_time: "20:00",
        timing_mode: "TIME_SLOT",
        credit_price: "2",
        total_capacity: "15",
        ticket_type: "SECRET_CODE",
        secret_code: "JAZZ123",
      },
      asString,
      asFile,
    );

    expect(values.partnerId).toBe("partner-1");
    expect(values.title).toBe("Jazz Night");
    expect(values.zipCode).toBe("10115");
    expect(values.country).toBe("DE");
    expect(values.city).toBe("berlin");
    expect(values.tags).toEqual(["jazz", "live"]);
    expect(values.creditPrice).toBe(2);
    expect(values.totalCapacity).toBe(15);
    expect(values.secretCode).toBe("JAZZ123");
    expect(values.promoCodes).toEqual([]);
    expect(values.voucherPdfs).toEqual([]);
    expect(values.replaceUnusedInventory).toBe(false);
    expect(values.imageUpload).toBeNull();
    expect(values.imageUrl).toBeNull();
    expect(values.imagePrebuilt).toBeNull();
    expect(values.stagedImageId).toBeNull();
  });

  test("parseEventFormBody extracts promo and pdf inventory payloads", async () => {
    const values = await parseEventFormBody(
      {
        partner_id: "partner-1",
        title: "Promo Night",
        description: "Codes",
        address: "Main St 1",
        zip_code: "10115",
        category: "Music",
        event_type: "Concert",
        event_date: "2026-08-01",
        event_time: "20:00",
        ticket_type: "VOUCHER_PROMO",
        event_website_url: "https://example.com/event",
        promo_codes_json: JSON.stringify(["AAA", "BBB"]),
        voucher_pdfs_json: JSON.stringify([
          { objectKey: "vouchers/staging/u/1.pdf", pageLabel: "p.1" },
        ]),
        replace_unused_inventory: "on",
      },
      asString,
      asFile,
    );

    expect(values.ticketType).toBe("VOUCHER_PROMO");
    expect(values.promoCodes).toEqual(["AAA", "BBB"]);
    expect(values.voucherPdfs).toEqual([
      { objectKey: "vouchers/staging/u/1.pdf", originalFilename: null, pageLabel: "p.1" },
    ]);
    expect(values.replaceUnusedInventory).toBe(true);
  });

  test("parseEventFormBody treats bare imageId as stagedImageId", async () => {
    const values = await parseEventFormBody(
      {
        partner_id: "partner-1",
        title: "Jazz Night",
        description: "Live set",
        address: "Main St 1",
        zip_code: "10115",
        category: "Music",
        event_type: "Concert",
        event_date: "2026-08-01",
        event_time: "20:00",
        imageId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      },
      asString,
      asFile,
    );

    expect(values.imagePrebuilt).toBeNull();
    expect(values.stagedImageId).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
  });

  test("parseEventFormBody extracts image_url", async () => {
    const values = await parseEventFormBody(
      {
        partner_id: "partner-1",
        title: "Jazz Night",
        description: "Live set",
        address: "Main St 1",
        zip_code: "10115",
        category: "Music",
        event_type: "Concert",
        event_date: "2026-08-01",
        event_time: "20:00",
        image_url: "https://example.com/poster.jpg",
      },
      asString,
      asFile,
    );

    expect(values.imageUrl).toBe("https://example.com/poster.jpg");
    expect(values.imageUpload).toBeNull();
    expect(values.imagePrebuilt).toBeNull();
  });

  test("parseEventFormBody prefers complete prebuilt variants over raw image", async () => {
    const body: Record<string, string | File> = {
      partner_id: "partner-1",
      title: "Jazz Night",
      description: "Live set",
      address: "Main St 1",
      zip_code: "10115",
      category: "Music",
      event_type: "Concert",
      event_date: "2026-08-01",
      event_time: "20:00",
      imageId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      image: new File([new Uint8Array(8)], "source.png", { type: "image/png" }),
      image_url: "https://example.com/poster.jpg",
    };
    for (const filename of VARIANT_FILENAMES) {
      body[filename] = new File([new Uint8Array(12)], filename, { type: "image/webp" });
    }

    const values = await parseEventFormBody(body, asString, asFile);

    expect(values.imagePrebuilt?.imageId).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    expect(values.stagedImageId).toBeNull();
    expect(values.imageUpload).toBeNull();
    expect(values.imageUrl).toBe("https://example.com/poster.jpg");
  });

  test("parseEventFormBody falls back to legacy image when prebuilt incomplete", async () => {
    const values = await parseEventFormBody(
      {
        partner_id: "partner-1",
        title: "Jazz Night",
        description: "Live set",
        address: "Main St 1",
        zip_code: "10115",
        category: "Music",
        event_type: "Concert",
        event_date: "2026-08-01",
        event_time: "20:00",
        imageId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        "hero-1920.webp": new File([new Uint8Array(12)], "hero-1920.webp", {
          type: "image/webp",
        }),
        image: new File([new Uint8Array(8)], "source.png", { type: "image/png" }),
      },
      asString,
      asFile,
    );

    expect(values.imagePrebuilt).toBeNull();
    expect(values.imageUpload).not.toBeNull();
  });

  test("parseEventFormBody accepts multi-select arrays and derived lat/lng", async () => {
    const values = await parseEventFormBody(
      {
        partner_id: "partner-1",
        title: "Jazz Night",
        description: "Live set",
        address: "Main St 1",
        zip_code: "10115",
        category: "Music",
        event_type: "Concert",
        event_date: "2026-08-01",
        event_time: "20:00",
        timing_mode: "TIME_SLOT",
        credit_price: "2",
        total_capacity: "15",
        ticket_type: "SECRET_CODE",
        secret_code: "JAZZ123",
        languages: ["DE", "EN"],
        target_age_groups: ["18-25", "26-35"],
        lat: "52.520008",
        lng: "13.404954",
      },
      asString,
      asFile,
    );

    expect(values.languageIndependent).toBe(false);
    expect(values.languages).toEqual(["DE", "EN"]);
    expect(values.targetAgeGroups).toEqual(["18-25", "26-35"]);
    expect(values.lat).toBe("52.520008");
    expect(values.lng).toBe("13.404954");
  });

  test("parseEventFormBody treats empty lat/lng as null (geocode soft-fail)", async () => {
    const values = await parseEventFormBody(
      {
        partner_id: "partner-1",
        title: "Jazz Night",
        description: "Live set",
        address: "Main St 1",
        zip_code: "10115",
        category: "Music",
        event_type: "Concert",
        event_date: "2026-08-01",
        event_time: "20:00",
        timing_mode: "TIME_SLOT",
        credit_price: "2",
        total_capacity: "15",
        ticket_type: "SECRET_CODE",
        secret_code: "JAZZ123",
        lat: "",
        lng: "",
      },
      asString,
      asFile,
    );

    expect(values.lat).toBeNull();
    expect(values.lng).toBeNull();
  });

  test("parseEventFormBody clears languages when language-independent", async () => {
    const values = await parseEventFormBody(
      {
        partner_id: "partner-1",
        title: "Silent Walk",
        description: "No spoken language",
        address: "Main St 1",
        zip_code: "10115",
        category: "Art",
        event_type: "Exhibition",
        event_date: "2026-08-01",
        event_time: "20:00",
        timing_mode: "TIME_SLOT",
        credit_price: "1",
        total_capacity: "20",
        ticket_type: "SECRET_CODE",
        secret_code: "ART123",
        language_independent: "on",
        languages: ["DE", "EN"],
      },
      asString,
      asFile,
    );

    expect(values.languageIndependent).toBe(true);
    expect(values.languages).toBeNull();
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

  test("parsePromoCodesJson and parseVoucherPdfsJson ignore invalid payloads", () => {
    expect(parsePromoCodesJson(undefined)).toEqual([]);
    expect(parsePromoCodesJson('["A", " B ", 1]')).toEqual(["A", "B"]);
    expect(parseVoucherPdfsJson("not-json")).toEqual([]);
    expect(
      parseVoucherPdfsJson(JSON.stringify([{ objectKey: "vouchers/x.pdf", pageLabel: "p.1" }])),
    ).toEqual([{ objectKey: "vouchers/x.pdf", originalFilename: null, pageLabel: "p.1" }]);
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
