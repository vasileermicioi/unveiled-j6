import { Card, Link, Paragraph, Surface } from "@heroui/react";
import { ArrowRight } from "lucide-react";

import type { LandingContent } from "../../../lib/content/types";
import { landingVenueImages } from "./assets";
import { LandingSectionHeader } from "./LandingSectionHeader";

type LandingFlexibilityProps = {
  content: LandingContent["flexibility"];
};

export function LandingFlexibility({ content }: LandingFlexibilityProps) {
  return (
    <Surface className="landing-band landing-band--inverted" variant="transparent">
      <Surface
        className="landing-flex mx-auto flex max-w-7xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
        variant="transparent"
      >
        <Surface className="landing-flex__head mx-auto w-full max-w-3xl" variant="transparent">
          <LandingSectionHeader
            body={content.body}
            eyebrow={content.eyebrow}
            headline={content.headline}
            inverted
          />
        </Surface>

        <Surface className="landing-flex__venues grid gap-6 md:grid-cols-2" variant="transparent">
          {content.venues.map((venue, index) => (
            <Card className="landing-venue" key={venue.name}>
              <Card.Header className="landing-venue__header">
                <Surface className="landing-venue__image" variant="transparent">
                  <img
                    alt={venue.name}
                    className="landing-venue__image-el"
                    decoding="async"
                    loading="lazy"
                    src={landingVenueImages[index] ?? landingVenueImages[0]}
                  />
                </Surface>
              </Card.Header>
              <Card.Content className="landing-venue__body flex flex-col gap-2">
                <Card.Title className="landing-venue__name">{venue.name}</Card.Title>
                <Paragraph className="landing-venue__type">{venue.type}</Paragraph>
                <Paragraph className="landing-venue__from">{venue.fromCredits}</Paragraph>
              </Card.Content>
            </Card>
          ))}
        </Surface>

        <Surface
          className="landing-flex__more flex flex-wrap items-center justify-center gap-3"
          variant="transparent"
        >
          <ArrowRight aria-hidden size={18} strokeWidth={2.5} />
          <Paragraph className="landing-flex__more-text">{content.moreStrip}</Paragraph>
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
                <Paragraph className="landing-soon__status">{content.comingSoon}</Paragraph>
              </Surface>
            </Link>
          ))}
        </Surface>

        <Surface
          className="landing-flex__reassure mx-auto flex max-w-3xl flex-col gap-2 text-center"
          variant="transparent"
        >
          <Paragraph className="landing-flex__reassure-main">{content.reassure}</Paragraph>
          <Paragraph className="landing-flex__reassure-muted">{content.reassureMuted}</Paragraph>
        </Surface>
      </Surface>
    </Surface>
  );
}
