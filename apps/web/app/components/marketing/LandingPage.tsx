import { Surface } from "@heroui/react";

import type { LandingContent } from "../../lib/content/types";
import type { Locale } from "../../lib/locale";
import { LandingCommunity } from "./landing/LandingCommunity";
import { LandingCredits } from "./landing/LandingCredits";
import { LandingEventsRail } from "./landing/LandingEventsRail";
import { LandingFinalCta } from "./landing/LandingFinalCta";
import { LandingFlexibility } from "./landing/LandingFlexibility";
import { LandingHero } from "./landing/LandingHero";

type LandingPageProps = {
  locale: Locale;
  landing: LandingContent;
};

export function LandingPage({ locale, landing }: LandingPageProps) {
  return (
    <Surface className="landing-page flex flex-col" variant="transparent">
      <LandingHero content={landing} locale={locale} />
      <LandingEventsRail content={landing.events} locale={locale} />
      <LandingCredits content={landing.credits} />
      <LandingFlexibility content={landing.flexibility} />
      <LandingCommunity content={landing.community} />
      <LandingFinalCta content={landing.finalCta} locale={locale} />
    </Surface>
  );
}
