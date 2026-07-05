import { createRoute } from "honox/factory";

import { AuthPageLayout } from "../../components/AuthPageLayout";
import AuthResetPassword from "../../islands/AuthResetPassword";
import { getAuthPageCopy } from "../../lib/auth-content";
import type { Locale } from "../../lib/locale";
import { isValidLocale } from "../../lib/locale";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default createRoute((c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const pathname = new URL(c.req.url).pathname;
  const copy = getAuthPageCopy(locale, "resetPassword");

  return c.render(
    <AuthPageLayout locale={locale} page="resetPassword">
      <AuthResetPassword locale={locale} />
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
