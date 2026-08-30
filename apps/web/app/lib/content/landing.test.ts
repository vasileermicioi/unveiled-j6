import { describe, expect, test } from "bun:test";

import type { Locale } from "../locale";
import { landingContent } from "./landing";

const locales: Locale[] = ["de", "en"];

describe("landing content guard", () => {
  test("both locales expose hero, offer, events, credits, flexibility, community, final CTA", () => {
    for (const locale of locales) {
      const page = landingContent[locale];
      expect(page.hero.headline.trim().length).toBeGreaterThan(0);
      expect(page.hero.lead.trim().length).toBeGreaterThan(0);
      expect(page.offer.cta.trim().length).toBeGreaterThan(0);
      expect(page.events.items.length).toBe(5);
      expect(page.events.items.filter((item) => item.locked).length).toBe(2);
      expect(page.credits.examples.length).toBe(3);
      expect(page.flexibility.venues.length).toBe(2);
      expect(page.flexibility.partners.length).toBe(8);
      for (const partner of page.flexibility.partners) {
        expect(partner.logoSrc.startsWith("/images/landing/partners/")).toBe(true);
      }
      expect(page.community.proof.trim().length).toBeGreaterThan(0);
      expect(page.finalCta.cta.trim().length).toBeGreaterThan(0);
    }
  });
});
