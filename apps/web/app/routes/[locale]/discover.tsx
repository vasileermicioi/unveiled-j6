import { createRoute } from "honox/factory";

import type { Locale } from "../../lib/locale";
import { isValidLocale } from "../../lib/locale";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

/** Legacy path — Discover is the locale home at `/:locale`. */
export default createRoute((c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  return c.redirect(`/${locale}`, 301);
});
