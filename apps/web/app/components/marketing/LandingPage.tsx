import { Card, Heading, Link, Paragraph, Surface } from "@heroui/react";
import { Check, Hourglass, Link2, Users } from "lucide-react";

import type { LandingContent } from "../../lib/content/types";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

type LandingPageProps = {
  locale: Locale;
  landing: LandingContent;
};

const BENEFIT_ICONS = [Hourglass, Link2, Users] as const;

export function LandingPage({ locale, landing }: LandingPageProps) {
  const signupHref = localizedPath(locale, "signup");

  return (
    <Surface
      className="guest-home mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6"
      variant="transparent"
    >
      <Surface
        className="guest-home__hero flex w-full flex-col gap-2 text-left"
        variant="transparent"
      >
        <Heading className="guest-home__headline" level={1}>
          {landing.headline}
        </Heading>
        <Paragraph className="guest-home__subheadline">{landing.subheadline}</Paragraph>
      </Surface>

      <Surface
        className="guest-home__showcase mt-5 grid gap-5 lg:mt-6 lg:grid-cols-2 lg:items-stretch lg:gap-6"
        variant="transparent"
      >
        <Surface className="guest-home__phone" variant="transparent">
          <img
            alt={landing.phoneAlt}
            className="guest-home__phone-image"
            src="/images/guest-home-phone.png"
          />
        </Surface>

        <Card className="guest-home__plan">
          <Card.Content className="guest-home__plan-body">
            <Surface
              className="guest-home__price-block flex flex-wrap items-baseline gap-x-3 gap-y-1"
              variant="transparent"
            >
              <Heading className="guest-home__price-amount" level={2}>
                {landing.plan.priceAmount}
              </Heading>
              <Paragraph className="guest-home__price-period">{landing.plan.pricePeriod}</Paragraph>
            </Surface>
            <Surface className="guest-home__perks flex flex-col gap-2.5" variant="transparent">
              {landing.plan.perks.map((perk) => (
                <Surface
                  className="guest-home__perk flex items-start gap-3"
                  key={perk}
                  variant="transparent"
                >
                  <Surface className="guest-home__perk-icon" variant="transparent">
                    <Check aria-hidden size={18} strokeWidth={3} />
                  </Surface>
                  <Paragraph className="guest-home__perk-text">{perk}</Paragraph>
                </Surface>
              ))}
            </Surface>
            <Surface
              className="guest-home__cta-panel flex flex-col items-stretch"
              variant="transparent"
            >
              <Link
                className="button button--primary button--lg button--full-width"
                href={signupHref}
              >
                {landing.plan.cta}
              </Link>
            </Surface>
          </Card.Content>
        </Card>
      </Surface>

      <Card className="guest-home__benefits mt-5 lg:mt-6">
        <Card.Content className="guest-home__benefits-list flex flex-col gap-3.5">
          {landing.benefits.map((benefit, index) => {
            const Icon = BENEFIT_ICONS[index] ?? Hourglass;
            return (
              <Surface
                className="guest-home__benefit flex items-center gap-3"
                key={benefit.title}
                variant="transparent"
              >
                <Surface className="guest-home__benefit-icon" variant="transparent">
                  <Icon aria-hidden size={18} strokeWidth={2.25} />
                </Surface>
                <Surface
                  className="guest-home__benefit-copy min-w-0 flex flex-col gap-0.5"
                  variant="transparent"
                >
                  <Heading className="guest-home__benefit-title" level={3}>
                    {benefit.title}
                  </Heading>
                  <Paragraph className="guest-home__benefit-body">{benefit.body}</Paragraph>
                </Surface>
              </Surface>
            );
          })}
        </Card.Content>
      </Card>
    </Surface>
  );
}
