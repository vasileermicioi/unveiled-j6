import type { Locale } from "./locale";

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

  const fixed = trimmed.replace(
    new RegExp(`^/${locale}/admin/continue(?=\\?|$)`),
    `/${locale}/auth/continue`,
  );

  if (fixed === `/${locale}/auth/continue` || fixed.startsWith(`/${locale}/auth/continue?`)) {
    return fixed;
  }

  return undefined;
}

export function buildDefaultAuthContinuePath(locale: Locale): string {
  return `/${locale}/auth/continue`;
}
