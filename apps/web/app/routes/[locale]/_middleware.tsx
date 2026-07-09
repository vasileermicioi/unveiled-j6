import { createRoute } from "honox/factory";

import { NotFoundPage } from "../../components/NotFoundPage";
import { getSessionIfConfigured } from "../../lib/auth";
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
  }

  await next();
});
