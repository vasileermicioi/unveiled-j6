import { describe, expect, test } from "bun:test";
import type { Event } from "../schema/events";
import {
  assertBookingEligible,
  assertValidTicketCount,
  isBookingEligibleStatus,
} from "./eligibility";
import { BookingError } from "./errors";
import { generateSecretCode, resolveRedemption } from "./redemption";

function baseEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    partnerId: "00000000-0000-0000-0000-000000000002",
    partnerName: "Test Partner",
    title: "Test",
    description: "Desc",
    address: "Addr",
    neighborhood: "Mitte",
    imageId: "00000000-0000-0000-0000-000000000003",
    category: "Theater",
    eventType: "Performance",
    tags: [],
    dateTime: new Date("2030-01-01T19:00:00.000Z"),
    timingMode: "TIME_SLOT",
    startTimeMinutes: 0,
    weekday: 2,
    creditPrice: 1,
    totalCapacity: 10,
    remainingCapacity: 10,
    ticketType: "SECRET_CODE",
    secretCodeMode: "MANUAL",
    secretCode: "ABC123",
    promoCode: null,
    eventWebsiteUrl: null,
    barrierFree: null,
    languages: null,
    targetAgeGroups: null,
    lat: null,
    lng: null,
    mapZoom: null,
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
    expect(() => assertValidTicketCount(4)).toThrow(BookingError);
  });
});

describe("resolveRedemption", () => {
  test("manual secret code", () => {
    const result = resolveRedemption(baseEvent());
    expect(result.redemptionInfo).toBe("ABC123");
    expect(result.persistEventSecretCode).toBeUndefined();
  });

  test("shared generated creates once", () => {
    const result = resolveRedemption(
      baseEvent({ secretCodeMode: "SHARED_GENERATED", secretCode: null }),
    );
    expect(result.redemptionInfo.length).toBeGreaterThanOrEqual(8);
    expect(result.persistEventSecretCode).toBe(result.redemptionInfo);
  });

  test("unique per booking", () => {
    const a = resolveRedemption(baseEvent({ secretCodeMode: "UNIQUE_PER_BOOKING" }));
    const b = resolveRedemption(baseEvent({ secretCodeMode: "UNIQUE_PER_BOOKING" }));
    expect(a.redemptionInfo).not.toBe(b.redemptionInfo);
  });

  test("voucher", () => {
    const result = resolveRedemption(
      baseEvent({
        ticketType: "VOUCHER",
        secretCodeMode: null,
        secretCode: null,
        promoCode: "PROMO10",
        eventWebsiteUrl: "https://example.com/event",
      }),
    );
    expect(result.redemptionInfo).toBe("PROMO10");
    expect(result.redemptionUrl).toBe("https://example.com/event");
  });

  test("generateSecretCode length", () => {
    expect(generateSecretCode(10)).toHaveLength(10);
  });
});
