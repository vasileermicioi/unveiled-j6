import { Chip, Header, Link, Paragraph, Surface } from "@heroui/react";
import AppNavbarMenu from "../islands/AppNavbarMenu";
import AuthLogoutButton from "../islands/AuthLogoutButton";
import { getAdminCopy } from "../lib/admin-content";
import type { AppSession } from "../lib/auth";
import { getCopy, NAV_ITEMS, NAV_SEGMENTS } from "../lib/copy";
import type { Locale } from "../lib/locale";
import {
  isActiveNavPath,
  isAuthPage,
  isLocaleRoot,
  localizedPath,
  switchLocalePath,
} from "../lib/locale";
import { Logo } from "./Logo";
import { NavLink } from "./NavLink";

type AppNavbarProps = {
  locale: Locale;
  pathname: string;
  session: AppSession | null;
};

export function AppNavbar({ locale, pathname, session }: AppNavbarProps) {
  const copy = getCopy(locale);
  const adminCopy = getAdminCopy(locale);
  const showGuestAuthActions = !session && !isAuthPage(pathname);
  const showCta = showGuestAuthActions && !isLocaleRoot(pathname);
  const loginHref = localizedPath(locale, "login");
  const signupHref = localizedPath(locale, "signup");
  const adminHref = localizedPath(locale, "admin");
  const creditsLabel = session ? copy.formatCredits(session.user.credits) : undefined;
  const isAdmin = session?.user.role === "ADMIN";

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

          {session ? (
            <>
              {isAdmin ? (
                <Link
                  className="button button--secondary button--md hidden sm:inline-flex"
                  href={adminHref}
                >
                  {adminCopy.navDashboard}
                </Link>
              ) : null}
              {creditsLabel ? (
                <Chip className="hidden sm:inline-flex" variant="tertiary">
                  <Chip.Label>{creditsLabel}</Chip.Label>
                </Chip>
              ) : null}
              <AuthLogoutButton
                className="button button--secondary button--md hidden sm:inline-flex"
                label={copy.logout}
              />
            </>
          ) : showGuestAuthActions ? (
            <>
              <Link
                className="button button--secondary button--md hidden sm:inline-flex"
                href={loginHref}
              >
                {copy.login}
              </Link>
              <Link
                className="button button--primary button--md hidden sm:inline-flex"
                href={signupHref}
              >
                {copy.signup}
              </Link>
              {showCta ? (
                <Link
                  className="button button--primary button--md hidden sm:inline-flex"
                  href={localizedPath(locale, "membership")}
                >
                  {copy.guestCta}
                </Link>
              ) : null}
            </>
          ) : null}

          <AppNavbarMenu
            adminHref={isAdmin ? adminHref : undefined}
            adminLabel={isAdmin ? adminCopy.navDashboard : undefined}
            creditsLabel={creditsLabel}
            ctaHref={localizedPath(locale, "membership")}
            ctaLabel={copy.guestCta}
            isAuthenticated={Boolean(session)}
            loginHref={loginHref}
            loginLabel={copy.login}
            logoutLabel={session ? copy.logout : undefined}
            navLinks={navLinks}
            showCta={showCta}
            showGuestAuthActions={showGuestAuthActions}
            signupHref={signupHref}
            signupLabel={copy.signup}
          />
        </Surface>
      </Surface>
    </Header>
  );
}
