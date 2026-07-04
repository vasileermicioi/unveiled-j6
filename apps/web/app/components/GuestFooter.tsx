import { Link } from "@heroui/react";

import { getCopy } from "../lib/copy";
import type { Locale } from "../lib/locale";
import { localizedPath } from "../lib/locale";

type GuestFooterProps = {
  locale: Locale;
};

const footerLinkClass =
  "block font-bold uppercase text-foreground underline-offset-4 hover:underline";

export function GuestFooter({ locale }: GuestFooterProps) {
  const copy = getCopy(locale).footer;

  return (
    <footer className="mt-auto border-brand-dark border-t-4 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 md:p-12 lg:flex-row lg:justify-between lg:gap-16">
        <div className="max-w-xl flex-1">
          <p className="text-muted text-xs uppercase tracking-[0.2em]">{copy.brandEyebrow}</p>
          <h2 className="mt-3 font-black text-foreground text-xl uppercase tracking-[-0.05em] md:text-2xl">
            {copy.tagline}
          </h2>
          <p className="mt-4 max-w-lg font-medium text-muted text-sm uppercase leading-relaxed">
            {copy.body}
          </p>
        </div>

        <div className="flex flex-col gap-10 sm:flex-row sm:gap-12 lg:gap-8">
          <div>
            <p className="text-muted text-xs uppercase tracking-[0.2em]">
              {copy.navigationEyebrow}
            </p>
            <nav className="mt-4 flex flex-col gap-3">
              <Link className={footerLinkClass} href={localizedPath(locale, "discover")}>
                {copy.nav.discover}
              </Link>
              <Link className={footerLinkClass} href={localizedPath(locale, "how-it-works")}>
                {copy.nav.howItWorks}
              </Link>
              <Link className={footerLinkClass} href={localizedPath(locale, "membership")}>
                {copy.nav.membership}
              </Link>
              <Link className={footerLinkClass} href={localizedPath(locale, "faq")}>
                {copy.nav.faq}
              </Link>
            </nav>
          </div>

          <div>
            <p className="text-muted text-xs uppercase tracking-[0.2em]">{copy.legalEyebrow}</p>
            <nav className="mt-4 flex flex-col gap-3">
              <Link className={footerLinkClass} href={localizedPath(locale, "impressum")}>
                {copy.legal.impressum}
              </Link>
              <Link className={footerLinkClass} href={localizedPath(locale, "privacy")}>
                {copy.legal.privacy}
              </Link>
              <Link className={footerLinkClass} href={localizedPath(locale, "terms")}>
                {copy.legal.terms}
              </Link>
            </nav>
          </div>

          <div>
            <p className="text-muted text-xs uppercase tracking-[0.2em]">{copy.contactEyebrow}</p>
            <div className="mt-4 flex flex-col gap-3">
              <Link className={footerLinkClass} href="mailto:support@unveiled.berlin">
                SUPPORT@UNVEILED.BERLIN
              </Link>
              <p className="text-muted text-xs uppercase tracking-[0.15em]">{copy.location}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
