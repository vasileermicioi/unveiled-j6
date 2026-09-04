import { createRoute } from "honox/factory";

import { LandingPageV3 } from "../../components/marketing/landing-v3/LandingPageV3";
import { getCatalogDb } from "../../lib/catalog-db";
import { getPageContent } from "../../lib/content";
import {
  getLandingFallbackTeasers,
  LANDING_LIVE_TEASER_LIMIT,
  loadLandingLiveTeasers,
} from "../../lib/landing-teasers";
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
  // Release cap: the rail never shows more than 3 teasers. The live query
  // already limits; cap the static fallback the same way when DB is unreachable.
  let liveTeasers = getLandingFallbackTeasers(locale).slice(0, LANDING_LIVE_TEASER_LIMIT);
  const db = getCatalogDb();
  if (db) {
    liveTeasers = await loadLandingLiveTeasers(db, locale);
  }
  const pathname = new URL(c.req.url).pathname;
  const meta = landingPageMeta(content);
  const jsonLd = buildOrganizationJsonLd(locale);

  return c.render(
    <>
      <LandingPageV3 content={content} locale={locale} teasers={liveTeasers} />
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
