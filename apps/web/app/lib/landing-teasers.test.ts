import { afterEach, describe, expect, test } from "bun:test";
import type { Event } from "@unveiled/db";
import { landingFallbackTeasers } from "./content/landing-v3";
import {
  formatTeaserDateLabel,
  formatTeaserTime,
  getLandingFallbackTeasers,
  LANDING_LIVE_TEASER_LIMIT,
  mapLandingLiveTeasers,
  toLandingLiveTeaser,
} from "./landing-teasers";
import type { Locale } from "./locale";

const IMAGE_ID = "123e4567-e89b-12d3-a456-426614174000";
const savedBaseUrl = process.env.IMAGE_PUBLIC_BASE_URL;

afterEach(() => {
  if (savedBaseUrl === undefined) {
    delete process.env.IMAGE_PUBLIC_BASE_URL;
  } else {
    process.env.IMAGE_PUBLIC_BASE_URL = savedBaseUrl;
  }
});

function makeEvent(overrides: Partial<Record<string, unknown>> = {}): Event {
  return {
    id: "event-id",
    title: "Fallback title",
    titleDe: "DE Titel",
    titleEn: "EN title",
    description: "Fallback Beschreibung",
    descriptionDe: "DE Beschreibung",
    descriptionEn: "EN description",
    dateTime: new Date("2026-09-02T18:00:00.000Z"),
    timingMode: "TIME_SLOT",
    partnerName: "Chamäleon Theater",
    zipCode: "10115",
    imageId: IMAGE_ID,
    creditPrice: 6,
    remainingCapacity: 42,
    secretCode: "SECRET-123",
    eventWebsiteUrl: "https://example.com/event",
    ...overrides,
  } as unknown as Event;
}

describe("landing live teasers", () => {
  test("teaser exposes only guest-safe keys", () => {
    delete process.env.IMAGE_PUBLIC_BASE_URL;
    const teaser = toLandingLiveTeaser(makeEvent(), "de");
    expect(Object.keys(teaser).sort()).toEqual(
      ["dateLabel", "description", "id", "image", "place", "time", "title"].sort(),
    );
    const serialized = JSON.stringify(teaser);
    expect(serialized).not.toContain("SECRET-123");
    expect(serialized).not.toContain("example.com/event");
    expect(serialized.toLowerCase()).not.toContain("credit");
    expect(serialized.toLowerCase()).not.toContain("capacity");
  });

  test("locale copy resolves with fallback to the other locale", () => {
    expect(toLandingLiveTeaser(makeEvent(), "de").title).toBe("DE Titel");
    expect(toLandingLiveTeaser(makeEvent(), "en").title).toBe("EN title");
    expect(toLandingLiveTeaser(makeEvent({ titleDe: "  " }), "de").title).toBe("EN title");
  });

  test("date label is DD MMM uppercase in Europe/Berlin", () => {
    expect(formatTeaserDateLabel(new Date("2026-09-02T18:00:00.000Z"))).toBe("02 SEP");
  });

  test("time uses locale prefix, empty for all-day events", () => {
    const date = new Date("2026-09-02T18:00:00.000Z");
    const de = formatTeaserTime(date, "de", "TIME_SLOT");
    const en = formatTeaserTime(date, "en", "TIME_SLOT");
    expect(de.startsWith("ab ")).toBe(true);
    expect(en.startsWith("from ")).toBe(true);
    expect(de.slice(3)).toBe(en.slice(5));
    expect(formatTeaserTime(date, "de", "ALL_DAY")).toBe("");
    expect(toLandingLiveTeaser(makeEvent({ timingMode: "ALL_DAY" }), "de").time).toBe("");
  });

  test("place falls back to zip code when partner name is blank", () => {
    expect(toLandingLiveTeaser(makeEvent(), "de").place).toBe("Chamäleon Theater");
    expect(toLandingLiveTeaser(makeEvent({ partnerName: "  " }), "de").place).toBe("10115");
  });

  test("image is undefined without a public base URL, variant URL otherwise", () => {
    delete process.env.IMAGE_PUBLIC_BASE_URL;
    expect(toLandingLiveTeaser(makeEvent(), "de").image).toBeUndefined();
    process.env.IMAGE_PUBLIC_BASE_URL = "https://cdn.example.com";
    expect(toLandingLiveTeaser(makeEvent(), "de").image).toBe(
      `https://cdn.example.com/images/${IMAGE_ID}/medium-640.webp`,
    );
    expect(toLandingLiveTeaser(makeEvent({ imageId: "  " }), "de").image).toBeUndefined();
  });

  test("mapping is soonest-first and the rail limit is 3", () => {
    expect(LANDING_LIVE_TEASER_LIMIT).toBe(3);
    const late = makeEvent({ id: "late", dateTime: new Date("2026-09-09T17:00:00.000Z") });
    const early = makeEvent({ id: "early", dateTime: new Date("2026-09-02T18:00:00.000Z") });
    const mid = makeEvent({ id: "mid", dateTime: new Date("2026-09-04T17:00:00.000Z") });
    const mapped = mapLandingLiveTeasers([late, early, mid], "en");
    expect(mapped.map((teaser) => teaser.id)).toEqual(["early", "mid", "late"]);
    const five = [late, early, mid, late, early].map((event, index) =>
      makeEvent({ ...event, id: `event-${index}` }),
    );
    expect(mapLandingLiveTeasers(five, "de").slice(0, LANDING_LIVE_TEASER_LIMIT)).toHaveLength(3);
  });

  test("static fallback mirrors rail items without credits when DB is empty", () => {
    for (const locale of ["de", "en"] as Locale[]) {
      const fallback = getLandingFallbackTeasers(locale);
      expect(fallback.length).toBe(landingFallbackTeasers[locale].length);
      expect(fallback.map((teaser) => teaser.title)).toEqual(
        landingFallbackTeasers[locale].map((item) => item.title),
      );
      for (const teaser of fallback) {
        expect("credits" in teaser).toBe(false);
        expect("locked" in teaser).toBe(false);
      }
    }
  });
});
