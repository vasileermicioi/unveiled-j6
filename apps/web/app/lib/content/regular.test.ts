import { describe, expect, test } from "bun:test";

import type { Locale } from "../locale";
import { landingContent } from "./landing";
import { regularLandingContent } from "./regular";

const locales: Locale[] = ["de", "en"];

describe("regular landing content", () => {
  test("both locales use the 29 € monthly offer without a deposit", () => {
    for (const locale of locales) {
      const page = regularLandingContent[locale];
      expect(page.offer.kind).toBe("regular");
      if (page.offer.kind !== "regular") {
        continue;
      }
      expect(page.offer.price).toBe("29 €");
      expect(page.offer.period.trim().length).toBeGreaterThan(0);
      expect(page.finalCta.body).toContain("29 €");
      expect(page.finalCta.body).not.toContain("19");
      expect(page.hero.headline).toBe(landingContent[locale].hero.headline);
      expect(page.events.items.length).toBe(landingContent[locale].events.items.length);
    }
  });
});
