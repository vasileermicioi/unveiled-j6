import type { MemberListItem, UserRole } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import { buildAdminListQueryString } from "../../lib/admin-list";
import type { Locale } from "../../lib/locale";

import { AdminPageShell } from "./AdminPageShell";
import { AdminPagination } from "./AdminPagination";
import { AdminUsersSearchForm } from "./AdminUsersSearchForm";
import { AdminUsersTable } from "./AdminUsersTable";

type AdminUsersListPageProps = {
  locale: Locale;
  members: MemberListItem[];
  query: {
    q: string;
    page: number;
    limit: number;
    role?: UserRole;
  };
  total: number;
};

export function AdminUsersListPage({ locale, members, query, total }: AdminUsersListPageProps) {
  const copy = getAdminCopy(locale);
  const listPath = `/${locale}/admin/users`;
  const queryString = buildAdminListQueryString({
    q: query.q || undefined,
    page: query.page,
    role: query.role,
  });

  return (
    <AdminPageShell subtitle={copy.usersSubtitle} title={copy.usersTitle}>
      <AdminUsersSearchForm
        action={listPath}
        defaultQuery={query.q}
        defaultRole={query.role ?? ""}
        locale={locale}
      />
      <AdminUsersTable locale={locale} members={members} />
      <AdminPagination
        basePath={listPath}
        locale={locale}
        page={query.page}
        pageSize={query.limit}
        queryString={queryString}
        total={total}
      />
    </AdminPageShell>
  );
}
