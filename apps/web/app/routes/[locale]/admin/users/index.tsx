import { countMembers, listMembers } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { AdminUsersListPage } from "../../../../components/admin/AdminUsersListPage";
import { getAdminCopy } from "../../../../lib/admin-content";
import { renderAdminPage } from "../../../../lib/admin-render";
import {
  adminListPageRedirectPath,
  buildAdminListQueryString,
  guardAdminRoute,
  parseAdminUsersListQuery,
} from "../../../../lib/admin-route";
import { getAuthOptions } from "../../../../lib/auth";

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const listQuery = parseAdminUsersListQuery(new URL(c.req.url));
  const { db } = getAuthOptions();
  const total = await countMembers(db, {
    q: listQuery.q || undefined,
    role: listQuery.role,
  });
  const listPath = `/${guard.locale}/admin/users`;
  const redirectPath = adminListPageRedirectPath(listPath, listQuery, total);
  if (redirectPath) {
    return c.redirect(redirectPath, 302);
  }

  const members = await listMembers(db, {
    q: listQuery.q || undefined,
    role: listQuery.role,
    limit: listQuery.limit,
    offset: listQuery.offset,
  });

  const copy = getAdminCopy(guard.locale);
  const queryString = buildAdminListQueryString({
    q: listQuery.q || undefined,
    page: listQuery.page,
    role: listQuery.role,
  });

  return renderAdminPage(
    c,
    <AdminUsersListPage
      locale={guard.locale}
      members={members}
      query={{
        q: listQuery.q,
        page: listQuery.page,
        limit: listQuery.limit,
        role: listQuery.role,
      }}
      total={total}
    />,
    {
      locale: guard.locale,
      title: copy.usersTitle,
      subtitle: copy.usersSubtitle,
      canonicalPath: `/${guard.locale}/admin/users${queryString}`,
    },
  );
});
