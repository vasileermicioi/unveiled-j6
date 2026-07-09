import type { AppSession, UserRole } from "@unveiled/auth";

import type { Locale } from "./locale";
import { hasRuntimeAuthConfig } from "./runtime-env";

export const PROTECTED_PREFIXES = [
  "events",
  "saved",
  "bookings",
  "profile",
  "partner",
  "admin",
  "onboarding",
] as const;

export type ProtectedPrefix = (typeof PROTECTED_PREFIXES)[number];

const ROLE_FORBIDDEN: Record<UserRole, readonly ProtectedPrefix[]> = {
  USER: ["partner", "admin"],
  PARTNER: ["admin"],
  ADMIN: [],
};

export function isAuthConfigured(): boolean {
  return hasRuntimeAuthConfig();
}

export function getLocalePathSegment(pathname: string, locale: Locale): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== locale) {
    return null;
  }

  return segments[1] ?? null;
}

export function isProtectedPrefix(segment: string | null): segment is ProtectedPrefix {
  if (!segment) {
    return false;
  }

  return (PROTECTED_PREFIXES as readonly string[]).includes(segment);
}

const PUBLIC_EVENT_DETAIL_RESERVED = new Set(["book", "waitlist", "map", "series"]);

export function isPublicEventDetailPath(pathname: string, locale: Locale): boolean {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 3) {
    return false;
  }

  if (segments[0] !== locale || segments[1] !== "events") {
    return false;
  }

  const eventId = segments[2];
  if (!eventId) {
    return false;
  }

  return !PUBLIC_EVENT_DETAIL_RESERVED.has(eventId);
}

export function buildLoginRedirectUrl(locale: Locale, pathname: string): string {
  const params = new URLSearchParams({ returnTo: pathname });
  return `/${locale}/login?${params.toString()}`;
}

export function evaluateAuthRedirect(options: {
  locale: Locale;
  pathname: string;
  /** Optional query string including leading `?` — preserved on login returnTo. */
  search?: string;
  session: AppSession | null;
}): string | null {
  if (!isAuthConfigured()) {
    return null;
  }

  const segment = getLocalePathSegment(options.pathname, options.locale);
  if (!isProtectedPrefix(segment)) {
    return null;
  }

  if (segment === "events" && isPublicEventDetailPath(options.pathname, options.locale)) {
    return null;
  }

  if (!options.session) {
    const returnPath = options.search ? `${options.pathname}${options.search}` : options.pathname;
    return buildLoginRedirectUrl(options.locale, returnPath);
  }

  if (ROLE_FORBIDDEN[options.session.user.role].includes(segment)) {
    return `/${options.locale}`;
  }

  return null;
}
