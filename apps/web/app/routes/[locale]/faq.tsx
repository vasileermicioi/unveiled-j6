import { createRoute } from "honox/factory";

import { FaqPage } from "../../components/marketing/FaqPage";
import { getPageContent } from "../../lib/content";
import type { Locale } from "../../lib/locale";
import { isValidLocale } from "../../lib/locale";
import { buildFaqPageJsonLd, faqPageMeta } from "../../lib/seo";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default createRoute((c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const content = getPageContent(locale, "faq");
  const pathname = new URL(c.req.url).pathname;
  const meta = faqPageMeta(content);
  const jsonLd = buildFaqPageJsonLd(content.section.items);

  return c.render(
    <>
      <FaqPage content={content} />
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
    </>,
    {
      locale,
      title: meta.title,
      description: meta.description,
      canonicalPath: pathname,
    },
  );
});
