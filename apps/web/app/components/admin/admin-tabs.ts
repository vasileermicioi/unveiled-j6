import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

export type AdminTab = "overview" | "partners" | "events" | "featured" | "users" | "waitlist";

export const ADMIN_TAB_ORDER: AdminTab[] = [
  "overview",
  "partners",
  "events",
  "featured",
  "users",
  "waitlist",
];

export function adminDashboardPath(locale: Locale): string {
  return localizedPath(locale, "admin");
}

export function adminPartnersPath(locale: Locale): string {
  return localizedPath(locale, "admin/partners");
}

export function adminEventsPath(locale: Locale): string {
  return localizedPath(locale, "admin/events");
}

export function adminFeaturedPath(locale: Locale): string {
  return localizedPath(locale, "admin/featured");
}

export function adminFeaturedAddPath(locale: Locale): string {
  return localizedPath(locale, "admin/featured/add");
}

export function adminFeaturedRemovePath(locale: Locale, eventId: string): string {
  return localizedPath(locale, `admin/featured/${eventId}/remove`);
}

export function adminUsersPath(locale: Locale): string {
  return localizedPath(locale, "admin/users");
}

export function adminWaitlistPath(locale: Locale): string {
  return localizedPath(locale, "admin/waitlist");
}

export function adminUserDetailPath(locale: Locale, userId: string): string {
  return localizedPath(locale, `admin/users/${userId}`);
}

export function adminUserAdjustCreditsPath(locale: Locale, userId: string): string {
  return localizedPath(locale, `admin/users/${userId}/adjust-credits`);
}

export function adminUserFreezePath(locale: Locale, userId: string): string {
  return localizedPath(locale, `admin/users/${userId}/freeze`);
}

export function adminUserCompTicketPath(locale: Locale, userId: string): string {
  return localizedPath(locale, `admin/users/${userId}/comp-ticket`);
}

export function adminUserRefundPath(locale: Locale, userId: string): string {
  return localizedPath(locale, `admin/users/${userId}/refund`);
}

export function adminUserDeleteAccountPath(locale: Locale, userId: string): string {
  return localizedPath(locale, `admin/users/${userId}/delete-account`);
}

export function adminWaitlistPromotePath(locale: Locale, entryId: string): string {
  return localizedPath(locale, `admin/waitlist/${entryId}/promote`);
}

export function adminBookingCancelPath(locale: Locale, bookingId: string): string {
  return localizedPath(locale, `admin/bookings/${bookingId}/cancel`);
}

export function inferAdminTab(pathname: string): AdminTab {
  if (pathname.includes("/admin/partners")) {
    return "partners";
  }

  if (pathname.includes("/admin/featured")) {
    return "featured";
  }

  if (pathname.includes("/admin/events")) {
    return "events";
  }

  if (pathname.includes("/admin/waitlist")) {
    return "waitlist";
  }

  if (pathname.includes("/admin/users") || pathname.includes("/admin/bookings")) {
    return "users";
  }

  return "overview";
}
