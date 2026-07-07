import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

export type AdminTab = "overview" | "partners" | "events";

export const ADMIN_TAB_ORDER: AdminTab[] = ["overview", "partners", "events"];

export function adminDashboardPath(locale: Locale): string {
  return localizedPath(locale, "admin");
}

export function adminPartnersPath(locale: Locale): string {
  return localizedPath(locale, "admin/partners");
}

export function adminEventsPath(locale: Locale): string {
  return localizedPath(locale, "admin/events");
}

export function inferAdminTab(pathname: string): AdminTab {
  if (pathname.includes("/admin/partners")) {
    return "partners";
  }

  if (pathname.includes("/admin/events")) {
    return "events";
  }

  return "overview";
}
