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
  const adminHref = localizedPath(locale, "admin");
  const eventsHref = localizedPath(locale, "events");
  const discoverHref = localizedPath(locale, "");
  const savedHref = localizedPath(locale, "saved");
  const bookingsHref = localizedPath(locale, "bookings");
  const profileHref = localizedPath(locale, "profile");
  const isAdmin = session?.user.role === "ADMIN";
  const isUser = session?.user.role === "USER";
  // Credits are a member (USER) concept — hide for ADMIN / PARTNER.
  const creditsLabel = isUser ? copy.formatCredits(session.user.credits) : undefined;
  const showSavedNav = isUser;
  const showBookingsNav = isUser;
  const showProfileNav = isUser;
  const savedIsActive = isActiveNavPath(pathname, savedHref);
  const bookingsIsActive = isActiveNavPath(pathname, bookingsHref);
  const profileIsActive = pathname === profileHref || pathname.startsWith(`${profileHref}/`);
  const logoHref = isAdmin ? adminHref : isUser ? eventsHref : discoverHref;

  const navLinks = NAV_ITEMS.map((key) => {
    const href = localizedPath(locale, NAV_SEGMENTS[key]);
    return {
      key,
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
          <Link className="inline-flex items-center text-2xl md:text-3xl" href={logoHref}>
            <Logo className="text-2xl md:text-3xl" tone="black" />
          </Link>
        </Surface>

        <Surface
          aria-label="Primary"
          className="hidden items-center gap-1 lg:flex"
          role="navigation"
          variant="transparent"
        >
          {navLinks.map((link) => (
            <NavLink
              href={link.href}
              isActive={link.isActive}
              key={link.href}
              label={link.label}
            />
          ))}
        </Surface>

        <Surface className="flex shrink-0 items-center gap-2" variant="transparent">
          {/* Desktop-only chrome — below `lg`, only logo + hamburger remain in the bar */}
          {showBookingsNav ? (
            <Link
              aria-current={bookingsIsActive ? "page" : undefined}
              aria-label={copy.myBookings}
              className="button button--secondary button--md hidden lg:inline-flex"
              href={bookingsHref}
            >
              {copy.myBookings}
            </Link>
          ) : null}

          {showSavedNav ? (
            <Link
              aria-current={savedIsActive ? "page" : undefined}
              aria-label={savedCount > 0 ? `${copy.mySaves}, ${savedCount}` : copy.mySaves}
              className="button button--secondary button--md hidden items-center gap-2 lg:inline-flex"
              href={savedHref}
            >
              <Bookmark aria-hidden size={18} strokeWidth={2.25} />
              <Paragraph size="sm">{copy.mySaves}</Paragraph>
              {savedCount > 0 ? (
                <Chip className="site-nav-saved-badge" size="sm" variant="primary">
                  <Chip.Label>{savedCount}</Chip.Label>
                </Chip>
              ) : null}
            </Link>
          ) : null}

          <Surface
            aria-label="Language"
            className="lang-toggle hidden lg:inline-flex"
            role="group"
            variant="transparent"
          >
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
                  className="button button--secondary button--md hidden lg:inline-flex"
                  href={adminHref}
                >
                  {adminCopy.navDashboard}
                </Link>
              ) : null}
              {creditsLabel ? (
                <Chip className="hidden lg:inline-flex" variant="tertiary">
                  <Chip.Label>{creditsLabel}</Chip.Label>
                </Chip>
              ) : null}
              {showProfileNav ? (
                <Link
                  aria-current={profileIsActive ? "page" : undefined}
                  aria-label={copy.profile}
                  className="button button--secondary button--md hidden lg:inline-flex"
                  href={profileHref}
                >
                  {copy.profile}
                </Link>
              ) : null}
              <AuthLogoutButton
                className="button button--secondary button--md hidden lg:inline-flex"
                label={copy.logout}
              />
            </>
          ) : showGuestAuthActions ? (
            <Link
              className="button button--secondary button--md hidden lg:inline-flex"
              href={loginHref}
            >
              {copy.login}
            </Link>
          ) : null}

          <AppNavbarMenu
            adminHref={isAdmin ? adminHref : undefined}
            adminLabel={isAdmin ? adminCopy.navDashboard : undefined}
            bookingsHref={showBookingsNav ? bookingsHref : undefined}
            bookingsIsActive={showBookingsNav ? bookingsIsActive : undefined}
            bookingsLabel={showBookingsNav ? copy.myBookings : undefined}
            creditsLabel={creditsLabel}
            isAuthenticated={Boolean(session)}
            locale={locale}
            localeDeHref={switchLocalePath(pathname, "de")}
            localeEnHref={switchLocalePath(pathname, "en")}
            loginHref={loginHref}
            loginLabel={copy.login}
            logoutLabel={session ? copy.logout : undefined}
            navLinks={navLinks}
            profileHref={showProfileNav ? profileHref : undefined}
            profileIsActive={showProfileNav ? profileIsActive : undefined}
            profileLabel={showProfileNav ? copy.profile : undefined}
            savedCount={showSavedNav ? savedCount : undefined}
            savedHref={showSavedNav ? savedHref : undefined}
            savedIsActive={showSavedNav ? savedIsActive : undefined}
            savedLabel={showSavedNav ? copy.mySaves : undefined}
            sections={copy.drawer}
            showGuestAuthActions={showGuestAuthActions}
          />
        </Surface>
      </Surface>
    </Header>
  );
}
