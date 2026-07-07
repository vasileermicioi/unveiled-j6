import type { NotFoundHandler } from "hono";

import { NotFoundPage } from "../../components/NotFoundPage";
import { getRequestLocale } from "../../lib/locale";

const handler: NotFoundHandler = (c) => {
  const locale = getRequestLocale(c);
  c.status(404);
  c.header("X-Robots-Tag", "noindex");

  return c.render(<NotFoundPage locale={locale} />, {
    locale,
    robots: "noindex",
    title: locale === "de" ? "Nicht gefunden — Unveiled Berlin" : "Not Found — Unveiled Berlin",
  });
};

export default handler;
