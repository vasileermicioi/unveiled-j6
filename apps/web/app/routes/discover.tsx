import { createRoute } from "honox/factory";

import { parseAcceptLanguage } from "../lib/locale";

/** Legacy path — Discover is the locale home at `/:locale`. */
export default createRoute((c) => {
  const locale = parseAcceptLanguage(c.req.header("Accept-Language"));
  return c.redirect(`/${locale}`, 301);
});
