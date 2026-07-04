import { createRoute } from "honox/factory";

import { NotFoundPage } from "../../components/NotFoundPage";
import type { Locale } from "../../lib/locale";
import { isValidLocale } from "../../lib/locale";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default createRoute((c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  c.status(404);

  return c.render(<NotFoundPage locale={locale} />, {
    locale,
    robots: "noindex",
    title: "Not Found — Unveiled Berlin",
  });
});
