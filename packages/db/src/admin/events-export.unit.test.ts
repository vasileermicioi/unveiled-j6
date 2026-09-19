import { describe, expect, test } from "bun:test";
import type { Event } from "../schema/events";
import {
  buildEventsExportQueryString,
  EVENTS_CSV_HEADER,
  formatEventsCsv,
  parseEventsExportFilters,
} from "./events-export";

function sampleEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    partnerId: "22222222-2222-2222-2222-222222222222",
    partnerName: "Museum A",
    title: "Exhibition",
    titleDe: "Ausstellung",
    titleEn: "Exhibition",
    description: "Desc",
    descriptionDe: "Beschr DE",
    descriptionEn: "Desc EN",
    address: "Street 1, 10115 Berlin",
    street: "Street",
    houseNumber: "1",
    addressLine2: null,
    country: "DE",
    city: "berlin",
    zipCode: "10115",
    imageId: "33333333-3333-3333-3333-333333333333",
    category: "ART",
    eventType: "EXHIBITION",
    tags: ["art", "museum"],
    dateTimes: [new Date("2026-09-20T10:00:00.000Z"), new Date("2026-09-21T10:00:00.000Z")],
    dateTime: new Date("2026-09-20T10:00:00.000Z"),
    timingMode: "TIME_SLOT",
    startTimeMinutes: 600,
    weekday: 6,
    occurrenceCreditPrices: [2, 2],
    creditPrice: 2,
    capacityMode: "SHARED",
    occurrenceCapacities: [50, 50],
    totalCapacity: 50,
    remainingCapacity: 42,
    ticketType: "SECRET_CODE",
    secretCode: "DOOR42",
    promoCode: null,
    eventWebsiteUrl: null,
    languageIndependent: false,
    languages: ["DE"],
    hasSubtitles: false,
    subtitleLanguages: null,
    lat: "52.5200",
    lng: "13.4050",
    published: true,
    createdAt: new Date("2026-09-01T08:00:00.000Z"),
    updatedAt: new Date("2026-09-10T08:00:00.000Z"),
    ...overrides,
  } as Event;
}

describe("events-export filter helpers", () => {
  test("parseEventsExportFilters trims and normalizes", () => {
    expect(
      parseEventsExportFilters(
        new URL(
          "https://example.com/export?title=%20Jazz%20&partner=Museum&language=de&published=yes",
        ),
      ),
    ).toEqual({ title: "Jazz", partner: "Museum", language: "DE", published: "yes" });
    expect(parseEventsExportFilters(new URL("https://example.com/export"))).toEqual({
      title: "",
      partner: "",
      language: "",
    });
  });

  test("parseEventsExportFilters drops invalid language/published", () => {
    expect(
      parseEventsExportFilters(new URL("https://example.com/export?language=xyz&published=maybe")),
    ).toEqual({ title: "", partner: "", language: "" });
  });

  test("buildEventsExportQueryString omits empty filters and includes format", () => {
    expect(buildEventsExportQueryString({})).toBe("");
    expect(
      buildEventsExportQueryString({
        title: " Jazz ",
        language: "de",
        published: "no",
        format: "csv",
      }),
    ).toBe("?title=Jazz&language=DE&published=no&format=csv");
  });
});

describe("formatEventsCsv", () => {
  test("emits header covering the full events table", () => {
    expect(EVENTS_CSV_HEADER.split(",")).toContain("date_times");
    expect(EVENTS_CSV_HEADER.split(",")).toContain("occurrence_credit_prices");
    expect(formatEventsCsv([])).toBe(`${EVENTS_CSV_HEADER}\n`);
  });

  test("emits escaped rows with joined arrays and ISO dates", () => {
    const csv = formatEventsCsv([
      sampleEvent({ title: 'Night, "Special"', addressLine2: "Floor 2" }),
    ]);
    const lines = csv.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(EVENTS_CSV_HEADER);
    expect(lines[1]).toContain('"Night, ""Special"""');
    expect(lines[1]).toContain("Museum A");
    expect(lines[1]).toContain("2026-09-20T10:00:00.000Z;2026-09-21T10:00:00.000Z");
    expect(lines[1]).toContain("2026-09-20T10:00:00.000Z");
    expect(lines[1]).toContain("DOOR42");
  });
});
