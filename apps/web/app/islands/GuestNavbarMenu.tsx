import { Drawer, Heading, Link, useOverlayState } from "@heroui/react";
import { useEffect, useState } from "react";

import { NavLink } from "../components/NavLink";

export type MobileNavLink = {
  href: string;
  label: string;
  isActive: boolean;
};

type GuestNavbarMenuProps = {
  navLinks: MobileNavLink[];
  ctaHref: string;
  ctaLabel: string;
  showCta: boolean;
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

export default function GuestNavbarMenu({
  navLinks,
  ctaHref,
  ctaLabel,
  showCta,
}: GuestNavbarMenuProps) {
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
              <Drawer.Heading>
                <Heading level={2}>Menu</Heading>
              </Drawer.Heading>
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

              {showCta ? (
                <Link
                  className="button button--primary button--md button--full-width mt-4"
                  href={ctaHref}
                >
                  {ctaLabel}
                </Link>
              ) : null}
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
