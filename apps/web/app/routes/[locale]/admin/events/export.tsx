import {
  buildEventsExportQueryString,
  formatEventsCsv,
  listEventsForExport,
  parseEventsExportFilters,
} from "@unveiled/db";
import { createRoute } from "honox/factory";

import { AdminEventsExportPage } from "../../../../components/admin/AdminEventsExportPage";
import { getAdminCopy } from "../../../../lib/admin-content";
import { renderAdminPage } from "../../../../lib/admin-render";
import { guardAdminRoute } from "../../../../lib/admin-route";
import { getAuthOptions } from "../../../../lib/auth";

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const url = new URL(c.req.url);
  const format = url.searchParams.get("format");
  const filters = parseEventsExportFilters(url);
  const published =
    filters.published === "yes" ? true : filters.published === "no" ? false : undefined;

  const { db } = getAuthOptions();
  const events = await listEventsForExport(db, {
    title: filters.title || undefined,
    partner: filters.partner || undefined,
    language: filters.language || undefined,
    published,
  });

  if (format === "csv") {
    const csv = formatEventsCsv(events);
    return c.body(csv, 200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="events-export.csv"`,
    });
  }

  const copy = getAdminCopy(guard.locale);
  const queryString = buildEventsExportQueryString({
    title: filters.title,
    partner: filters.partner,
    language: filters.language,
    published: filters.published,
  });

  return renderAdminPage(
    c,
    <AdminEventsExportPage
      events={events}
      languageFilter={filters.language}
      locale={guard.locale}
      partnerFilter={filters.partner}
      publishedFilter={filters.published}
      titleFilter={filters.title}
    />,
    {
      locale: guard.locale,
      title: copy.eventsExportTitle,
      subtitle: copy.eventsExportSubtitle,
      canonicalPath: `/${guard.locale}/admin/events/export${queryString}`,
    },
  );
});
