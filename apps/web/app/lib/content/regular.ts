import { landingContent } from "./landing";
import type { LandingContent, LandingRegularOffer, LocalizedContent } from "./types";

function toRegularLanding(
  base: LandingContent,
  offer: LandingRegularOffer,
  finalCtaBody: string,
): LandingContent {
  return {
    ...base,
    offer,
    finalCta: {
      ...base.finalCta,
      body: finalCtaBody,
    },
  };
}

export const regularLandingContent: LocalizedContent<LandingContent> = {
  de: toRegularLanding(
    landingContent.de,
    {
      kind: "regular",
      price: "29 €",
      period: "pro Monat",
      basePerk: landingContent.de.offer.basePerk,
      perkGroupLabel: "Member Perks",
      foundingPerks: landingContent.de.offer.foundingPerks,
      cta: landingContent.de.offer.cta,
      cancel: landingContent.de.offer.cancel,
    },
    "17 Credits im Monat · Community inklusive · 29 € pro Monat",
  ),
  en: toRegularLanding(
    landingContent.en,
    {
      kind: "regular",
      price: "29 €",
      period: "per month",
      basePerk: landingContent.en.offer.basePerk,
      perkGroupLabel: "First member perks",
      foundingPerks: landingContent.en.offer.foundingPerks,
      cta: landingContent.en.offer.cta,
      cancel: landingContent.en.offer.cancel,
    },
    "17 Credits a month · Community built in · 29 € per month",
  ),
};
