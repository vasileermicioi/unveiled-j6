import type { ReactNode } from "react";

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
    <div className="flex min-h-screen flex-col">
      <GuestNavbar locale={locale} pathname={pathname} />
      <main className="flex-1 pt-16 md:pt-20">{children}</main>
      <GuestFooter locale={locale} />
    </div>
  );
}
