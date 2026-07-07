import { Link, Surface } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import {
  ADMIN_TAB_ORDER,
  type AdminTab,
  adminDashboardPath,
  adminEventsPath,
  adminPartnersPath,
} from "./admin-tabs";

type AdminTabNavProps = {
  locale: Locale;
  activeTab: AdminTab;
};

const TAB_ORDER = ADMIN_TAB_ORDER;

export function AdminTabNav({ locale, activeTab }: AdminTabNavProps) {
  const copy = getAdminCopy(locale);

  const tabs: { id: AdminTab; href: string; label: string }[] = [
    { id: "overview", href: adminDashboardPath(locale), label: copy.tabOverview },
    { id: "partners", href: adminPartnersPath(locale), label: copy.tabPartners },
    { id: "events", href: adminEventsPath(locale), label: copy.tabEvents },
  ];

  return (
    <Surface
      aria-label={copy.tabNavLabel}
      className="admin-tabs"
      role="tablist"
      variant="transparent"
    >
      <Surface className="admin-tabs__track" variant="transparent">
        {TAB_ORDER.map((tabId) => {
          const tab = tabs.find((entry) => entry.id === tabId);
          if (!tab) {
            return null;
          }

          const isActive = tab.id === activeTab;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={
                isActive ? "link admin-tabs__tab admin-tabs__tab--active" : "link admin-tabs__tab"
              }
              href={tab.href}
              key={tab.id}
            >
              {tab.label}
            </Link>
          );
        })}
      </Surface>
    </Surface>
  );
}
