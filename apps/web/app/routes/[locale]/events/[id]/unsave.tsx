import { unsaveEvent } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { getAuthOptions } from "../../../../lib/auth";
import { buildLoginRedirectUrl } from "../../../../lib/auth-middleware";
import { guardMemberAppRoute } from "../../../../lib/member-app-route";
import { getLocaleParam } from "../../../../lib/onboarding-route";
import { resolvePostMutationRedirect, safeReturnTo } from "../../../../lib/saved-events";

export const POST = createRoute(async (c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const eventId = c.req.param("id");
  const body = await c.req.parseBody();
  const formReturnTo = typeof body.returnTo === "string" ? body.returnTo : null;
  const referer = c.req.header("referer") ?? null;

  const guard = await guardMemberAppRoute(c);
  if (!guard.ok) {
    const returnPath =
      safeReturnTo(locale, formReturnTo) ??
      (eventId ? `/${locale}/events/${eventId}` : `/${locale}/events`);
    return c.redirect(buildLoginRedirectUrl(locale, returnPath), 302);
  }

  if (!eventId) {
    return c.redirect(`/${guard.locale}/saved`, 302);
  }

  const { db } = getAuthOptions();
  try {
    await unsaveEvent(db, guard.session.user.id, eventId);
  } catch {
    // Missing event / FK — still redirect without error page noise
  }

  return c.redirect(
    resolvePostMutationRedirect(guard.locale, {
      formReturnTo,
      referer,
      fallback: `/${guard.locale}/saved`,
    }),
    302,
  );
});
