import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

export type AdminTab =
  | "overview"
  | "partners"
  | "events"
  | "featured"
  | "featured-partners"
  | "users"
  | "waitlist";

export const ADMIN_TAB_ORDER: AdminTab[] = [
  "overview",
  "partners",
  "events",
  "featured",
  "featured-partners",
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

export function adminEventGalleryPath(locale: Locale, eventId: string): string {
  return localizedPath(locale, `admin/events/${eventId}/gallery`);
}

export function adminEventGalleryAddPath(locale: Locale, eventId: string): string {
  return localizedPath(locale, `admin/events/${eventId}/gallery/add`);
}

export function adminEventGalleryRemovePath(
  locale: Locale,
  eventId: string,
  imageIds?: string[],
): string {
  const base = localizedPath(locale, `admin/events/${eventId}/gallery/remove`);
  if (!imageIds?.length) {
    return base;
  }
  const params = new URLSearchParams();
  for (const imageId of imageIds) {
    params.append("imageIds", imageId);
  }
  return `${base}?${params.toString()}`;
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

export function adminFeaturedPartnersPath(locale: Locale): string {
  return localizedPath(locale, "admin/featured-partners");
}

export function adminFeaturedPartnersAddPath(locale: Locale): string {
  return localizedPath(locale, "admin/featured-partners/add");
}

export function adminFeaturedPartnersRemovePath(locale: Locale, partnerIds?: string[]): string {
  const base = localizedPath(locale, "admin/featured-partners/remove");
  if (!partnerIds?.length) {
    return base;
  }
  const params = new URLSearchParams();
  for (const partnerId of partnerIds) {
    params.append("partnerIds", partnerId);
  }
  return `${base}?${params.toString()}`;
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

  // Must run before `/admin/featured` — that prefix also matches featured-partners.
  if (pathname.includes("/admin/featured-partners")) {
    return "featured-partners";
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
