import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

export type ProfileTab =
  | "membership"
  | "details"
  | "preferences"
  | "billing"
  | "security"
  | "data-export"
  | "delete-account";

export const PROFILE_TAB_ORDER: ProfileTab[] = [
  "membership",
  "details",
  "preferences",
  "billing",
  "security",
  "data-export",
  "delete-account",
];

export function profileMembershipPath(locale: Locale): string {
  return localizedPath(locale, "profile");
}

export function profileDetailsPath(locale: Locale): string {
  return localizedPath(locale, "profile/details");
}

export function profilePreferencesPath(locale: Locale): string {
  return localizedPath(locale, "profile/preferences");
}

export function profileBillingPath(locale: Locale): string {
  return localizedPath(locale, "profile/billing");
}

export function profileSecurityPath(locale: Locale): string {
  return localizedPath(locale, "profile/security");
}

export function profileDataExportPath(locale: Locale): string {
  return localizedPath(locale, "profile/data-export");
}

export function profileDeleteAccountPath(locale: Locale): string {
  return localizedPath(locale, "profile/delete-account");
}

export function inferProfileTab(pathname: string): ProfileTab {
  if (pathname.includes("/profile/details")) {
    return "details";
  }
  if (pathname.includes("/profile/preferences")) {
    return "preferences";
  }
  if (pathname.includes("/profile/billing")) {
    return "billing";
  }
  if (pathname.includes("/profile/security")) {
    return "security";
  }
  if (pathname.includes("/profile/data-export")) {
    return "data-export";
  }
  if (pathname.includes("/profile/delete-account")) {
    return "delete-account";
  }
  return "membership";
}
