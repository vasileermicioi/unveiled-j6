import type { AppSession } from "@unveiled/auth";
import { isBookingEligibleStatus } from "@unveiled/db";
import type { Context } from "hono";

import { getAuthOptions, getSession } from "./auth";
import { buildLoginRedirectUrl } from "./auth-middleware";
import type { Locale } from "./locale";
import { getLocaleParam } from "./onboarding-route";

export type MemberAppGuardOk = {
  ok: true;
  session: AppSession;
  locale: Locale;
};

export type MemberAppGuardFail = {
  ok: false;
  response: Response;
};

export type MemberAppGuardResult = MemberAppGuardOk | MemberAppGuardFail;

/**
 * Shared guard for member surfaces (`/events` feed, `/saved`, save/unsave POST).
 * Guests → login with returnTo; PARTNER → partner portal; USER and ADMIN allowed.
 */
export async function guardMemberAppRoute(c: Context): Promise<MemberAppGuardResult> {
  const locale = getLocaleParam(c.req.param("locale"));
  const session = await getSession(c);
  const url = new URL(c.req.url);
  const returnPath = `${url.pathname}${url.search}`;

  if (!session) {
    return {
      ok: false,
      response: c.redirect(buildLoginRedirectUrl(locale, returnPath), 302),
    };
  }

  if (session.user.role === "PARTNER") {
    return {
      ok: false,
      response: c.redirect(`/${locale}/partner`, 302),
    };
  }

  if (session.user.role !== "USER" && session.user.role !== "ADMIN") {
    return {
      ok: false,
      response: c.redirect(`/${locale}`, 302),
    };
  }

  return { ok: true, session, locale };
}

/**
 * Guard for the full event list and map (`/events`, `/events/map`).
 * Non-booking-eligible USER → Discover. ADMIN keeps access (not sent to Discover).
 * Guests keep the auth redirect from {@link guardMemberAppRoute}.
 */
export async function guardActiveMemberFeedRoute(c: Context): Promise<MemberAppGuardResult> {
  const guard = await guardMemberAppRoute(c);
  if (!guard.ok) {
    return guard;
  }

  if (guard.session.user.role !== "USER") {
    return guard;
  }

  // Prefer middleware flag when present; fall back to a subscription lookup.
  const fromContext = c.get("canBrowseEvents");
  if (fromContext === true) {
    return guard;
  }
  if (fromContext === false) {
    return {
      ok: false,
      response: c.redirect(`/${guard.locale}/discover`, 302),
    };
  }

  try {
    const { db } = getAuthOptions();
    const subscription = await db.query.subscriptions.findFirst({
      where: (fields, { eq }) => eq(fields.userId, guard.session.user.id),
      columns: { status: true },
    });
    if (!isBookingEligibleStatus(subscription?.status)) {
      return {
        ok: false,
        response: c.redirect(`/${guard.locale}/discover`, 302),
      };
    }
  } catch {
    return {
      ok: false,
      response: c.redirect(`/${guard.locale}/discover`, 302),
    };
  }

  return guard;
}
