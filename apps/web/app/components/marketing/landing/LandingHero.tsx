import { Card, Chip, Heading, Link, Paragraph, Surface } from "@heroui/react";

import LandingImageGallery from "../../../islands/LandingImageGallery";
import type { LandingContent } from "../../../lib/content/types";
import type { Locale } from "../../../lib/locale";
import { localizedPath } from "../../../lib/locale";
import { landingHeroImages } from "./assets";
import { LandingPerkRow } from "./LandingPerkRow";

type LandingHeroProps = {
  locale: Locale;
  content: LandingContent;
};

export function LandingHero({ locale, content }: LandingHeroProps) {
  const { hero, offer, events } = content;
  const signupHref = localizedPath(locale, "signup");

  return (
    <Surface
      className="landing-hero mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
      id="join"
      variant="transparent"
    >
      <Surface className="landing-hero__intro flex max-w-4xl flex-col gap-4" variant="transparent">
        <Chip className="landing-hero__tag">{hero.tag}</Chip>
        <Heading className="landing-hero__headline" level={1}>
          {hero.headline}
        </Heading>
        <Paragraph className="landing-hero__lead" color="muted">
          {hero.lead}
        </Paragraph>
      </Surface>

      <Surface
        className="landing-hero__grid grid items-stretch gap-6 lg:grid-cols-2"
        variant="transparent"
      >
        <Surface className="landing-hero__media" variant="transparent">
          <LandingImageGallery
            alt={hero.galleryAlt}
            autoplayMs={2400}
            images={landingHeroImages}
            nextLabel={events.nextPhoto}
            previousLabel={events.previousPhoto}
          />
        </Surface>

        <Card className="landing-offer">
          <Card.Content className="landing-offer__body">
            <Surface className="landing-offer__deposit" variant="transparent">
              <Paragraph className="landing-offer__deposit-eyebrow">
                {offer.depositEyebrow}
              </Paragraph>
              <Surface className="landing-offer__deposit-row" variant="transparent">
                <Heading className="landing-offer__deposit-amount" level={2}>
                  {offer.depositAmount}
                </Heading>
                <Paragraph className="landing-offer__deposit-today">{offer.depositToday}</Paragraph>
              </Surface>
              <Paragraph className="landing-offer__deposit-sub">{offer.depositSub}</Paragraph>
              <Paragraph className="landing-offer__deposit-after">{offer.depositAfter}</Paragraph>
            </Surface>

            <Surface className="landing-offer__perks" variant="transparent">
              <LandingPerkRow perk={offer.basePerk} />
              <Surface className="landing-offer__group" variant="transparent">
                <Paragraph className="landing-offer__group-label">{offer.perkGroupLabel}</Paragraph>
              </Surface>
              <Surface className="landing-offer__founding" variant="transparent">
                {offer.foundingPerks.map((perk) => (
                  <LandingPerkRow key={perk.title} perk={perk} />
                ))}
              </Surface>
            </Surface>

            <Surface className="landing-offer__actions" variant="transparent">
              <Link
                className="button button--primary button--lg button--full-width"
                href={signupHref}
              >
                {offer.cta}
              </Link>
              <Paragraph className="landing-offer__cancel">{offer.cancel}</Paragraph>
            </Surface>
          </Card.Content>
        </Card>
      </Surface>
    </Surface>
  );
}
