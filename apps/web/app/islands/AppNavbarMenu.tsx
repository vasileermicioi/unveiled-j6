import { Button, Chip, Drawer, Link, Surface, useOverlayState } from "@heroui/react";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { NavLink } from "../components/NavLink";
import AuthLogoutButton from "./AuthLogoutButton";

export type MobileNavLink = {
  href: string;
  label: string;
  isActive: boolean;
};

type AppNavbarMenuProps = {
  navLinks: MobileNavLink[];
  isAuthenticated: boolean;
  adminHref?: string;
  adminLabel?: string;
  showGuestAuthActions: boolean;
  loginHref: string;
  loginLabel: string;
  signupHref: string;
  signupLabel: string;
  creditsLabel?: string;
  logoutLabel?: string;
  savedHref?: string;
  savedLabel?: string;
  savedCount?: number;
  savedIsActive?: boolean;
  bookingsHref?: string;
  bookingsLabel?: string;
  bookingsIsActive?: boolean;
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

export default function AppNavbarMenu({
  navLinks,
  isAuthenticated,
  adminHref,
  adminLabel,
  showGuestAuthActions,
  loginHref,
  loginLabel,
  signupHref,
  signupLabel,
  creditsLabel,
  logoutLabel,
  savedHref,
  savedLabel,
  savedCount = 0,
  savedIsActive = false,
  bookingsHref,
  bookingsLabel,
  bookingsIsActive = false,
}: AppNavbarMenuProps) {
  const [mounted, setMounted] = useState(false);
  const drawerState = useOverlayState();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <MenuTriggerFallback />;
  }

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

            <Drawer.Body className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <NavLink
                  className="w-full justify-start"
                  href={link.href}
                  isActive={link.isActive}
                  key={link.href}
                  label={link.label}
                />
              ))}

              {bookingsHref && bookingsLabel ? (
                <Link
                  aria-current={bookingsIsActive ? "page" : undefined}
                  className="button button--secondary button--md button--full-width"
                  href={bookingsHref}
                >
                  {bookingsLabel}
                </Link>
              ) : null}

              {savedHref && savedLabel ? (
                <Link
                  aria-current={savedIsActive ? "page" : undefined}
                  className="button button--secondary button--md button--full-width inline-flex items-center justify-between gap-2"
                  href={savedHref}
                >
                  <Surface className="inline" variant="transparent">
                    {savedLabel}
                  </Surface>
                  {savedCount > 0 ? (
                    <Chip size="sm" variant="primary">
                      <Chip.Label>{savedCount}</Chip.Label>
                    </Chip>
                  ) : null}
                </Link>
              ) : null}

              {isAuthenticated ? (
                <Surface className="mt-4 flex flex-col gap-3" variant="transparent">
                  {adminHref && adminLabel ? (
                    <Link
                      className="button button--secondary button--md button--full-width"
                      href={adminHref}
                    >
                      {adminLabel}
                    </Link>
                  ) : null}
                  {creditsLabel ? (
                    <Chip variant="tertiary">
                      <Chip.Label>{creditsLabel}</Chip.Label>
                    </Chip>
                  ) : null}
                  {logoutLabel ? (
                    <AuthLogoutButton
                      className="button button--secondary button--md button--full-width"
                      label={logoutLabel}
                    />
                  ) : null}
                </Surface>
              ) : showGuestAuthActions ? (
                <Surface className="mt-4 flex flex-col gap-2" variant="transparent">
                  <Link
                    className="button button--secondary button--md button--full-width"
                    href={loginHref}
                  >
                    {loginLabel}
                  </Link>
                  <Link
                    className="button button--primary button--md button--full-width"
                    href={signupHref}
                  >
                    {signupLabel}
                  </Link>
                </Surface>
              ) : null}
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
