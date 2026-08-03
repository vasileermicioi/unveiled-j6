import {
  buildSalesExportQueryString,
  formatSalesByEventCsv,
  listSalesByEvent,
  parseSalesExportFilters,
  resolveSalesExportPeriod,
} from "@unveiled/db";
import { createRoute } from "honox/factory";

import { AdminSalesExportPage } from "../../../../components/admin/AdminSalesExportPage";
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
  const filters = parseSalesExportFilters(url);
  const period = resolveSalesExportPeriod({
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });

  if (format === "csv") {
    if (!period.ok) {
      return c.text("Invalid period", 400);
    }

    const { db } = getAuthOptions();
    const rows = await listSalesByEvent(db, {
      from: period.from,
      to: period.to,
      title: filters.title || undefined,
      partner: filters.partner || undefined,
    });
    const csv = formatSalesByEventCsv(rows);

    return c.body(csv, 200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sales-export-${period.from}-${period.to}.csv"`,
    });
  }

  const copy = getAdminCopy(guard.locale);

  if (!period.ok) {
    return renderAdminPage(
      c,
      <AdminSalesExportPage
        from={period.from}
        locale={guard.locale}
        partnerFilter={filters.partner}
        periodError
        rows={[]}
        titleFilter={filters.title}
        to={period.to}
      />,
      {
        locale: guard.locale,
        title: copy.salesExportTitle,
        subtitle: copy.salesExportSubtitle,
        canonicalPath: `/${guard.locale}/admin/partners/export`,
      },
    );
  }

  const { db } = getAuthOptions();
  const rows = await listSalesByEvent(db, {
    from: period.from,
    to: period.to,
    title: filters.title || undefined,
    partner: filters.partner || undefined,
  });
  const queryString = buildSalesExportQueryString({
    from: period.from,
    to: period.to,
    title: filters.title,
    partner: filters.partner,
  });

  return renderAdminPage(
    c,
    <AdminSalesExportPage
      from={period.from}
      locale={guard.locale}
      partnerFilter={filters.partner}
      rows={rows}
      titleFilter={filters.title}
      to={period.to}
    />,
    {
      locale: guard.locale,
      title: copy.salesExportTitle,
      subtitle: copy.salesExportSubtitle,
      canonicalPath: `/${guard.locale}/admin/partners/export${queryString}`,
    },
  );
});
