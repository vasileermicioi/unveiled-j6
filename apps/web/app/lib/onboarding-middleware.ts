import { type AppSession, getOnboardingStepPath } from "@unveiled/auth";

import { getLocalePathSegment, isAuthConfigured, isPublicEventDetailPath } from "./auth-middleware";
import type { Locale } from "./locale";

export const MEMBER_APP_PREFIXES = ["events", "saved", "bookings", "waitlist", "profile"] as const;

export type MemberAppPrefix = (typeof MEMBER_APP_PREFIXES)[number];

const ONBOARDING_PREFIX = "onboarding";
const COMPLETE_USER_FEED_PREFIX = "events";

function isMemberAppPrefix(segment: string | null): segment is MemberAppPrefix {
  if (!segment) {
    return false;
  }

  return (MEMBER_APP_PREFIXES as readonly string[]).includes(segment);
}

function isOnboardingPrefix(segment: string | null): boolean {
  return segment === ONBOARDING_PREFIX;
}

export function evaluateOnboardingRedirect(options: {
  locale: Locale;
  pathname: string;
  session: AppSession;
}): string | null {
  if (!isAuthConfigured()) {
    return null;
  }

  const segment = getLocalePathSegment(options.pathname, options.locale);
  const { user } = options.session;

  if (user.role === "PARTNER" || user.role === "ADMIN") {
    if (isOnboardingPrefix(segment)) {
      return `/${options.locale}`;
    }

    return null;
  }

  if (user.onboardingComplete) {
    if (isOnboardingPrefix(segment)) {
      return `/${options.locale}/${COMPLETE_USER_FEED_PREFIX}`;
    }

    return null;
  }

  if (isMemberAppPrefix(segment)) {
    if (segment === "events" && isPublicEventDetailPath(options.pathname, options.locale)) {
      return null;
    }

    const stepPath = getOnboardingStepPath(user.profile, user.behavior);
    return `/${options.locale}${stepPath}`;
  }

  return null;
}
