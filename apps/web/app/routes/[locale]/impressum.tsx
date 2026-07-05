import { createRoute } from "honox/factory";

import { LegalPage } from "../../components/marketing/LegalPage";
import { getPageContent } from "../../lib/content";
import type { Locale } from "../../lib/locale";
import { isValidLocale } from "../../lib/locale";
import { legalPageMeta } from "../../lib/seo";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default createRoute((c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const content = getPageContent(locale, "impressum");
  const pathname = new URL(c.req.url).pathname;
  const meta = legalPageMeta(content);

  return c.render(<LegalPage content={content} />, {
    locale,
    title: meta.title,
    description: meta.description,
    canonicalPath: pathname,
  });
});
