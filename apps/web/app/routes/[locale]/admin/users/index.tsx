import { countMembers, listMembers } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { AdminUsersListPage } from "../../../../components/admin/AdminUsersListPage";
import { getAdminCopy } from "../../../../lib/admin-content";
import { renderAdminPage } from "../../../../lib/admin-render";
import {
  adminUsersListPageRedirectPath,
  buildAdminUsersListQueryString,
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
  const filters = {
    q: listQuery.q || undefined,
    role: listQuery.role,
    subscription: listQuery.subscription,
    creditsMin: listQuery.creditsMin,
    creditsMax: listQuery.creditsMax,
    bookingsMin: listQuery.bookingsMin,
    bookingsMax: listQuery.bookingsMax,
    eventOpensMin: listQuery.eventOpensMin,
    eventOpensMax: listQuery.eventOpensMax,
    createdFrom: listQuery.createdFrom,
    createdTo: listQuery.createdTo,
  };
  const total = await countMembers(db, filters);
  const listPath = `/${guard.locale}/admin/users`;
  const redirectPath = adminUsersListPageRedirectPath(listPath, listQuery, total);
  if (redirectPath) {
    return c.redirect(redirectPath, 302);
  }

  const members = await listMembers(db, {
    ...filters,
    sort: listQuery.sort,
    dir: listQuery.dir,
    limit: listQuery.limit,
    offset: listQuery.offset,
  });

  const copy = getAdminCopy(guard.locale);
  const queryString = buildAdminUsersListQueryString({
    q: listQuery.q || undefined,
    page: listQuery.page,
    role: listQuery.role,
    subscription: listQuery.subscription,
    creditsMin: listQuery.creditsMin,
    creditsMax: listQuery.creditsMax,
    bookingsMin: listQuery.bookingsMin,
    bookingsMax: listQuery.bookingsMax,
    eventOpensMin: listQuery.eventOpensMin,
    eventOpensMax: listQuery.eventOpensMax,
    createdFrom: listQuery.createdFrom,
    createdTo: listQuery.createdTo,
    sort: listQuery.sort,
    dir: listQuery.dir,
  });
  const ok = new URL(c.req.url).searchParams.get("ok");
  const successMessage = ok === "delete-account" ? copy.deleteAccountSuccess : null;

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
        subscription: listQuery.subscription,
        creditsMin: listQuery.creditsMin,
        creditsMax: listQuery.creditsMax,
        bookingsMin: listQuery.bookingsMin,
        bookingsMax: listQuery.bookingsMax,
        eventOpensMin: listQuery.eventOpensMin,
        eventOpensMax: listQuery.eventOpensMax,
        createdFrom: listQuery.createdFrom ?? "",
        createdTo: listQuery.createdTo ?? "",
        sort: listQuery.sort,
        dir: listQuery.dir,
      }}
      successMessage={successMessage}
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
