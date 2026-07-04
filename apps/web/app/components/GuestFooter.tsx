import { Heading, Link, Paragraph, Surface } from "@heroui/react";

import { getCopy } from "../lib/copy";
import type { Locale } from "../lib/locale";
import { localizedPath } from "../lib/locale";
import { Logo } from "./Logo";

type GuestFooterProps = {
  locale: Locale;
};

export function GuestFooter({ locale }: GuestFooterProps) {
  const copy = getCopy(locale).footer;

  return (
    <Surface className="site-footer" role="contentinfo" variant="transparent">
      <Surface
        className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 md:p-12 lg:flex-row lg:justify-between lg:gap-16"
        variant="transparent"
      >
        <Surface className="max-w-xl flex-1" variant="transparent">
          <Logo className="text-xl md:text-2xl" tone="black" />
          <Heading className="mt-3 text-xl md:text-2xl" level={2}>
            {copy.tagline}
          </Heading>
          <Paragraph
            className="mt-4 max-w-lg font-medium uppercase leading-relaxed"
            color="muted"
            size="sm"
          >
            {copy.body}
          </Paragraph>
        </Surface>

        <Surface
          className="flex flex-col gap-10 sm:flex-row sm:gap-12 lg:gap-8"
          variant="transparent"
        >
          <Surface variant="transparent">
            <Paragraph className="uppercase tracking-[0.2em]" color="muted" size="xs">
              {copy.navigationEyebrow}
            </Paragraph>
            <Surface className="mt-4 flex flex-col gap-3" role="navigation" variant="transparent">
              <Link className="footer-link" href={localizedPath(locale, "discover")}>
                {copy.nav.discover}
              </Link>
              <Link className="footer-link" href={localizedPath(locale, "how-it-works")}>
                {copy.nav.howItWorks}
              </Link>
              <Link className="footer-link" href={localizedPath(locale, "membership")}>
                {copy.nav.membership}
              </Link>
              <Link className="footer-link" href={localizedPath(locale, "faq")}>
                {copy.nav.faq}
              </Link>
            </Surface>
          </Surface>

          <Surface variant="transparent">
            <Paragraph className="uppercase tracking-[0.2em]" color="muted" size="xs">
              {copy.legalEyebrow}
            </Paragraph>
            <Surface className="mt-4 flex flex-col gap-3" role="navigation" variant="transparent">
              <Link className="footer-link" href={localizedPath(locale, "impressum")}>
                {copy.legal.impressum}
              </Link>
              <Link className="footer-link" href={localizedPath(locale, "privacy")}>
                {copy.legal.privacy}
              </Link>
              <Link className="footer-link" href={localizedPath(locale, "terms")}>
                {copy.legal.terms}
              </Link>
            </Surface>
          </Surface>

          <Surface variant="transparent">
            <Paragraph className="uppercase tracking-[0.2em]" color="muted" size="xs">
              {copy.contactEyebrow}
            </Paragraph>
            <Surface className="mt-4 flex flex-col gap-3" variant="transparent">
              <Link className="footer-link" href="mailto:support@unveiled.berlin">
                SUPPORT@UNVEILED.BERLIN
              </Link>
              <Paragraph className="uppercase tracking-[0.15em]" color="muted" size="xs">
                {copy.location}
              </Paragraph>
            </Surface>
          </Surface>
        </Surface>
      </Surface>
    </Surface>
  );
}
