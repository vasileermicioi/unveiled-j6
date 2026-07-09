import { listSavedEventIds } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { NotFoundPage } from "../../components/NotFoundPage";
import { getAuthOptions, getSessionIfConfigured } from "../../lib/auth";
import { evaluateAuthRedirect } from "../../lib/auth-middleware";
import { isValidLocale, type Locale } from "../../lib/locale";
import { evaluateOnboardingRedirect } from "../../lib/onboarding-middleware";

export default createRoute(async (c, next) => {
  const locale = c.req.param("locale");

  if (!locale || !isValidLocale(locale)) {
    c.status(404);
    return c.render(<NotFoundPage locale="de" />, {
      locale: "de",
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const url = new URL(c.req.url);
  const pathname = url.pathname;
  const session = await getSessionIfConfigured(c);
  c.set("session", session);
  c.set("savedCount", 0);

  const redirectTo = evaluateAuthRedirect({
    locale: locale as Locale,
    pathname,
    search: url.search,
    session,
  });

  if (redirectTo) {
    return c.redirect(redirectTo, 302);
  }

  if (session) {
    const onboardingRedirect = evaluateOnboardingRedirect({
      locale: locale as Locale,
      pathname,
      session,
    });

    if (onboardingRedirect) {
      return c.redirect(onboardingRedirect, 302);
    }

    if (session.user.role === "USER") {
      try {
        const { db } = getAuthOptions();
        const ids = await listSavedEventIds(db, session.user.id);
        c.set("savedCount", ids.length);
      } catch {
        c.set("savedCount", 0);
      }
    }
  }

  await next();
});
