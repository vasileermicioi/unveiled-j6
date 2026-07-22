import { listFeaturedEvents, listPartners } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { DiscoverPage } from "../../components/marketing/DiscoverPage";
import { getCatalogDb } from "../../lib/catalog-db";
import { toDiscoverPartnerTile, toEventCardItem } from "../../lib/catalog-mappers";
import { getPageContent } from "../../lib/content";
import { getCopy } from "../../lib/copy";
import type { Locale } from "../../lib/locale";
import { isValidLocale } from "../../lib/locale";
import { buildOrganizationJsonLd, discoverPageMeta } from "../../lib/seo";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default createRoute(async (c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const session = c.get("session") ?? null;
  const canBrowseEvents = c.get("canBrowseEvents") ?? false;

  // Booking-eligible USERs browse the full feed — Discover is for guests / non-active.
  if (session?.user.role === "USER" && canBrowseEvents) {
    return c.redirect(`/${locale}/events`, 302);
  }

  const content = getPageContent(locale, "discover");
  const copy = getCopy(locale);
  const pathname = new URL(c.req.url).pathname;
  const meta = discoverPageMeta(content, copy.nav.discover);
  const jsonLd = buildOrganizationJsonLd(locale);

  let events: ReturnType<typeof toEventCardItem>[] = [];
  let partners: ReturnType<typeof toDiscoverPartnerTile>[] = [];

  const db = getCatalogDb();
  if (db) {
    try {
      const [featuredEvents, partnerRows] = await Promise.all([
        // Show all curated featured rows (including past) — Discover has no date filter.
        listFeaturedEvents(db),
        listPartners(db, { limit: 8 }),
      ]);

      events = featuredEvents.map(toEventCardItem);
      partners = partnerRows.map(toDiscoverPartnerTile);
    } catch (error) {
      console.error("discover catalog fetch failed", error);
    }
  }

  return c.render(
    <>
      <DiscoverPage content={content} events={events} locale={locale} partners={partners} />
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
