import { createRoute } from "honox/factory";

import { AuthPageLayout } from "../../components/AuthPageLayout";
import AuthSignIn from "../../islands/AuthSignIn";
import { getSessionIfConfigured } from "../../lib/auth";
import { getAuthPageCopy } from "../../lib/auth-content";
import { buildAuthUiContinuePath } from "../../lib/auth-redirect";
import type { Locale } from "../../lib/locale";
import { isValidLocale } from "../../lib/locale";
import { parseReturnTo, resolvePostAuthRedirect } from "../../lib/post-auth-redirect";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default createRoute(async (c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const pathname = new URL(c.req.url).pathname;
  const copy = getAuthPageCopy(locale, "login");
  const returnTo = parseReturnTo(c.req.query("returnTo"), locale);
  // Locale-relative: AuthProvider baseURL is `origin/${locale}`; OAuth concatenates baseURL+redirectTo.
  const authRedirectTo = buildAuthUiContinuePath(returnTo);
  const session = await getSessionIfConfigured(c);

  if (session) {
    return c.redirect(resolvePostAuthRedirect({ locale, session, returnTo }), 302);
  }

  return c.render(
    <AuthPageLayout locale={locale} page="login">
      <AuthSignIn authRedirectTo={authRedirectTo} locale={locale} />
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
