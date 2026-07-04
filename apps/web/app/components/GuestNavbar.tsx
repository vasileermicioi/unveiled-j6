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
    <header className="fixed top-0 right-0 left-0 z-50 h-16 border-brand-dark border-b-4 bg-white md:h-20">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <a
            className="inline-flex items-center text-2xl md:text-3xl"
            href={localizedPath(locale, "")}
          >
            <Logo className="text-2xl md:text-3xl" tone="black" />
          </a>
          <p className="mt-1 hidden text-muted text-xs uppercase lg:block">{copy.headerTagline}</p>
        </div>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <NavLink href={link.href} isActive={link.isActive} key={link.href} label={link.label} />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <fieldset className="inline-flex overflow-hidden rounded-full border-2 border-brand-dark bg-white p-0">
            <legend className="sr-only">Language</legend>
            <a
              aria-current={locale === "de" ? "true" : undefined}
              className={`px-3 py-1.5 font-bold text-sm uppercase transition-colors ${
                locale === "de"
                  ? "bg-brand-dark text-brand-yellow"
                  : "bg-white text-muted hover:text-foreground"
              }`}
              href={switchLocalePath(pathname, "de")}
            >
              DE
            </a>
            <a
              aria-current={locale === "en" ? "true" : undefined}
              className={`border-brand-dark border-l-2 px-3 py-1.5 font-bold text-sm uppercase transition-colors ${
                locale === "en"
                  ? "bg-brand-dark text-brand-yellow"
                  : "bg-white text-muted hover:text-foreground"
              }`}
              href={switchLocalePath(pathname, "en")}
            >
              EN
            </a>
          </fieldset>

          {showCta ? (
            <a
              className="button--primary hidden items-center border-2 border-brand-dark bg-accent px-4 py-2 font-semibold text-foreground text-sm uppercase sm:inline-flex"
              href={localizedPath(locale, "membership")}
            >
              {copy.guestCta}
            </a>
          ) : null}

          <GuestNavbarMenu
            ctaHref={localizedPath(locale, "membership")}
            ctaLabel={copy.guestCta}
            navLinks={navLinks}
            showCta={showCta}
          />
        </div>
      </div>
    </header>
  );
}
