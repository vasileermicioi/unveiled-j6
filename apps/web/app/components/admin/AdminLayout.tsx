import { Surface } from "@heroui/react";
import type { ReactNode } from "react";

import type { Locale } from "../../lib/locale";

import { AdminTabNav } from "./AdminTabNav";
import type { AdminTab } from "./admin-tabs";

type AdminLayoutProps = {
  locale: Locale;
  activeTab: AdminTab;
  children: ReactNode;
};

export function AdminLayout({ locale, activeTab, children }: AdminLayoutProps) {
  return (
    <Surface
      className="admin-shell mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8"
      variant="transparent"
    >
      <AdminTabNav activeTab={activeTab} locale={locale} />
      {children}
    </Surface>
  );
}
