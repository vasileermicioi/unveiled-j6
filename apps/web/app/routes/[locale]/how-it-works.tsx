import { createRoute } from "honox/factory";

import { HowItWorksPage } from "../../components/marketing/HowItWorksPage";
import { getPageContent } from "../../lib/content";
import { getCopy } from "../../lib/copy";
import type { Locale } from "../../lib/locale";
import { isValidLocale } from "../../lib/locale";
import { howItWorksPageMeta } from "../../lib/seo";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default createRoute((c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const content = getPageContent(locale, "how-it-works");
  const copy = getCopy(locale);
  const pathname = new URL(c.req.url).pathname;
  const meta = howItWorksPageMeta(content, copy.nav.howItWorks);

  return c.render(<HowItWorksPage content={content} />, {
    locale,
    title: meta.title,
    description: meta.description,
    canonicalPath: pathname,
  });
});
