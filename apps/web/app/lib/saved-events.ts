import type { Locale } from "./locale";

/**
 * Allow only same-locale relative paths under `/${locale}/…`.
 * Rejects protocol-relative (`//`), external URLs, and other locales.
 */
export function safeReturnTo(locale: Locale, candidate: string | null | undefined): string | null {
  if (!candidate) {
    return null;
  }

  const trimmed = candidate.trim();
  if (!trimmed) {
    return null;
  }

  let pathWithSearch: string;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      pathWithSearch = `${url.pathname}${url.search}`;
    } catch {
      return null;
    }
  } else if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//")) {
      return null;
    }
    pathWithSearch = trimmed;
  } else {
    return null;
  }

  const pathOnly = pathWithSearch.split("?")[0] ?? pathWithSearch;
  const prefix = `/${locale}/`;
  if (pathOnly !== `/${locale}` && !pathOnly.startsWith(prefix)) {
    return null;
  }

  return pathWithSearch;
}

export function resolvePostMutationRedirect(
  locale: Locale,
  options: {
    formReturnTo?: string | null;
    referer?: string | null;
    fallback?: string;
  },
): string {
  const fromForm = safeReturnTo(locale, options.formReturnTo);
  if (fromForm) {
    return fromForm;
  }

  const fromReferer = safeReturnTo(locale, options.referer);
  if (fromReferer) {
    return fromReferer;
  }

  return options.fallback ?? `/${locale}/events`;
}

export function eventSavePath(locale: Locale, eventId: string): string {
  return `/${locale}/events/${eventId}/save`;
}

export function eventUnsavePath(locale: Locale, eventId: string): string {
  return `/${locale}/events/${eventId}/unsave`;
}
