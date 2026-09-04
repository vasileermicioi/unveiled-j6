import { Link, Paragraph, Surface } from "@heroui/react";

import type { LandingV3Credits } from "../../../lib/content/types";
import { LandingSectionHeaderV3 } from "./LandingSectionHeaderV3";

type LandingPartnersV3Props = {
  content: LandingV3Credits;
};

export function LandingPartnersV3({ content }: LandingPartnersV3Props) {
  return (
    <Surface
      className="landing-partners mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
      variant="transparent"
    >
      <Surface
        className="landing-flex__head mx-auto flex w-full max-w-3xl flex-col items-center"
        variant="transparent"
      >
        <LandingSectionHeaderV3
          eyebrow={content.partnersEyebrow}
          headline={content.partnersSub}
          level={2}
        />
      </Surface>

      <Surface className="landing-flex__soon" variant="transparent">
        {content.partners.map((partner) => (
          <Link
            className="landing-soon"
            href={partner.href}
            key={partner.name}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Surface className="landing-soon__logo" variant="transparent">
              <img
                alt={`${partner.name} logo`}
                className="landing-soon__logo-el"
                decoding="async"
                height={40}
                loading="lazy"
                src={partner.logoSrc}
                width={40}
              />
            </Surface>
            <Surface
              className="landing-soon__text flex min-w-0 flex-col gap-1"
              variant="transparent"
            >
              <Paragraph className="landing-soon__name">{partner.name}</Paragraph>
            </Surface>
          </Link>
        ))}
      </Surface>

      <Paragraph className="landing-partners__note" color="muted" size="sm">
        {content.partnersNote}
      </Paragraph>
    </Surface>
  );
}
