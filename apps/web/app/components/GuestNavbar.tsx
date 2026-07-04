import { Header, Link, Paragraph, Surface } from "@heroui/react";

import GuestNavbarMenu from "../islands/GuestNavbarMenu";
import { getCopy, NAV_ITEMS, NAV_SEGMENTS } from "../lib/copy";
import type { Locale } from "../lib/locale";
import { isActiveNavPath, isLocaleRoot, localizedPath, switchLocalePath } from "../lib/locale";
import { Logo } from "./Logo";
import { NavLink } from "./NavLink";

type GuestNavbarProps = {
  locale: Locale;
  pathname: string;
};

export function GuestNavbar({ locale, pathname }: GuestNavbarProps) {
  const copy = getCopy(locale);
  const showCta = !isLocaleRoot(pathname);

  const navLinks = NAV_ITEMS.map((key) => {
    const href = localizedPath(locale, NAV_SEGMENTS[key]);
    return {
      href,
      label: copy.nav[key],
      isActive: isActiveNavPath(pathname, href),
    };
  });

  return (
    <Header className="site-header">
      <Surface
        className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
        variant="transparent"
      >
        <Surface className="min-w-0" variant="transparent">
          <Link
            className="inline-flex items-center text-2xl md:text-3xl"
            href={localizedPath(locale, "")}
          >
            <Logo className="text-2xl md:text-3xl" tone="black" />
          </Link>
          <Paragraph className="mt-1 hidden uppercase lg:block" color="muted" size="xs">
            {copy.headerTagline}
          </Paragraph>
        </Surface>

        <Surface
          aria-label="Primary"
          className="hidden items-center gap-1 lg:flex"
          role="navigation"
          variant="transparent"
        >
          {navLinks.map((link) => (
            <NavLink href={link.href} isActive={link.isActive} key={link.href} label={link.label} />
          ))}
        </Surface>

        <Surface className="flex shrink-0 items-center gap-2" variant="transparent">
          <Surface aria-label="Language" className="lang-toggle" role="group" variant="transparent">
            <Link
              aria-current={locale === "de" ? "true" : undefined}
              className="lang-toggle__option"
              href={switchLocalePath(pathname, "de")}
            >
              DE
            </Link>
            <Link
              aria-current={locale === "en" ? "true" : undefined}
              className="lang-toggle__option"
              href={switchLocalePath(pathname, "en")}
            >
              EN
            </Link>
          </Surface>

          {showCta ? (
            <Link
              className="button button--primary button--md hidden sm:inline-flex"
              href={localizedPath(locale, "membership")}
            >
              {copy.guestCta}
            </Link>
          ) : null}

          <GuestNavbarMenu
            ctaHref={localizedPath(locale, "membership")}
            ctaLabel={copy.guestCta}
            navLinks={navLinks}
            showCta={showCta}
          />
        </Surface>
      </Surface>
    </Header>
  );
}
