import { createRoute } from "honox/factory";

import { parseAcceptLanguage } from "../lib/locale";

export default createRoute((c) => {
  const locale = parseAcceptLanguage(c.req.header("Accept-Language"));
  return c.redirect(`/${locale}`, 302);
});
