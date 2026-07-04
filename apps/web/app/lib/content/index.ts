import type { Locale } from "../locale";
import { discoverContent } from "./discover";
import { faqContent } from "./faq";
import { howItWorksContent } from "./how-it-works";
import { landingContent } from "./landing";
import { legalContent } from "./legal";
import { membershipContent } from "./membership";
import type { PageContentMap, PageKey } from "./types";

const contentByKey = {
  landing: landingContent,
  "how-it-works": howItWorksContent,
  faq: faqContent,
  discover: discoverContent,
  membership: membershipContent,
  impressum: legalContent.impressum,
  privacy: legalContent.privacy,
  terms: legalContent.terms,
} as const satisfies Record<PageKey, Record<Locale, PageContentMap[PageKey]>>;

export function getPageContent<K extends PageKey>(locale: Locale, pageKey: K): PageContentMap[K] {
  return contentByKey[pageKey][locale] as PageContentMap[K];
}

export type { PageContentMap, PageKey } from "./types";
