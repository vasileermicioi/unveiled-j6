import { describe, expect, test } from "bun:test";

import { buildSitemapXml, escapeXml, toSitemapLastmod } from "./sitemap";

describe("sitemap", () => {
  test("escapeXml escapes reserved characters", () => {
    expect(escapeXml(`a&b<"'>`)).toBe("a&amp;b&lt;&quot;&apos;&gt;");
  });

  test("toSitemapLastmod uses YYYY-MM-DD UTC", () => {
    expect(toSitemapLastmod(new Date("2026-07-13T15:30:00.000Z"))).toBe("2026-07-13");
  });

  test("buildSitemapXml includes bookable event locales and marketing URLs", () => {
    const eventId = "11111111-1111-4111-8111-111111111111";
    const xml = buildSitemapXml([
      { loc: "https://example.com/de" },
      { loc: "https://example.com/de/faq" },
      { loc: "https://example.com/en/terms" },
      {
        loc: `https://example.com/de/events/${eventId}`,
        lastmod: "2026-07-10",
      },
      {
        loc: `https://example.com/en/events/${eventId}`,
        lastmod: "2026-07-10",
      },
    ]);

    expect(xml).toContain("<urlset");
    expect(xml).toContain("https://example.com/de/faq");
    expect(xml).toContain(`https://example.com/de/events/${eventId}`);
    expect(xml).toContain(`https://example.com/en/events/${eventId}`);
    expect(xml).toContain("<lastmod>2026-07-10</lastmod>");

    // Member feed path (no event id) must not appear as a <loc>
    expect(xml).not.toMatch(/<loc>https:\/\/example\.com\/de\/events<\/loc>/);
    expect(xml).not.toMatch(/<loc>https:\/\/example\.com\/en\/events<\/loc>/);
  });
});
