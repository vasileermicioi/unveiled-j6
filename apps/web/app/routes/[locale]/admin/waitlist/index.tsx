import { listAdminWaitlistEntries } from "@unveiled/db";
import { createRoute } from "honox/factory";
import { AdminWaitlistListPage } from "../../../../components/admin/AdminWaitlistListPage";
import { adminWaitlistPath } from "../../../../components/admin/admin-tabs";
import { getAdminCopy } from "../../../../lib/admin-content";
import { renderAdminPage } from "../../../../lib/admin-render";
import {
  adminWaitlistListPageRedirectPath,
  buildAdminWaitlistQueryString,
  guardAdminRoute,
  parseAdminWaitlistListQuery,
} from "../../../../lib/admin-route";
import { getAuthOptions } from "../../../../lib/auth";

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const listQuery = parseAdminWaitlistListQuery(new URL(c.req.url));
  const { db } = getAuthOptions();
  const { items, total } = await listAdminWaitlistEntries(db, {
    eventId: listQuery.eventId,
    status: listQuery.status,
    limit: listQuery.limit,
    offset: listQuery.offset,
  });

  const listPath = adminWaitlistPath(guard.locale);
  const redirectPath = adminWaitlistListPageRedirectPath(listPath, listQuery, total);
  if (redirectPath) {
    return c.redirect(redirectPath, 302);
  }

  const queryString = buildAdminWaitlistQueryString({
    eventId: listQuery.eventId,
    status: listQuery.status,
  });
  const copy = getAdminCopy(guard.locale);

  return renderAdminPage(
    c,
    <AdminWaitlistListPage
      entries={items}
      eventId={listQuery.eventId}
      locale={guard.locale}
      page={listQuery.page}
      pageSize={listQuery.limit}
      queryString={queryString}
      status={listQuery.status}
      total={total}
    />,
    {
      locale: guard.locale,
      title: copy.waitlistTitle,
      subtitle: copy.waitlistSubtitle,
      canonicalPath: listPath,
    },
  );
});
