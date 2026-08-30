import { describe, expect, test } from "bun:test";

import { buildFaqPageJsonLd } from "../seo";
import { faqContent } from "./faq";
import type { Locale } from "./locale";

const FAQ_ITEM_COUNT = 11;

const locales: Locale[] = ["de", "en"];

describe("faq content guard", () => {
  test("both locales expose 11 Q&As with non-empty question and answer", () => {
    for (const locale of locales) {
      const items = faqContent[locale].section.items;
      expect(items.length).toBe(FAQ_ITEM_COUNT);
      for (const item of items) {
        expect(item.question.trim().length).toBeGreaterThan(0);
        expect(item.answer.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test("FAQPage JSON-LD builder emits exactly the 11 items per locale", () => {
    for (const locale of locales) {
      const items = faqContent[locale].section.items;
      const jsonLd = buildFaqPageJsonLd(items);
      expect(jsonLd.mainEntity.length).toBe(FAQ_ITEM_COUNT);
      expect(jsonLd.mainEntity.map((entry) => entry.name)).toEqual(
        items.map((item) => item.question),
      );
      expect(jsonLd.mainEntity.map((entry) => entry.acceptedAnswer.text)).toEqual(
        items.map((item) => item.answer),
      );
    }
  });
});
