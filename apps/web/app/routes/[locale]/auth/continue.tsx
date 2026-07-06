import { createRoute } from "honox/factory";

import { getSessionIfConfigured } from "../../../lib/auth";
import { buildLoginRedirectUrl } from "../../../lib/auth-middleware";
import type { Locale } from "../../../lib/locale";
import { isValidLocale } from "../../../lib/locale";
import { parseReturnTo, resolvePostAuthRedirect } from "../../../lib/post-auth-redirect";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default createRoute(async (c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const session = await getSessionIfConfigured(c);
  const returnTo = parseReturnTo(c.req.query("returnTo"), locale);

  if (!session) {
    const continuePath = returnTo
      ? `/${locale}/auth/continue?returnTo=${encodeURIComponent(returnTo)}`
      : `/${locale}/auth/continue`;

    return c.redirect(buildLoginRedirectUrl(locale, continuePath), 302);
  }

  const destination = resolvePostAuthRedirect({
    locale,
    session,
    returnTo,
  });

  return c.redirect(destination, 302);
});
