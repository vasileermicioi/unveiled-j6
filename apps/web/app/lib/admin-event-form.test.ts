import { describe, expect, test } from "bun:test";

import { CatalogValidationError, type OpeningHoursWeek, PostalValidationError } from "@unveiled/db";
import { VARIANT_FILENAMES } from "@unveiled/images";
import { ImageValidationError } from "@unveiled/images/errors";

import {
  defaultRangeSlotsFromHours,
  eventFormErrorStep,
  eventFormValuesToDateTimes,
  eventFormValuesToOccurrences,
  expandOccurrencesFromRange,
  expandSeriesSlotsFromBuilder,
  formatEventDateInput,
  occurrencesToFormRows,
  parseBerlinDateTime,
  parseBuilderTimes,
  parseEventFormBody,
  parseIsoSlotDates,
  parsePromoCodesJson,
  parseRangeBuilder,
  parseSeriesSlots,
  parseVoucherPdfsJson,
} from "./admin-event-form";
import { toCreateEventInput, toUpdateEventInput } from "./admin-event-input";

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
        street: "Main St",
        house_number: "1",
        address_line2: "",
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
    expect(values.dateTimeRows).toEqual([{ date: "2026-08-01", time: "20:00", credits: "2" }]);
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
    expect(values.imageCredit).toBe("");
  });

  test("parseEventFormBody extracts image_credit and omits to empty string", async () => {
    const credited = await parseEventFormBody(
      {
        partner_id: "partner-1",
        title: "Jazz Night",
        description: "Live set",
        street: "Main St",
        house_number: "1",
        zip_code: "10115",
        category: "Music",
        event_type: "Concert",
        event_date: "2026-08-01",
        event_time: "20:00",
        timing_mode: "TIME_SLOT",
        credit_price: "2",
        total_capacity: "15",
        ticket_type: "SECRET_CODE",
        secret_code: "ABC",
        image_credit: "  Photo: Ada  ",
      },
      asString,
      asFile,
    );
    expect(credited.imageCredit).toBe("Photo: Ada");
    expect(toCreateEventInput(credited, "admin-1").imageCredit).toBe("Photo: Ada");

    const omitted = await parseEventFormBody(
      {
        partner_id: "partner-1",
        title: "Jazz Night",
        description: "Live set",
        street: "Main St",
        house_number: "1",
        zip_code: "10115",
        category: "Music",
        event_type: "Concert",
        event_date: "2026-08-01",
        event_time: "20:00",
        timing_mode: "TIME_SLOT",
        credit_price: "2",
        total_capacity: "15",
        ticket_type: "SECRET_CODE",
      },
      asString,
      asFile,
    );
    expect(omitted.imageCredit).toBe("");
  });

  test("parseEventFormBody extracts indexed datetime rows and ignores blank trailing rows", async () => {
    const values = await parseEventFormBody(
      {
        partner_id: "partner-1",
        title: "Jazz Night",
        description: "Live set",
        street: "Main St",
        house_number: "1",
        zip_code: "10115",
        category: "Music",
        event_type: "Concert",
        datetime_count: "3",
        event_date_0: "2026-08-01",
        event_time_0: "20:00",
        event_credit_0: "1",
        event_date_1: "2026-08-08",
        event_time_1: "21:00",
        event_credit_1: "3",
        event_date_2: "",
        event_time_2: "",
        event_credit_2: "",
        timing_mode: "TIME_SLOT",
        total_capacity: "15",
        ticket_type: "SECRET_CODE",
      },
      asString,
      asFile,
    );

    expect(values.dateTimeRows).toEqual([
      { date: "2026-08-01", time: "20:00", credits: "1" },
      { date: "2026-08-08", time: "21:00", credits: "3" },
      { date: "", time: "", credits: "" },
    ]);
    expect(values.creditPrice).toBe(1);

    const dateTimes = eventFormValuesToDateTimes(values);
    expect(dateTimes).toHaveLength(2);
    const [first, second] = dateTimes;
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    if (!first || !second) {
      throw new Error("expected two dateTimes");
    }
    expect(formatBerlin(first)).toMatch(/01\.08\.26/);
    expect(formatBerlinTime(first)).toBe("20:00");
    expect(formatBerlin(second)).toMatch(/08\.08\.26/);
    expect(formatBerlinTime(second)).toBe("21:00");

    const occurrences = eventFormValuesToOccurrences(values);
    expect(occurrences).toHaveLength(2);
    expect(occurrences[0]?.creditPrice).toBe(1);
    expect(occurrences[1]?.creditPrice).toBe(3);
  });

  test("eventFormValuesToDateTimes rejects empty datetime list", () => {
    expect(() =>
      eventFormValuesToDateTimes({
        partnerId: "partner-1",
        title: "Jazz Night",
        description: "Live set",
        street: "Main St",
        houseNumber: "1",
        addressLine2: null,
        zipCode: "10115",
        category: "Music",
        eventType: "Concert",
        tags: [],
        dateTimeRows: [
          { date: "", time: "", credits: "1" },
          { date: "  ", time: "20:00", credits: "2" },
        ],
        timingMode: "TIME_SLOT",
        creditPrice: 2,
        totalCapacity: 15,
        ticketType: "SECRET_CODE",
        secretCode: null,
        eventWebsiteUrl: null,
        promoCodes: [],
        voucherPdfs: [],
        replaceUnusedInventory: false,
        languageIndependent: false,
        languages: null,
        hasSubtitles: false,
        subtitleLanguage: null,
        lat: null,
        lng: null,
        imageUpload: null,
        imageUrl: null,
        imagePrebuilt: null,
        stagedImageId: null,
        imageCredit: "",
      }),
    ).toThrow(CatalogValidationError);
  });

  test("eventFormValuesToOccurrences rejects blank credits on a complete date row", () => {
    expect(() =>
      eventFormValuesToOccurrences({
        partnerId: "partner-1",
        title: "Jazz Night",
        description: "Live set",
        street: "Main St",
        houseNumber: "1",
        addressLine2: null,
        zipCode: "10115",
        category: "Music",
        eventType: "Concert",
        tags: [],
        dateTimeRows: [{ date: "2026-08-01", time: "20:00", credits: "" }],
        timingMode: "TIME_SLOT",
        creditPrice: 1,
        totalCapacity: 15,
        ticketType: "SECRET_CODE",
        secretCode: null,
        eventWebsiteUrl: null,
        promoCodes: [],
        voucherPdfs: [],
        replaceUnusedInventory: false,
        languageIndependent: false,
        languages: null,
        hasSubtitles: false,
        subtitleLanguage: null,
        lat: null,
        lng: null,
        imageUpload: null,
        imageUrl: null,
        imagePrebuilt: null,
        stagedImageId: null,
        imageCredit: "",
      }),
    ).toThrow(CatalogValidationError);
  });

  test("toCreateEventInput and toUpdateEventInput pass paired occurrence credits", () => {
    const values = {
      partnerId: "partner-1",
      title: "Jazz Night",
      description: "Live set",
      street: "Main St",
      houseNumber: "1",
      addressLine2: null,
      zipCode: "10115",
      category: "Music",
      eventType: "Concert",
      tags: [],
      dateTimeRows: [
        { date: "2026-08-01", time: "20:00", credits: "1" },
        { date: "2026-08-08", time: "21:00", credits: "3" },
      ],
      timingMode: "TIME_SLOT" as const,
      creditPrice: 1,
      totalCapacity: 15,
      ticketType: "SECRET_CODE" as const,
      secretCode: null,
      eventWebsiteUrl: null,
      promoCodes: [],
      voucherPdfs: [],
      replaceUnusedInventory: false,
      languageIndependent: false,
      languages: null,
      hasSubtitles: false,
      subtitleLanguage: null,
      lat: null,
      lng: null,
      imageUpload: null,
      imageUrl: null,
      imagePrebuilt: null,
      stagedImageId: null,
      imageCredit: "",
    };

    const created = toCreateEventInput(values, "admin-1");
    expect(created.occurrenceCreditPrices).toEqual([1, 3]);
    expect(created.dateTimes).toHaveLength(2);
    expect(created.creditPrice).toBe(1);

    const updated = toUpdateEventInput(values, "admin-1");
    expect(updated.occurrenceCreditPrices).toEqual([1, 3]);
    expect(updated.dateTimes).toHaveLength(2);
  });

  test("parseEventFormBody extracts promo and pdf inventory payloads", async () => {
    const values = await parseEventFormBody(
      {
        partner_id: "partner-1",
        title: "Promo Night",
        description: "Codes",
        street: "Main St",
        house_number: "1",
        address_line2: "",
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
        street: "Main St",
        house_number: "1",
        address_line2: "",
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
        street: "Main St",
        house_number: "1",
        address_line2: "",
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
      street: "Main St",
      house_number: "1",
      address_line2: "",
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
        street: "Main St",
        house_number: "1",
        address_line2: "",
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
        street: "Main St",
        house_number: "1",
        address_line2: "",
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
        lat: "52.520008",
        lng: "13.404954",
      },
      asString,
      asFile,
    );

    expect(values.languageIndependent).toBe(false);
    expect(values.languages).toEqual(["DE", "EN"]);
    expect(values.lat).toBe("52.520008");
    expect(values.lng).toBe("13.404954");
  });

  test("parseEventFormBody ignores legacy target_age_groups POST field", async () => {
    const values = await parseEventFormBody(
      {
        partner_id: "partner-1",
        title: "Jazz Night",
        description: "Live set",
        street: "Main St",
        house_number: "1",
        address_line2: "",
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

    expect(values.languages).toEqual(["DE", "EN"]);
    expect("targetAgeGroups" in values).toBe(false);
  });

  test("parseEventFormBody treats empty lat/lng as null (geocode soft-fail)", async () => {
    const values = await parseEventFormBody(
      {
        partner_id: "partner-1",
        title: "Jazz Night",
        description: "Live set",
        street: "Main St",
        house_number: "1",
        address_line2: "",
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
        street: "Main St",
        house_number: "1",
        address_line2: "",
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

  test("parseEventFormBody keeps subtitle language when subtitles on", async () => {
    const values = await parseEventFormBody(
      {
        partner_id: "partner-1",
        title: "Film Night",
        description: "With English subs",
        street: "Main St",
        house_number: "1",
        address_line2: "",
        zip_code: "10115",
        category: "Film",
        event_type: "Screening",
        event_date: "2026-08-01",
        event_time: "20:00",
        timing_mode: "TIME_SLOT",
        credit_price: "1",
        total_capacity: "20",
        ticket_type: "SECRET_CODE",
        secret_code: "FILM1",
        has_subtitles: "on",
        subtitle_language: "EN",
        language_independent: "on",
      },
      asString,
      asFile,
    );

    expect(values.hasSubtitles).toBe(true);
    expect(values.subtitleLanguage).toBe("EN");
    expect(values.languageIndependent).toBe(true);
  });

  test("parseEventFormBody clears subtitle language when subtitles off", async () => {
    const values = await parseEventFormBody(
      {
        partner_id: "partner-1",
        title: "No Subs",
        description: "Plain talk",
        street: "Main St",
        house_number: "1",
        address_line2: "",
        zip_code: "10115",
        category: "Talk",
        event_type: "Talk",
        event_date: "2026-08-01",
        event_time: "20:00",
        timing_mode: "TIME_SLOT",
        credit_price: "1",
        total_capacity: "20",
        ticket_type: "SECRET_CODE",
        secret_code: "TALK1",
        subtitle_language: "EN",
      },
      asString,
      asFile,
    );

    expect(values.hasSubtitles).toBe(false);
    expect(values.subtitleLanguage).toBeNull();
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

function weekdayHours(overrides?: Partial<OpeningHoursWeek>): OpeningHoursWeek {
  const week: OpeningHoursWeek = {
    mon: { open: "10:00", close: "18:00" },
    tue: { open: "10:00", close: "18:00" },
    wed: { open: "10:00", close: "18:00" },
    thu: { open: "10:00", close: "18:00" },
    fri: { open: "10:00", close: "18:00" },
    sat: { open: "10:00", close: "18:00" },
    sun: { closed: true },
  };
  return { ...week, ...overrides };
}

describe("expandOccurrencesFromRange", () => {
  test("3 days × 2 slots produce six occurrences with per-slot credits", () => {
    const occurrences = expandOccurrencesFromRange({
      startDate: "2026-09-01",
      endDate: "2026-09-03",
      slots: [
        { time: "10:00", creditPrice: 1 },
        { time: "18:00", creditPrice: 3 },
      ],
      timingMode: "TIME_SLOT",
    });

    expect(occurrences).toHaveLength(6);
    expect(occurrences.map((row) => formatBerlinTime(row.startsAt))).toEqual([
      "10:00",
      "18:00",
      "10:00",
      "18:00",
      "10:00",
      "18:00",
    ]);
    expect(occurrences.map((row) => row.creditPrice)).toEqual([1, 3, 1, 3, 1, 3]);
  });

  test("skips Sunday when the partner week marks it closed", () => {
    const occurrences = expandOccurrencesFromRange({
      startDate: "2026-09-05",
      endDate: "2026-09-07",
      slots: [{ time: "10:00", creditPrice: 1 }],
      timingMode: "TIME_SLOT",
      openingHours: weekdayHours(),
    });

    expect(occurrences.map((row) => formatEventDateInput(row.startsAt))).toEqual([
      "2026-09-05",
      "2026-09-07",
    ]);
  });

  test("includes Sunday when no opening hours are provided", () => {
    const occurrences = expandOccurrencesFromRange({
      startDate: "2026-09-05",
      endDate: "2026-09-07",
      slots: [{ time: "19:30", creditPrice: 1 }],
      timingMode: "TIME_SLOT",
    });

    expect(occurrences).toHaveLength(3);
    expect(occurrences.map((row) => formatEventDateInput(row.startsAt))).toEqual([
      "2026-09-05",
      "2026-09-06",
      "2026-09-07",
    ]);
  });

  test("throws TOO_MANY_OCCURRENCES above 52", () => {
    expect(() =>
      expandOccurrencesFromRange({
        startDate: "2026-09-01",
        endDate: "2026-10-23",
        slots: [{ time: "10:00", creditPrice: 1 }],
        timingMode: "TIME_SLOT",
      }),
    ).toThrow(CatalogValidationError);

    try {
      expandOccurrencesFromRange({
        startDate: "2026-09-01",
        endDate: "2026-10-23",
        slots: [{ time: "10:00", creditPrice: 1 }],
        timingMode: "TIME_SLOT",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogValidationError);
      expect((error as CatalogValidationError).code).toBe("TOO_MANY_OCCURRENCES");
    }
  });

  test("ALL_DAY emits one midnight row per date using the first slot credits", () => {
    const occurrences = expandOccurrencesFromRange({
      startDate: "2026-09-01",
      endDate: "2026-09-02",
      slots: [
        { time: "10:00", creditPrice: 1 },
        { time: "18:00", creditPrice: 3 },
      ],
      timingMode: "ALL_DAY",
    });

    expect(occurrences).toHaveLength(2);
    expect(occurrences.map((row) => formatBerlinTime(row.startsAt))).toEqual(["00:00", "00:00"]);
    expect(occurrences.map((row) => row.creditPrice)).toEqual([1, 1]);
  });

  test("start after end returns an empty list", () => {
    expect(
      expandOccurrencesFromRange({
        startDate: "2026-09-03",
        endDate: "2026-09-01",
        slots: [{ time: "10:00", creditPrice: 1 }],
        timingMode: "TIME_SLOT",
      }),
    ).toEqual([]);
  });

  test("rebuild replace is a fresh assignment not a merge", () => {
    const previous = occurrencesToFormRows(
      expandOccurrencesFromRange({
        startDate: "2026-09-01",
        endDate: "2026-09-03",
        slots: [
          { time: "10:00", creditPrice: 1 },
          { time: "18:00", creditPrice: 3 },
        ],
        timingMode: "TIME_SLOT",
      }),
    );
    const rebuilt = occurrencesToFormRows(
      expandOccurrencesFromRange({
        startDate: "2026-09-01",
        endDate: "2026-09-02",
        slots: [
          { time: "10:00", creditPrice: 1 },
          { time: "18:00", creditPrice: 3 },
        ],
        timingMode: "TIME_SLOT",
      }),
    );

    expect(previous).toHaveLength(6);
    expect(rebuilt).toHaveLength(4);
    expect(rebuilt.some((row) => row.date === "2026-09-03")).toBe(false);
    expect(previous.some((row) => row.date === "2026-09-03")).toBe(true);
  });

  test("defaultRangeSlotsFromHours uses distinct open times or 19:30", () => {
    expect(
      defaultRangeSlotsFromHours(true, weekdayHours({ sat: { open: "12:00", close: "16:00" } })),
    ).toEqual([
      { time: "10:00", credits: "1" },
      { time: "12:00", credits: "1" },
    ]);
    expect(defaultRangeSlotsFromHours(false, weekdayHours())).toEqual([
      { time: "19:30", credits: "1" },
    ]);
  });

  test("parseRangeBuilder reads range_* fields and ignores builder_time_N", () => {
    const parsed = parseRangeBuilder(
      {
        range_start: "2026-09-01",
        range_end: "2026-09-03",
        range_slot_count: "2",
        range_slot_time_0: "10:00",
        range_slot_credit_0: "1",
        range_slot_time_1: "18:00",
        range_slot_credit_1: "3",
        builder_time_0: "08:00",
      },
      asString,
    );

    expect(parsed).toEqual({
      rangeStart: "2026-09-01",
      rangeEnd: "2026-09-03",
      rangeSlots: [
        { time: "10:00", credits: "1" },
        { time: "18:00", credits: "3" },
      ],
    });
  });

  test("eventFormValuesToOccurrences rejects more than 52 complete rows", () => {
    const dateTimeRows = Array.from({ length: 53 }, (_, index) => ({
      date: `2026-09-${String((index % 30) + 1).padStart(2, "0")}`,
      time: `${String(8 + Math.floor(index / 30)).padStart(2, "0")}:${String(index % 60).padStart(2, "0")}`,
      credits: "1",
    }));

    try {
      eventFormValuesToOccurrences({
        partnerId: "partner-1",
        title: "Cap",
        description: "x",
        street: "Main",
        houseNumber: "1",
        addressLine2: null,
        zipCode: "10115",
        category: "Music",
        eventType: "Concert",
        tags: [],
        dateTimeRows,
        timingMode: "TIME_SLOT",
        creditPrice: 1,
        totalCapacity: 10,
        ticketType: "SECRET_CODE",
        secretCode: null,
        eventWebsiteUrl: null,
        promoCodes: [],
        voucherPdfs: [],
        replaceUnusedInventory: false,
        languageIndependent: false,
        languages: null,
        hasSubtitles: false,
        subtitleLanguage: null,
        lat: null,
        lng: null,
        imageUpload: null,
        imageUrl: null,
        imagePrebuilt: null,
        stagedImageId: null,
        imageCredit: "",
      });
      throw new Error("expected TOO_MANY_OCCURRENCES");
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogValidationError);
      expect((error as CatalogValidationError).code).toBe("TOO_MANY_OCCURRENCES");
    }
  });
});

describe("eventFormErrorStep", () => {
  test("maps missing image to step 3", () => {
    expect(
      eventFormErrorStep(
        new CatalogValidationError("MISSING_EVENT_IMAGE", "Event image is required"),
      ),
    ).toBe(3);
    expect(eventFormErrorStep(new ImageValidationError("Image must be JPEG"))).toBe(3);
    expect(eventFormErrorStep(new Error("S3_BUCKET is required"))).toBe(3);
  });

  test("maps empty dateTimes to step 2", () => {
    expect(
      eventFormErrorStep(
        new CatalogValidationError("EMPTY_DATE_TIMES", "At least one datetime is required"),
      ),
    ).toBe(2);
    expect(
      eventFormErrorStep(new CatalogValidationError("REQUIRED_FIELD", "secretCode is required")),
    ).toBe(2);
  });

  test("maps title and zip required to step 1", () => {
    expect(
      eventFormErrorStep(new CatalogValidationError("REQUIRED_FIELD", "title is required")),
    ).toBe(1);
    expect(eventFormErrorStep(new PostalValidationError("INVALID_POSTAL_CODE", "bad zip"))).toBe(1);
    expect(eventFormErrorStep(new Error("something else"))).toBe(1);
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
