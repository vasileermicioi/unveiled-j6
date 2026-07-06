import { createRoute } from "honox/factory";

import { AuthPageLayout } from "../../components/AuthPageLayout";
import AuthSignUp from "../../islands/AuthSignUp";
import { getSessionIfConfigured } from "../../lib/auth";
import { getAuthPageCopy } from "../../lib/auth-content";
import type { Locale } from "../../lib/locale";
import { isValidLocale } from "../../lib/locale";
import {
  buildAuthContinueUrl,
  parseReturnTo,
  resolvePostAuthRedirect,
} from "../../lib/post-auth-redirect";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default createRoute(async (c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const pathname = new URL(c.req.url).pathname;
  const copy = getAuthPageCopy(locale, "signup");
  const returnTo = parseReturnTo(c.req.query("returnTo"), locale);
  const authRedirectTo = buildAuthContinueUrl(locale, returnTo);
  const session = await getSessionIfConfigured(c);

  if (session) {
    return c.redirect(resolvePostAuthRedirect({ locale, session, returnTo }), 302);
  }

  return c.render(
    <AuthPageLayout locale={locale} page="signup">
      <AuthSignUp authRedirectTo={authRedirectTo} locale={locale} />
    </AuthPageLayout>,
    {
      locale,
      title: copy.title,
      description: copy.description,
      canonicalPath: pathname,
      robots: "noindex",
    },
  );
});
