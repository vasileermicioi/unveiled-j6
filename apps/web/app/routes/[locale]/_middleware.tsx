import { createRoute } from "honox/factory";

import { NotFoundPage } from "../../components/NotFoundPage";
import { isValidLocale } from "../../lib/locale";

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

  await next();
});
