import { type AppSession, getOnboardingStepPath } from "@unveiled/auth";

import { getLocalePathSegment } from "./auth-middleware";
import type { Locale } from "./locale";
import { MEMBER_APP_PREFIXES } from "./onboarding-middleware";

export function buildAuthContinueUrl(locale: Locale, returnTo?: string | null): string {
  const base = `/${locale}/auth/continue`;
  const safeReturnTo = returnTo ? parseReturnTo(returnTo, locale) : null;

  if (!safeReturnTo) {
    return base;
  }

  return `${base}?returnTo=${encodeURIComponent(safeReturnTo)}`;
}

export function parseReturnTo(value: string | undefined, locale: Locale): string | null {
  if (!value) {
    return null;
  }

  // Unwrap a single nested `/auth/continue?returnTo=` so a stuck login URL can recover.
  const unwrapped = unwrapAuthContinueReturnTo(value.trim(), locale);
  if (!isSafeReturnTo(unwrapped, locale)) {
    return null;
  }

  return unwrapped;
}

function unwrapAuthContinueReturnTo(path: string, locale: Locale): string {
  const continuePrefix = `/${locale}/auth/continue`;
  if (path !== continuePrefix && !path.startsWith(`${continuePrefix}?`)) {
    return path;
  }

  const queryIndex = path.indexOf("?");
  if (queryIndex === -1) {
    return path;
  }

  const nested = new URLSearchParams(path.slice(queryIndex + 1)).get("returnTo");
  return nested?.trim() ? nested.trim() : path;
}

/** Auth bounce routes — accepting these as returnTo nests redirects and can loop. */
const AUTH_BOUNCE_SEGMENTS = new Set(["login", "signup", "auth"]);

function isSafeReturnTo(path: string, locale: Locale): boolean {
  if (path.includes("://") || path.startsWith("//") || path.includes("..")) {
    return false;
  }

  if (!(path === `/${locale}` || path.startsWith(`/${locale}/`))) {
    return false;
  }

  const pathname = path.split("?")[0] ?? path;
  const segment = getLocalePathSegment(pathname, locale);
  if (segment && AUTH_BOUNCE_SEGMENTS.has(segment)) {
    return false;
  }

  return true;
}

export function resolvePostAuthRedirect(options: {
  locale: Locale;
  session: AppSession;
  returnTo?: string | null;
}): string {
  const { locale, session } = options;
  const returnTo = parseReturnTo(options.returnTo ?? undefined, locale);
  const { user } = session;

  if (user.role === "PARTNER") {
    return `/${locale}/partner`;
  }

  if (user.role === "ADMIN") {
    return `/${locale}/admin`;
  }

  if (!user.onboardingComplete) {
    if (returnTo) {
      const segment = getLocalePathSegment(returnTo, locale);

      if (segment === "membership" || segment === "onboarding") {
        return returnTo;
      }

      if (segment && (MEMBER_APP_PREFIXES as readonly string[]).includes(segment)) {
        const stepPath = getOnboardingStepPath(user.profile, user.behavior);
        return `/${locale}${stepPath}`;
      }
    }

    const stepPath = getOnboardingStepPath(user.profile, user.behavior);
    return `/${locale}${stepPath}`;
  }

  if (returnTo) {
    return returnTo;
  }

  return `/${locale}/events`;
}
