import { listFeaturedEvents } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { AdminFeaturedListPage } from "../../../../components/admin/AdminFeaturedListPage";
import { adminFeaturedPath } from "../../../../components/admin/admin-tabs";
import { getAdminCopy } from "../../../../lib/admin-content";
import { renderAdminPage } from "../../../../lib/admin-render";
import { guardAdminRoute } from "../../../../lib/admin-route";
import { getAuthOptions } from "../../../../lib/auth";

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const { db } = getAuthOptions();
  const events = await listFeaturedEvents(db);
  const copy = getAdminCopy(guard.locale);
  const listPath = adminFeaturedPath(guard.locale);

  return renderAdminPage(c, <AdminFeaturedListPage events={events} locale={guard.locale} />, {
    locale: guard.locale,
    title: copy.featuredTitle,
    subtitle: copy.featuredSubtitle,
    canonicalPath: listPath,
  });
});
