import type { Locale } from "./locale";

/**
 * Better Auth UI concatenates `baseURL` (origin + `/${locale}`) with `redirectTo`
 * for OAuth callbackURL. So AuthProvider.redirectTo must be locale-relative
 * (`/auth/continue?...`), while in-app navigations need `/${locale}/auth/continue?...`.
 */

export function buildDefaultAuthContinuePath(locale: Locale): string {
  return `/${locale}/auth/continue`;
}

/** Locale-relative continue path for @better-auth-ui AuthProvider.redirectTo / OAuth callbackURL. */
export function buildAuthUiContinuePath(returnTo?: string | null): string {
  const base = "/auth/continue";
  if (!returnTo?.trim()) {
    return base;
  }
  return `${base}?returnTo=${encodeURIComponent(returnTo.trim())}`;
}

/** Resolve a UI redirectTo (locale-relative or absolute) to a same-origin navigation path. */
export function resolveAuthNavigatePath(to: string, locale: Locale): string {
  const trimmed = to.trim();
  if (!trimmed) {
    return buildDefaultAuthContinuePath(locale);
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return buildDefaultAuthContinuePath(locale);
    }
  }

  if (trimmed === "/auth/continue" || trimmed.startsWith("/auth/continue?")) {
    return `/${locale}${trimmed}`;
  }

  if (trimmed.startsWith(`/${locale}/`) || trimmed === `/${locale}`) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return `/${locale}${trimmed}`;
  }

  return `/${locale}/${trimmed}`;
}

export function normalizeAuthRedirectTarget(
  value: string | undefined,
  locale: Locale,
): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.includes("://") || trimmed.startsWith("//")) {
    return undefined;
  }

  const fixed = trimmed
    .replace(new RegExp(`^/${locale}/admin/continue(?=\\?|$)`), `/${locale}/auth/continue`)
    .replace(/^\/admin\/continue(?=\?|$)/, "/auth/continue");

  // Prefer locale-relative form for AuthProvider (OAuth callbackURL = baseURL + redirectTo).
  if (fixed === `/${locale}/auth/continue` || fixed.startsWith(`/${locale}/auth/continue?`)) {
    return fixed.replace(new RegExp(`^/${locale}`), "") || "/auth/continue";
  }

  if (fixed === "/auth/continue" || fixed.startsWith("/auth/continue?")) {
    return fixed;
  }

  return undefined;
}
