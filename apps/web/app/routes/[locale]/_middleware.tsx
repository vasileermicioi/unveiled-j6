import { createRoute } from "honox/factory";

import { NotFoundPage } from "../../components/NotFoundPage";
import { getSessionIfConfigured } from "../../lib/auth";
import { evaluateAuthRedirect } from "../../lib/auth-middleware";
import { isValidLocale, type Locale } from "../../lib/locale";

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

  const pathname = new URL(c.req.url).pathname;
  const session = await getSessionIfConfigured(c);
  c.set("session", session);

  const redirectTo = evaluateAuthRedirect({
    locale: locale as Locale,
    pathname,
    session,
  });

  if (redirectTo) {
    return c.redirect(redirectTo, 302);
  }

  await next();
});
