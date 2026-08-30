import { Heading, Link, Paragraph, Surface } from "@heroui/react";

import type { LandingContent } from "../../../lib/content/types";
import type { Locale } from "../../../lib/locale";
import { localizedPath } from "../../../lib/locale";

type LandingFinalCtaProps = {
  locale: Locale;
  content: LandingContent["finalCta"];
};

export function LandingFinalCta({ locale, content }: LandingFinalCtaProps) {
  return (
    <Surface className="landing-band landing-band--inverted" variant="transparent">
      <Surface
        className="landing-final mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20"
        variant="transparent"
      >
        <Heading className="landing-final__headline" level={2}>
          {content.headline}
        </Heading>
        <Paragraph className="landing-final__body">{content.body}</Paragraph>
        <Surface className="landing-final__actions" variant="transparent">
          <Link
            className="button button--primary button--lg"
            href={localizedPath(locale, "signup")}
          >
            {content.cta}
          </Link>
          <Paragraph className="landing-final__cancel">{content.cancel}</Paragraph>
        </Surface>
      </Surface>
    </Surface>
  );
}
