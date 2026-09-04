import { Surface } from "@heroui/react";

import type { LandingLiveTeaser, LandingV3Content } from "../../../lib/content/types";
import type { Locale } from "../../../lib/locale";
import { LandingCommunityV3 } from "./LandingCommunityV3";
import { LandingCreditsV3 } from "./LandingCreditsV3";
import { LandingEventsRailV3 } from "./LandingEventsRailV3";
import { LandingFinalCtaV3 } from "./LandingFinalCtaV3";
import { LandingHeroV3 } from "./LandingHeroV3";
import { LandingPartnersV3 } from "./LandingPartnersV3";

type LandingPageV3Props = {
  locale: Locale;
  content: LandingV3Content;
  teasers: LandingLiveTeaser[];
};

export function LandingPageV3({ locale, content, teasers }: LandingPageV3Props) {
  return (
    <Surface className="landing-page flex flex-col" variant="transparent">
      <LandingHeroV3 content={content} locale={locale} />
      <LandingEventsRailV3 copy={content.events} locale={locale} teasers={teasers} />
      <LandingCreditsV3 content={content.credits} />
      <LandingPartnersV3 content={content.credits} />
      <LandingCommunityV3 content={content.community} />
      <LandingFinalCtaV3 content={content.finalCta} locale={locale} />
    </Surface>
  );
}
