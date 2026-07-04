import { Card, Chip, Heading, Link, Paragraph, Separator, Surface } from "@heroui/react";
import type { LandingContent } from "../../lib/content/types";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import { Logo } from "../Logo";

type LandingPageProps = {
  locale: Locale;
  landing: LandingContent;
};

export function LandingPage({ locale, landing }: LandingPageProps) {
  return (
    <Surface className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" variant="transparent">
      <Surface
        className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center"
        variant="transparent"
      >
        <Surface
          className="flex w-full flex-col items-center gap-6 text-center"
          variant="transparent"
        >
          <Surface className="flex flex-col items-center gap-2" variant="transparent">
            <Heading className="sr-only" level={1}>
              {landing.headline}
            </Heading>
            <Logo className="text-4xl md:text-5xl lg:text-6xl" tone="black" />
          </Surface>
          <Paragraph className="max-w-2xl" color="muted">
            {landing.subheadline}
          </Paragraph>
          <Surface
            className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center"
            variant="transparent"
          >
            <Link
              className="button button--secondary button--md"
              href={localizedPath(locale, "discover")}
            >
              {landing.ctaDiscover}
            </Link>
            <Link
              className="button button--secondary button--md"
              href={localizedPath(locale, "how-it-works")}
            >
              {landing.ctaHowItWorks}
            </Link>
          </Surface>
          <Paragraph color="muted" size="sm">
            {landing.trustMicrocopy}
          </Paragraph>
        </Surface>

        <Card className="w-full max-w-lg text-left">
          <Card.Content className="flex flex-col gap-3">
            <Link
              className="button button--primary button--md button--full-width"
              href={localizedPath(locale, "signup")}
            >
              {landing.conversionCard.signupCta}
            </Link>
            <Link
              className="button button--secondary button--md button--full-width"
              href={localizedPath(locale, "login")}
            >
              {landing.conversionCard.loginCta}
            </Link>
          </Card.Content>
          <Separator />
          <Card.Footer className="flex flex-wrap justify-center gap-4">
            {landing.trustBadges.map((badge) => (
              <Chip key={badge} variant="tertiary">
                <Chip.Label>{badge}</Chip.Label>
              </Chip>
            ))}
          </Card.Footer>
        </Card>
      </Surface>
    </Surface>
  );
}
