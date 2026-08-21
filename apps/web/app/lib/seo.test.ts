import { beforeEach, describe, expect, test } from "bun:test";

import { mockEvent } from "../components/stories/fixtures";
import { setRuntimeEnv } from "./runtime-env";
import { buildEventJsonLd, buildPageMeta, eventDetailPageMeta } from "./seo";
import { DEFAULT_OG_IMAGE_PATH } from "./site-config";

const SITE = "https://example.test";

describe("buildPageMeta", () => {
  beforeEach(() => {
    setRuntimeEnv({ SITE_URL: SITE });
  });

  test("default OG uses square-safe fallback with dimension tags", () => {
    const meta = buildPageMeta({
      locale: "en",
      pathname: "/en/faq",
      title: "FAQ",
      description: "Answers",
    });

    expect(DEFAULT_OG_IMAGE_PATH).toBe("/og-default-v2.png");
    expect(meta.openGraph["og:image"]).toBe(`${SITE}${DEFAULT_OG_IMAGE_PATH}`);
    expect(meta.openGraph["og:image:width"]).toBe("1200");
    expect(meta.openGraph["og:image:height"]).toBe("630");
    expect(meta.openGraph["og:image:type"]).toBe("image/png");
    expect(meta.openGraph["og:image:alt"]).toBe("Unveiled Berlin");
    expect(meta.twitter["twitter:card"]).toBe("summary_large_image");
    expect(meta.twitter["twitter:image"]).toBe(meta.openGraph["og:image"]);
  });

  test("ogImage override wins and uses webp type", () => {
    const ogImage = "https://cdn.example/images/abc/og-1200x630.webp";
    const meta = buildPageMeta({
      locale: "en",
      pathname: "/en/events/abc",
      title: "Night at Venue",
      description: "Show",
      ogImage,
    });

    expect(meta.openGraph["og:image"]).toBe(ogImage);
    expect(meta.openGraph["og:image"]).not.toContain("/og-default-v2.png");
    expect(meta.openGraph["og:image:type"]).toBe("image/webp");
    expect(meta.openGraph["og:image:width"]).toBe("1200");
    expect(meta.openGraph["og:image:height"]).toBe("630");
    expect(meta.twitter["twitter:image"]).toBe(ogImage);
  });
});

describe("event locale copy SEO", () => {
  const bilingual = {
    ...mockEvent,
    title: "Konzert",
    titleDe: "Konzert",
    titleEn: "Concert",
    description: "Auf **Deutsch**",
    descriptionDe: "Auf **Deutsch**",
    descriptionEn: "In **English**",
    partnerName: "Venue",
    remainingCapacity: 10,
    dateTime: new Date("2027-01-01T19:00:00+01:00"),
  };

  test("eventDetailPageMeta uses English copy on /en", () => {
    const meta = eventDetailPageMeta(bilingual, "en");
    expect(meta.title).toBe("Concert at Venue");
    expect(meta.description).toContain("In English");
    expect(meta.description).not.toContain("**");
  });

  test("eventDetailPageMeta uses German copy on /de", () => {
    const meta = eventDetailPageMeta(bilingual, "de");
    expect(meta.title).toBe("Konzert at Venue");
    expect(meta.description).toContain("Auf Deutsch");
    expect(meta.description).not.toContain("**");
  });

  test("buildEventJsonLd name and description follow locale", () => {
    const en = buildEventJsonLd(bilingual, "en");
    expect(en.name).toBe("Concert");
    expect(en.description).toContain("In English");
    expect(en.description).not.toContain("**");

    const de = buildEventJsonLd(bilingual, "de");
    expect(de.name).toBe("Konzert");
    expect(de.description).toContain("Auf Deutsch");
  });
});
