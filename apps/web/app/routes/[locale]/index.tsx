import { createRoute } from "honox/factory";

import { LandingPage } from "../../components/marketing/LandingPage";
import { getPageContent } from "../../lib/content";
import type { Locale } from "../../lib/locale";
import { isValidLocale } from "../../lib/locale";
import { buildOrganizationJsonLd, landingPageMeta } from "../../lib/seo";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default createRoute((c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const landing = getPageContent(locale, "landing");
  const pathname = new URL(c.req.url).pathname;
  const meta = landingPageMeta(landing);
  const jsonLd = buildOrganizationJsonLd(locale);

  return c.render(
    <>
      <LandingPage landing={landing} locale={locale} />
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
