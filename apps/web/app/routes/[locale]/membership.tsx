import { createRoute } from "honox/factory";

import { MembershipInfoPage } from "../../components/marketing/MembershipInfoPage";
import { getPageContent } from "../../lib/content";
import { getCopy } from "../../lib/copy";
import type { Locale } from "../../lib/locale";
import { isValidLocale } from "../../lib/locale";
import { membershipPageMeta } from "../../lib/seo";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default createRoute((c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const content = getPageContent(locale, "membership");
  const copy = getCopy(locale);
  const pathname = new URL(c.req.url).pathname;
  const meta = membershipPageMeta(content, copy.nav.membership);

  return c.render(<MembershipInfoPage content={content} />, {
    locale,
    title: meta.title,
    description: meta.description,
    canonicalPath: pathname,
  });
});
