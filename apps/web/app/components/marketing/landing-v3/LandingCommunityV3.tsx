import { Paragraph, Surface } from "@heroui/react";

import type { LandingV3Community } from "../../../lib/content/types";
import { landingV3CommunityImages } from "./assets";
import { LandingSectionHeaderV3 } from "./LandingSectionHeaderV3";

type LandingCommunityV3Props = {
  content: LandingV3Community;
};

export function LandingCommunityV3({ content }: LandingCommunityV3Props) {
  return (
    <Surface
      className="landing-community mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
      variant="transparent"
    >
      <LandingSectionHeaderV3
        body={content.proof}
        eyebrow={content.eyebrow}
        headline={content.headline}
      />
      <Surface className="landing-community__wall" variant="transparent">
        {landingV3CommunityImages.map((src, index) => (
          <Surface className="landing-community__tile" key={src} variant="transparent">
            <img
              alt={index === 0 ? content.photoAlt : ""}
              className="landing-community__img"
              decoding="async"
              loading="lazy"
              src={src}
            />
          </Surface>
        ))}
      </Surface>
      <Paragraph className="sr-only">{content.photoAlt}</Paragraph>
    </Surface>
  );
}
