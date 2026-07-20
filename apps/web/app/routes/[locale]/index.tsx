import { createRoute } from "honox/factory";

import { LandingPage } from "../../components/marketing/LandingPage";
import { getPageContent } from "../../lib/content";
import type { Locale } from "../../lib/locale";
import { isValidLocale } from "../../lib/locale";
import { resolvePostAuthRedirect } from "../../lib/post-auth-redirect";
import { buildOrganizationJsonLd, landingPageMeta } from "../../lib/seo";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default createRoute(async (c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const session = c.get("session") ?? null;

  // Guest marketing home only — signed-in members/admins go to their role home.
  if (session) {
    return c.redirect(resolvePostAuthRedirect({ locale, session }), 302);
  }

  const content = getPageContent(locale, "landing");
  const pathname = new URL(c.req.url).pathname;
  const meta = landingPageMeta(content);
  const jsonLd = buildOrganizationJsonLd(locale);

  return c.render(
    <>
      <LandingPage landing={content} locale={locale} />
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
