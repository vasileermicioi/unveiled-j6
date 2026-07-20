import { Card, Heading, Link, Paragraph, Surface } from "@heroui/react";
import { Check, Coins, Hourglass, Users } from "lucide-react";

import type { LandingContent } from "../../lib/content/types";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

type LandingPageProps = {
  locale: Locale;
  landing: LandingContent;
};

const BENEFIT_ICONS = [Hourglass, Coins, Users] as const;

export function LandingPage({ locale, landing }: LandingPageProps) {
  const signupHref = localizedPath(locale, "signup");

  return (
    <Surface
      className="guest-home mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      variant="transparent"
    >
      <Surface
        className="guest-home__hero mx-auto flex max-w-4xl flex-col gap-4 text-center"
        variant="transparent"
      >
        <Heading className="guest-home__headline" level={1}>
          {landing.headline}
        </Heading>
        <Paragraph className="guest-home__subheadline mx-auto max-w-3xl">
          {landing.subheadline}
        </Paragraph>
      </Surface>

      <Surface
        className="guest-home__showcase mt-10 grid items-center gap-8 lg:mt-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12"
        variant="transparent"
      >
        <Surface
          className="guest-home__phone mx-auto w-full max-w-xs lg:max-w-sm"
          variant="transparent"
        >
          <img
            alt={landing.phoneAlt}
            className="guest-home__phone-image h-auto w-full"
            height={841}
            src="/images/guest-home-phone.png"
            width={426}
          />
        </Surface>

        <Card className="guest-home__plan">
          <Card.Content className="guest-home__plan-body flex flex-col gap-6">
            <Heading className="guest-home__price" level={2}>
              {landing.plan.price}
            </Heading>
            <Surface className="guest-home__perks flex flex-col gap-3" variant="transparent">
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

      <Card className="guest-home__benefits mt-10 lg:mt-14">
        <Card.Content className="guest-home__benefits-grid grid gap-8 md:grid-cols-3 md:gap-6">
          {landing.benefits.map((benefit, index) => {
            const Icon = BENEFIT_ICONS[index] ?? Hourglass;
            return (
              <Surface
                className="guest-home__benefit flex flex-col gap-3"
                key={benefit.title}
                variant="transparent"
              >
                <Surface className="guest-home__benefit-icon" variant="transparent">
                  <Icon aria-hidden size={20} strokeWidth={2.25} />
                </Surface>
                <Heading className="guest-home__benefit-title" level={3}>
                  {benefit.title}
                </Heading>
                <Paragraph className="guest-home__benefit-body" color="muted" size="sm">
                  {benefit.body}
                </Paragraph>
              </Surface>
            );
          })}
        </Card.Content>
      </Card>
    </Surface>
  );
}
