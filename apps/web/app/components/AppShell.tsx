import { Surface } from "@heroui/react";
import type { ReactNode } from "react";

import CookieConsentBanner from "../islands/CookieConsentBanner";
import type { Locale } from "../lib/locale";
import { GuestFooter } from "./GuestFooter";
import { GuestNavbar } from "./GuestNavbar";

type AppShellProps = {
  locale: Locale;
  pathname: string;
  children: ReactNode;
};

export function AppShell({ locale, pathname, children }: AppShellProps) {
  return (
    <Surface className="flex min-h-screen flex-col" variant="transparent">
      <GuestNavbar locale={locale} pathname={pathname} />
      <Surface className="flex-1 pt-16 md:pt-20" role="main" variant="transparent">
        {children}
      </Surface>
      <GuestFooter locale={locale} />
      <CookieConsentBanner locale={locale} />
    </Surface>
  );
}
