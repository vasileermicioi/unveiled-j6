import type { AppSession } from "@unveiled/auth";
import type { Context } from "hono";

import { getSession } from "./auth";
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
