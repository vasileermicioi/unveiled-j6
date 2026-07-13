import { listBookableEventsForSitemap } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { getCatalogDb } from "../lib/catalog-db";
import { LOCALES, localizedPath } from "../lib/locale";
import { absoluteUrl } from "../lib/site-config";
import { buildSitemapXml, type SitemapUrlEntry, toSitemapLastmod } from "../lib/sitemap";

const SITEMAP_STATIC_PATHS = [
  "",
  "how-it-works",
  "faq",
  "membership",
  "impressum",
  "privacy",
  "terms",
] as const;

function buildStaticEntries(): SitemapUrlEntry[] {
  return LOCALES.flatMap((locale) =>
    SITEMAP_STATIC_PATHS.map((segment) => ({
      loc: absoluteUrl(localizedPath(locale, segment)),
    })),
  );
}

export default createRoute(async (c) => {
  const entries = buildStaticEntries();

  const db = getCatalogDb();
  if (db) {
    try {
      const bookable = await listBookableEventsForSitemap(db);
      for (const event of bookable) {
        const lastmod = toSitemapLastmod(event.updatedAt);
        for (const locale of LOCALES) {
          entries.push({
            loc: absoluteUrl(localizedPath(locale, `events/${event.id}`)),
            lastmod,
          });
        }
      }
    } catch (error) {
      console.error("sitemap bookable events fetch failed", error);
    }
  }

  return c.body(buildSitemapXml(entries), 200, {
    "Content-Type": "application/xml; charset=utf-8",
  });
});
