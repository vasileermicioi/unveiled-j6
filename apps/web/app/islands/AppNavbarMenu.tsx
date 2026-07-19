import { Button, Drawer, Link, Paragraph, Surface, useOverlayState } from "@heroui/react";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { Locale } from "../lib/locale";
import AuthLogoutButton from "./AuthLogoutButton";

export type MobileNavLink = {
  href: string;
  label: string;
  isActive: boolean;
};

type DrawerSections = {
  navigation: string;
  language: string;
  account: string;
};

type AppNavbarMenuProps = {
  navLinks: MobileNavLink[];
  isAuthenticated: boolean;
  adminHref?: string;
  adminLabel?: string;
  showGuestAuthActions: boolean;
  loginHref: string;
  loginLabel: string;
  locale: Locale;
  localeDeHref: string;
  localeEnHref: string;
  sections: DrawerSections;
  creditsLabel?: string;
  logoutLabel?: string;
  savedHref?: string;
  savedLabel?: string;
  savedCount?: number;
  savedIsActive?: boolean;
  bookingsHref?: string;
  bookingsLabel?: string;
  bookingsIsActive?: boolean;
  profileHref?: string;
  profileLabel?: string;
  profileIsActive?: boolean;
};

const menuTriggerClassName = "button button--secondary button--md site-nav-icon-button lg:hidden";

function NavMenuIcon() {
  return <Menu aria-hidden className="site-nav-icon-button__icon" size={20} strokeWidth={2.25} />;
}

function NavCloseIcon() {
  return <X aria-hidden className="site-nav-icon-button__icon" size={20} strokeWidth={2.25} />;
}

function MenuTriggerFallback() {
  return (
    <Button
      aria-label="Open navigation menu"
      className={menuTriggerClassName}
      isDisabled
      type="button"
    >
      <NavMenuIcon />
    </Button>
  );
}

function DrawerSectionLabel({ children }: { children: string }) {
  return (
    <Paragraph className="site-nav-drawer__section-label" color="muted" size="xs">
      {children}
    </Paragraph>
  );
}

function DrawerTextLink({
  href,
  label,
  isActive = false,
}: {
  href: string;
  label: string;
  isActive?: boolean;
}) {
  return (
    <Link aria-current={isActive ? "page" : undefined} className="drawer-link" href={href}>
      {label}
    </Link>
  );
}

export default function AppNavbarMenu({
  navLinks,
  isAuthenticated,
  adminHref,
  adminLabel,
  showGuestAuthActions,
  loginHref,
  loginLabel,
  locale,
  localeDeHref,
  localeEnHref,
  sections,
  creditsLabel,
  logoutLabel,
  savedHref,
  savedLabel,
  savedCount = 0,
  savedIsActive = false,
  bookingsHref,
  bookingsLabel,
  bookingsIsActive = false,
  profileHref,
  profileLabel,
  profileIsActive = false,
}: AppNavbarMenuProps) {
  const [mounted, setMounted] = useState(false);
  const drawerState = useOverlayState();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <MenuTriggerFallback />;
  }

  const showAccountSection =
    Boolean(bookingsHref || savedHref || adminHref || profileHref || logoutLabel) ||
    showGuestAuthActions ||
    Boolean(creditsLabel);

  return (
    <Drawer state={drawerState}>
      <Drawer.Trigger aria-label="Open navigation menu" className={menuTriggerClassName}>
        <NavMenuIcon />
      </Drawer.Trigger>

      <Drawer.Backdrop className="site-nav-drawer-backdrop" isDismissable>
        <Drawer.Content
          aria-label="Navigation menu"
          className="site-nav-drawer-content lg:hidden"
          placement="right"
        >
          <Drawer.Dialog className="site-nav-drawer">
            <Drawer.Header className="site-nav-drawer-header mb-4 flex items-center justify-end">
              <Drawer.CloseTrigger
                aria-label="Close navigation menu"
                className="button button--secondary button--md site-nav-icon-button"
              >
                <NavCloseIcon />
              </Drawer.CloseTrigger>
            </Drawer.Header>

            <Drawer.Body className="site-nav-drawer__body">
              {showAccountSection ? (
                <Surface className="site-nav-drawer__section" variant="transparent">
                  <DrawerSectionLabel>{sections.account}</DrawerSectionLabel>

                  {bookingsHref && bookingsLabel ? (
                    <DrawerTextLink
                      href={bookingsHref}
                      isActive={bookingsIsActive}
                      label={bookingsLabel}
                    />
                  ) : null}

                  {savedHref && savedLabel ? (
                    <DrawerTextLink
                      href={savedHref}
                      isActive={savedIsActive}
                      label={savedCount > 0 ? `${savedLabel} (${savedCount})` : savedLabel}
                    />
                  ) : null}

                  {isAuthenticated ? (
                    <>
                      {adminHref && adminLabel ? (
                        <DrawerTextLink href={adminHref} label={adminLabel} />
                      ) : null}
                      {creditsLabel ? (
                        <Paragraph className="drawer-link drawer-link--static" color="muted">
                          {creditsLabel}
                        </Paragraph>
                      ) : null}
                      {profileHref && profileLabel ? (
                        <DrawerTextLink
                          href={profileHref}
                          isActive={profileIsActive}
                          label={profileLabel}
                        />
                      ) : null}
                      {logoutLabel ? (
                        <AuthLogoutButton className="drawer-link" label={logoutLabel} />
                      ) : null}
                    </>
                  ) : showGuestAuthActions ? (
                    <DrawerTextLink href={loginHref} label={loginLabel} />
                  ) : null}
                </Surface>
              ) : null}

              <Surface className="site-nav-drawer__section" variant="transparent">
                <DrawerSectionLabel>{sections.navigation}</DrawerSectionLabel>
                {navLinks.map((link) => (
                  <DrawerTextLink
                    href={link.href}
                    isActive={link.isActive}
                    key={link.href}
                    label={link.label}
                  />
                ))}
              </Surface>

              <Surface className="site-nav-drawer__section" variant="transparent">
                <DrawerSectionLabel>{sections.language}</DrawerSectionLabel>
                <DrawerTextLink href={localeDeHref} isActive={locale === "de"} label="DE" />
                <DrawerTextLink href={localeEnHref} isActive={locale === "en"} label="EN" />
              </Surface>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
