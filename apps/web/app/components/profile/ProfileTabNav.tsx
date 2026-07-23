import { Link, Surface } from "@heroui/react";

import type { Locale } from "../../lib/locale";
import { getProfileCopy } from "../../lib/profile-content";

import {
  PROFILE_TAB_ORDER,
  type ProfileTab,
  profileBillingPath,
  profileDataExportPath,
  profileDeleteAccountPath,
  profileDetailsPath,
  profileMembershipPath,
  profilePreferencesPath,
  profileSecurityPath,
} from "./profile-tabs";

type ProfileTabNavProps = {
  locale: Locale;
  activeTab: ProfileTab;
};

export function ProfileTabNav({ locale, activeTab }: ProfileTabNavProps) {
  const copy = getProfileCopy(locale);

  const tabs: { id: ProfileTab; href: string; label: string }[] = [
    { id: "membership", href: profileMembershipPath(locale), label: copy.membershipTabLabel },
    { id: "details", href: profileDetailsPath(locale), label: copy.detailsTabLabel },
    { id: "preferences", href: profilePreferencesPath(locale), label: copy.preferencesLink },
    { id: "billing", href: profileBillingPath(locale), label: copy.billingLink },
    { id: "security", href: profileSecurityPath(locale), label: copy.passwordLink },
    { id: "data-export", href: profileDataExportPath(locale), label: copy.dataExportLink },
    { id: "delete-account", href: profileDeleteAccountPath(locale), label: copy.deleteAccountLink },
  ];

  return (
    <Surface
      aria-label={copy.tabNavLabel}
      className="admin-tabs profile-tabs"
      role="tablist"
      variant="transparent"
    >
      <Surface className="admin-tabs__track" variant="transparent">
        {PROFILE_TAB_ORDER.map((tabId) => {
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
