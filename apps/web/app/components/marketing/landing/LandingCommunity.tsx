import { Paragraph, Surface } from "@heroui/react";

import type { LandingContent } from "../../../lib/content/types";
import { landingCommunityImages } from "./assets";
import { LandingSectionHeader } from "./LandingSectionHeader";

type LandingCommunityProps = {
  content: LandingContent["community"];
};

export function LandingCommunity({ content }: LandingCommunityProps) {
  return (
    <Surface
      className="landing-community mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
      variant="transparent"
    >
      <LandingSectionHeader
        body={content.proof}
        eyebrow={content.eyebrow}
        headline={content.headline}
      />
      <Surface className="landing-community__wall" variant="transparent">
        {landingCommunityImages.slice(0, 8).map((src, index) => (
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
