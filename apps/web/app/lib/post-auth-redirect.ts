import { type AppSession, getOnboardingStepPath } from "@unveiled/auth";

import { getLocalePathSegment } from "./auth-middleware";
import type { Locale } from "./locale";
import { MEMBER_APP_PREFIXES } from "./onboarding-middleware";
import { parseReturnTo } from "./return-to";

export { parseReturnTo } from "./return-to";

export function buildAuthContinueUrl(locale: Locale, returnTo?: string | null): string {
  const base = `/${locale}/auth/continue`;
  const safeReturnTo = returnTo ? parseReturnTo(returnTo, locale) : null;

  if (!safeReturnTo) {
    return base;
  }

  return `${base}?returnTo=${encodeURIComponent(safeReturnTo)}`;
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
