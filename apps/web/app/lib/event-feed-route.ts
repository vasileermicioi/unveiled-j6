import type { AppSession } from "@unveiled/auth";
import type { Context } from "hono";

import { getSession } from "./auth";
import { buildLoginRedirectUrl } from "./auth-middleware";
import type { Locale } from "./locale";
import { getLocaleParam } from "./onboarding-route";

export type MemberFeedGuardOk = {
  ok: true;
  session: AppSession;
  locale: Locale;
};

export type MemberFeedGuardFail = {
  ok: false;
  response: Response;
};

export type MemberFeedGuardResult = MemberFeedGuardOk | MemberFeedGuardFail;

export async function guardMemberFeedRoute(c: Context): Promise<MemberFeedGuardResult> {
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
