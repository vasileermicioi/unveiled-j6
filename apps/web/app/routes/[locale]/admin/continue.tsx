import { createRoute } from "honox/factory";

import type { Locale } from "../../../lib/locale";
import { isValidLocale } from "../../../lib/locale";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default createRoute(async (c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const url = new URL(c.req.url);
  const destination = `/${locale}/auth/continue${url.search}`;

  return c.redirect(destination, 302);
});
