import { describe, expect, test } from "bun:test";

import type { Locale } from "../locale";
import { landingV3Content } from "./landing-v3";

const locales: Locale[] = ["de", "en"];

describe("landing-v3 content guard", () => {
  test("both locales expose all v3 sections with non-empty copy", () => {
    for (const locale of locales) {
      const page = landingV3Content[locale];
      expect(page.hero.tag.trim().length).toBeGreaterThan(0);
      expect(page.hero.headlineA.trim().length).toBeGreaterThan(0);
      expect(page.hero.headlineB.trim().length).toBeGreaterThan(0);
      expect(page.hero.lead.trim().length).toBeGreaterThan(0);
      expect(page.offer.cta.trim().length).toBeGreaterThan(0);
      expect(page.events.headline.trim().length).toBeGreaterThan(0);
      expect(page.events.body.trim().length).toBeGreaterThan(0);
      expect(page.credits.headlineA.trim().length).toBeGreaterThan(0);
      expect(page.credits.goTogetherTitle.trim().length).toBeGreaterThan(0);
      expect(page.credits.ownPlansTitle.trim().length).toBeGreaterThan(0);
      expect(page.community.headline.trim().length).toBeGreaterThan(0);
      expect(page.community.proof.trim().length).toBeGreaterThan(0);
      expect(page.finalCta.headline.trim().length).toBeGreaterThan(0);
      expect(page.finalCta.cta.trim().length).toBeGreaterThan(0);
    }
  });

  test("offer is the regular 29 € membership (no deposit)", () => {
    for (const locale of locales) {
      const offer = landingV3Content[locale].offer;
      expect(offer.kind).toBe("regular");
      expect(offer.price).toBe("29 €");
      expect(offer.basePerk.highlight).toBe("17");
    }
  });

  test("DE/EN key parity across sections and partners", () => {
    const de = landingV3Content.de;
    const en = landingV3Content.en;
    expect(Object.keys(en.hero).sort()).toEqual(Object.keys(de.hero).sort());
    expect(Object.keys(en.events).sort()).toEqual(Object.keys(de.events).sort());
    expect(Object.keys(en.credits).sort()).toEqual(Object.keys(de.credits).sort());
    expect(Object.keys(en.community).sort()).toEqual(Object.keys(de.community).sort());
    expect(Object.keys(en.finalCta).sort()).toEqual(Object.keys(de.finalCta).sort());
    expect(en.credits.partners.length).toBe(de.credits.partners.length);
    expect(de.credits.partners.length).toBeGreaterThan(0);
    for (const partner of [...de.credits.partners, ...en.credits.partners]) {
      expect(partner.name.trim().length).toBeGreaterThan(0);
      expect(partner.href.startsWith("https://")).toBe(true);
      expect(partner.logoSrc.trim().length).toBeGreaterThan(0);
    }
  });

  test("events rail copy carries no static items or credit labels", () => {
    for (const locale of locales) {
      const events = landingV3Content[locale].events as unknown as Record<string, unknown>;
      expect("items" in events).toBe(false);
      expect("credits" in events).toBe(false);
    }
  });
});
