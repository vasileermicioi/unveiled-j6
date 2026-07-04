import { Button } from "@heroui/react";
import { useState } from "react";

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

export default function GuestNavbarMenu({
  navLinks,
  ctaHref,
  ctaLabel,
  showCta,
}: GuestNavbarMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        aria-expanded={open}
        aria-label="Open navigation menu"
        className="border-2 border-brand-dark bg-white font-bold text-foreground uppercase lg:hidden"
        onPress={() => setOpen(true)}
        variant="secondary"
      >
        Menu
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-brand-dark/40"
            onClick={() => setOpen(false)}
            type="button"
          />
          <nav className="absolute top-0 right-0 flex h-full w-[min(100%,20rem)] flex-col gap-2 border-brand-dark border-l-4 bg-white p-6 shadow-[-6px_0_0_0_#202621]">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-black text-foreground uppercase tracking-[-0.05em]">Menu</p>
              <Button
                aria-label="Close navigation menu"
                className="border-2 border-brand-dark bg-white font-bold text-foreground uppercase"
                onPress={() => setOpen(false)}
                variant="secondary"
              >
                Close
              </Button>
            </div>

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
              <a
                className="button--primary mt-4 inline-flex items-center justify-center border-2 border-brand-dark bg-accent px-4 py-2 font-semibold text-foreground uppercase"
                href={ctaHref}
              >
                {ctaLabel}
              </a>
            ) : null}
          </nav>
        </div>
      ) : null}
    </>
  );
}
