import { Chip, Header, Link, Paragraph, Surface } from "@heroui/react";
import { Logo } from "@unveiled/ui";
import { Bookmark } from "lucide-react";
import AppNavbarMenu from "../islands/AppNavbarMenu";
import AuthLogoutButton from "../islands/AuthLogoutButton";
import { getAdminCopy } from "../lib/admin-content";
import type { AppSession } from "../lib/auth";
import { getCopy, NAV_ITEMS, NAV_SEGMENTS } from "../lib/copy";
import type { Locale } from "../lib/locale";
import { isActiveNavPath, isAuthPage, localizedPath, switchLocalePath } from "../lib/locale";
import { NavLink } from "./NavLink";

type AppNavbarProps = {
  locale: Locale;
  pathname: string;
  session: AppSession | null;
  /** Live saved-events count for USER badge; omit or 0 hides the badge. */
  savedCount?: number;
};

export function AppNavbar({ locale, pathname, session, savedCount = 0 }: AppNavbarProps) {
  const copy = getCopy(locale);
  const adminCopy = getAdminCopy(locale);
  const showGuestAuthActions = !session && !isAuthPage(pathname);
  const loginHref = localizedPath(locale, "login");
  const signupHref = localizedPath(locale, "signup");
  const adminHref = localizedPath(locale, "admin");
  const savedHref = localizedPath(locale, "saved");
  const bookingsHref = localizedPath(locale, "bookings");
  const isAdmin = session?.user.role === "ADMIN";
  const isUser = session?.user.role === "USER";
  // Credits are a member (USER) concept — hide for ADMIN / PARTNER.
  const creditsLabel = isUser ? copy.formatCredits(session.user.credits) : undefined;
  const showSavedNav = isUser;
  const showBookingsNav = isUser;
  const savedIsActive = isActiveNavPath(pathname, savedHref);
  const bookingsIsActive = isActiveNavPath(pathname, bookingsHref);

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
          {showBookingsNav ? (
            <Link
              aria-current={bookingsIsActive ? "page" : undefined}
              aria-label={copy.myBookings}
              className="button button--secondary button--md hidden sm:inline-flex"
              href={bookingsHref}
            >
              {copy.myBookings}
            </Link>
          ) : null}

          {showSavedNav ? (
            <Link
              aria-current={savedIsActive ? "page" : undefined}
              aria-label={savedCount > 0 ? `${copy.mySaves}, ${savedCount}` : copy.mySaves}
              className="button button--secondary button--md hidden items-center gap-2 sm:inline-flex"
              href={savedHref}
            >
              <Bookmark aria-hidden size={18} strokeWidth={2.25} />
              <Paragraph className="hidden lg:inline" size="sm">
                {copy.mySaves}
              </Paragraph>
              {savedCount > 0 ? (
                <Chip className="site-nav-saved-badge" size="sm" variant="primary">
                  <Chip.Label>{savedCount}</Chip.Label>
                </Chip>
              ) : null}
            </Link>
          ) : null}

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
            </>
          ) : null}

          <AppNavbarMenu
            adminHref={isAdmin ? adminHref : undefined}
            adminLabel={isAdmin ? adminCopy.navDashboard : undefined}
            creditsLabel={creditsLabel}
            isAuthenticated={Boolean(session)}
            loginHref={loginHref}
            loginLabel={copy.login}
            logoutLabel={session ? copy.logout : undefined}
            navLinks={navLinks}
            bookingsHref={showBookingsNav ? bookingsHref : undefined}
            bookingsIsActive={showBookingsNav ? bookingsIsActive : undefined}
            bookingsLabel={showBookingsNav ? copy.myBookings : undefined}
            savedCount={showSavedNav ? savedCount : undefined}
            savedHref={showSavedNav ? savedHref : undefined}
            savedIsActive={showSavedNav ? savedIsActive : undefined}
            savedLabel={showSavedNav ? copy.mySaves : undefined}
            showGuestAuthActions={showGuestAuthActions}
            signupHref={signupHref}
            signupLabel={copy.signup}
          />
        </Surface>
      </Surface>
    </Header>
  );
}
