import { Surface } from "@heroui/react";
import { SSRProvider } from "@react-aria/ssr";
import type { ReactNode } from "react";

import CookieConsentBanner from "../islands/CookieConsentBanner";
import type { AppSession } from "../lib/auth";
import type { Locale } from "../lib/locale";
import { AppNavbar } from "./AppNavbar";
import { GuestFooter } from "./GuestFooter";

type AppShellProps = {
  locale: Locale;
  pathname: string;
  session: AppSession | null;
  savedCount?: number;
  /** USER with booking-eligible subscription — drives Discover ↔ Browse events nav/logo. */
  canBrowseEvents?: boolean;
  children: ReactNode;
};

export function AppShell({
  locale,
  pathname,
  session,
  savedCount = 0,
  canBrowseEvents = false,
  children,
}: AppShellProps) {
  return (
    <SSRProvider>
      <Surface className="flex min-h-screen flex-col" variant="transparent">
        <AppNavbar
          canBrowseEvents={canBrowseEvents}
          locale={locale}
          pathname={pathname}
          savedCount={savedCount}
          session={session}
        />
        <Surface className="flex-1 pt-16 md:pt-20" role="main" variant="transparent">
          {children}
        </Surface>
        <GuestFooter locale={locale} />
        <CookieConsentBanner locale={locale} />
      </Surface>
    </SSRProvider>
  );
}
