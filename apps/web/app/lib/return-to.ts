import { getLocalePathSegment } from "./auth-middleware";
import type { Locale } from "./locale";

/** Auth bounce routes — accepting these as returnTo nests redirects and can loop. */
const AUTH_BOUNCE_SEGMENTS = new Set(["login", "signup", "auth"]);

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

/**
 * Client-safe returnTo parser (no `@unveiled/auth` / `@unveiled/db`).
 * Auth islands must import this module — not `post-auth-redirect`.
 */
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
