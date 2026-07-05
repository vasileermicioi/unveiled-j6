import { createRoute } from "honox/factory";

import { DiscoverPage } from "../../components/marketing/DiscoverPage";
import { getPageContent } from "../../lib/content";
import { getCopy } from "../../lib/copy";
import type { Locale } from "../../lib/locale";
import { isValidLocale } from "../../lib/locale";
import { discoverPageMeta } from "../../lib/seo";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default createRoute((c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const content = getPageContent(locale, "discover");
  const copy = getCopy(locale);
  const pathname = new URL(c.req.url).pathname;
  const meta = discoverPageMeta(content, copy.nav.discover);

  return c.render(<DiscoverPage content={content} locale={locale} />, {
    locale,
    title: meta.title,
    description: meta.description,
    canonicalPath: pathname,
  });
});
