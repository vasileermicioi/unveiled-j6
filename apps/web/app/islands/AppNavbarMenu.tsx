import { Chip, Drawer, Link, Surface, useOverlayState } from "@heroui/react";
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
  ctaHref: string;
  ctaLabel: string;
  showCta: boolean;
  showGuestAuthActions: boolean;
  loginHref: string;
  loginLabel: string;
  signupHref: string;
  signupLabel: string;
  creditsLabel?: string;
  logoutLabel?: string;
};

const menuTriggerClassName = "button button--secondary button--md lg:hidden";

function MenuTriggerFallback() {
  return (
    <button
      aria-label="Open navigation menu"
      className={menuTriggerClassName}
      disabled
      type="button"
    >
      Menu
    </button>
  );
}

export default function AppNavbarMenu({
  navLinks,
  isAuthenticated,
  adminHref,
  adminLabel,
  ctaHref,
  ctaLabel,
  showCta,
  showGuestAuthActions,
  loginHref,
  loginLabel,
  signupHref,
  signupLabel,
  creditsLabel,
  logoutLabel,
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
        Menu
      </Drawer.Trigger>

      <Drawer.Backdrop isDismissable>
        <Drawer.Content className="lg:hidden" placement="right">
          <Drawer.Dialog>
            <Drawer.Header className="mb-4 flex items-center justify-between">
              <Drawer.Heading>Menu</Drawer.Heading>
              <Drawer.CloseTrigger
                aria-label="Close navigation menu"
                className="button button--secondary button--md"
              >
                Close
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
                  {showCta ? (
                    <Link
                      className="button button--primary button--md button--full-width"
                      href={ctaHref}
                    >
                      {ctaLabel}
                    </Link>
                  ) : null}
                </Surface>
              ) : null}
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
