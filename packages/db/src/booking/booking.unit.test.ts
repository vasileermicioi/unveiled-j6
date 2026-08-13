import { describe, expect, test } from "bun:test";
import type { Event } from "../schema/events";
import {
  assertBookingEligible,
  assertValidTicketCount,
  isBookingEligibleStatus,
} from "./eligibility";
import { BookingError } from "./errors";
import { maxBookableTickets } from "./max-bookable-tickets";
import { resolveRedemption } from "./redemption";

function baseEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    partnerId: "00000000-0000-0000-0000-000000000002",
    partnerName: "Test Partner",
    title: "Test",
    description: "Desc",
    address: "Addr 1, 10115 Berlin",
    street: "Addr",
    houseNumber: "1",
    addressLine2: null,
    country: "DE",
    city: "berlin",
    zipCode: "10115",
    imageId: "00000000-0000-0000-0000-000000000003",
    category: "Theater",
    eventType: "Performance",
    tags: [],
    dateTimes: [new Date("2030-01-01T19:00:00.000Z")],
    dateTime: new Date("2030-01-01T19:00:00.000Z"),
    timingMode: "TIME_SLOT",
    startTimeMinutes: 0,
    weekday: 2,
    occurrenceCreditPrices: [1],
    creditPrice: 1,
    totalCapacity: 10,
    remainingCapacity: 10,
    ticketType: "SECRET_CODE",
    secretCode: "ABC123",
    promoCode: null,
    eventWebsiteUrl: null,
    barrierFree: null,
    languageIndependent: false,
    languages: null,
    hasSubtitles: false,
    subtitleLanguage: null,
    lat: null,
    lng: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("booking eligibility", () => {
  test("allows ACTIVE and CANCELLED_PENDING", () => {
    expect(isBookingEligibleStatus("ACTIVE")).toBe(true);
    expect(isBookingEligibleStatus("CANCELLED_PENDING")).toBe(true);
    expect(isBookingEligibleStatus("INACTIVE")).toBe(false);
    expect(() => assertBookingEligible("PAST_DUE")).toThrow(BookingError);
  });

  test("assertValidTicketCount allows integers >= 1 including above 3", () => {
    expect(() => assertValidTicketCount(1)).not.toThrow();
    expect(() => assertValidTicketCount(4)).not.toThrow();
    expect(() => assertValidTicketCount(0)).toThrow(BookingError);
    expect(() => assertValidTicketCount(1.5)).toThrow(BookingError);
  });
});

describe("maxBookableTickets", () => {
  test("guest preview capped at 3", () => {
    expect(
      maxBookableTickets({
        viewerKind: "guest",
        credits: 100,
        creditPrice: 1,
        remainingCapacity: 50,
      }),
    ).toBe(3);
  });

  test("signed-in follows credits and capacity", () => {
    expect(
      maxBookableTickets({
        viewerKind: "signed-in",
        credits: 17,
        creditPrice: 2,
        remainingCapacity: 10,
      }),
    ).toBe(8);
  });

  test("signed-in respects available inventory when provided", () => {
    expect(
      maxBookableTickets({
        viewerKind: "signed-in",
        credits: 17,
        creditPrice: 2,
        remainingCapacity: 10,
        availableInventory: 3,
      }),
    ).toBe(3);
  });

  test("signed-in zero credits yields 0", () => {
    expect(
      maxBookableTickets({
        viewerKind: "signed-in",
        credits: 0,
        creditPrice: 2,
        remainingCapacity: 10,
      }),
    ).toBe(0);
  });

  test("signed-in creditPrice <= 0 uses capacity only", () => {
    expect(
      maxBookableTickets({
        viewerKind: "signed-in",
        credits: 17,
        creditPrice: 0,
        remainingCapacity: 6,
      }),
    ).toBe(6);
  });

  test("signed-in creditPrice <= 0 still respects inventory", () => {
    expect(
      maxBookableTickets({
        viewerKind: "signed-in",
        credits: 17,
        creditPrice: 0,
        remainingCapacity: 6,
        availableInventory: 2,
      }),
    ).toBe(2);
  });

  test("signed-in max follows selected slot price 3 vs 1", () => {
    expect(
      maxBookableTickets({
        viewerKind: "signed-in",
        credits: 6,
        creditPrice: 1,
        remainingCapacity: 10,
      }),
    ).toBe(6);
    expect(
      maxBookableTickets({
        viewerKind: "signed-in",
        credits: 6,
        creditPrice: 3,
        remainingCapacity: 10,
      }),
    ).toBe(2);
  });
});

describe("resolveRedemption", () => {
  test("secret code from event", () => {
    const result = resolveRedemption(baseEvent());
    expect(result.redemptionType).toBe("SECRET_CODE");
    expect(result.redemptionInfo).toBe("ABC123");
    expect(result.redemptionUrl).toBeNull();
  });

  test("rejects missing secret code", () => {
    expect(() => resolveRedemption(baseEvent({ secretCode: null }))).toThrow(BookingError);
  });

  test("rejects voucher promo (use inventory allocation)", () => {
    expect(() =>
      resolveRedemption(
        baseEvent({
          ticketType: "VOUCHER_PROMO",
          secretCode: null,
          eventWebsiteUrl: "https://example.com/event",
        }),
      ),
    ).toThrow(BookingError);
  });

  test("rejects voucher pdf (use inventory allocation)", () => {
    expect(() =>
      resolveRedemption(
        baseEvent({
          ticketType: "VOUCHER_PDF",
          secretCode: null,
        }),
      ),
    ).toThrow(BookingError);
  });
});
