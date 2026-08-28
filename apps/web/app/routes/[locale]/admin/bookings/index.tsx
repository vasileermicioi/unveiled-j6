import { listEventsWithBookingStats } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { AdminEventBookingsIndexPage } from "../../../../components/admin/AdminEventBookingsIndexPage";
import { adminBookingsPath } from "../../../../components/admin/admin-tabs";
import { getAdminCopy } from "../../../../lib/admin-content";
import { renderAdminPage } from "../../../../lib/admin-render";
import {
  adminListPageRedirectPath,
  guardAdminRoute,
  parseAdminEventBookingsIndexQuery,
} from "../../../../lib/admin-route";
import { getAuthOptions } from "../../../../lib/auth";

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const listQuery = parseAdminEventBookingsIndexQuery(new URL(c.req.url));
  const { db } = getAuthOptions();
  const { items, total } = await listEventsWithBookingStats(db, {
    title: listQuery.title || undefined,
    partner: listQuery.partner || undefined,
    page: listQuery.page,
    limit: listQuery.limit,
  });

  const listPath = adminBookingsPath(guard.locale);
  const redirectPath = adminListPageRedirectPath(
    listPath,
    {
      q: "",
      page: listQuery.page,
      offset: listQuery.offset,
      limit: listQuery.limit,
      title: listQuery.title,
      partner: listQuery.partner,
    },
    total,
  );
  if (redirectPath) {
    return c.redirect(redirectPath, 302);
  }

  const copy = getAdminCopy(guard.locale);

  return renderAdminPage(
    c,
    <AdminEventBookingsIndexPage
      items={items}
      locale={guard.locale}
      page={listQuery.page}
      pageSize={listQuery.limit}
      partner={listQuery.partner}
      title={listQuery.title}
      total={total}
    />,
    {
      locale: guard.locale,
      title: copy.bookingsIndexTitle,
      subtitle: copy.bookingsIndexSubtitle,
      canonicalPath: listPath,
    },
  );
});
