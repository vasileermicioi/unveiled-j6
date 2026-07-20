import { createRoute } from "honox/factory";

import { parseAcceptLanguage } from "../lib/locale";

/** Bare `/discover` → localized Discover page. */
export default createRoute((c) => {
  const locale = parseAcceptLanguage(c.req.header("Accept-Language"));
  return c.redirect(`/${locale}/discover`, 302);
});
