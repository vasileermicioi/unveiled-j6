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
  children: ReactNode;
};

export function AppShell({ locale, pathname, session, children }: AppShellProps) {
  return (
    <SSRProvider>
      <Surface className="flex min-h-screen flex-col" variant="transparent">
        <AppNavbar locale={locale} pathname={pathname} session={session} />
        <Surface className="flex-1 pt-16 md:pt-20" role="main" variant="transparent">
          {children}
        </Surface>
        <GuestFooter locale={locale} />
        <CookieConsentBanner locale={locale} />
      </Surface>
    </SSRProvider>
  );
}
